import type { AuthError, Session as SupabaseSession } from '@supabase/supabase-js'
import type { Session } from '@/types/user'
import type { AuthService, OtpDispatch, ServiceResult } from '../types'
import { setRememberSession, supabase } from './client'
import { fail, ok } from './errors'
import { toUser, type ProfileRow } from './mappers'

const RESEND_COOLDOWN = 60

const dispatch = (email: string): ServiceResult<OtpDispatch> => ok({ email, resendCooldownSeconds: RESEND_COOLDOWN })

/** Builds the app session from the Supabase session plus the user's profile (role comes from the database). */
async function toSession(session: SupabaseSession | null): Promise<Session | null> {
  if (!session) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single<ProfileRow>()
  if (!data) return null
  return { user: toUser(data), expiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString() }
}

/**
 * Supabase answers both a wrong and an expired code with otp_expired ("Token has expired or is invalid"),
 * so the two can't be told apart — report one honest message. Rate limits and network errors pass through.
 */
function otpError(error: AuthError): ServiceResult<never> {
  if (error.status === 429 || /network|fetch/i.test(error.message)) return fail(error)
  return { ok: false, error: { code: 'invalid_otp', message: 'That code is incorrect or has expired.' } }
}

/**
 * Supabase Auth with email OTP. Sign-up confirmation and password reset emails carry a 6-digit code
 * (templates in supabase/templates, applied by scripts/auth-emails.mjs); codes expire after 10 minutes.
 */
export const supabaseAuthService: AuthService = {
  async signUp(input) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          account_type: input.accountType,
          full_name: input.fullName,
          phone: input.phone,
          ...(input.accountType === 'seller'
            ? { business_name: input.businessName, business_location: input.businessLocation, business_description: input.businessDescription }
            : {}),
        },
      },
    })
    if (error) {
      if (/already registered/i.test(error.message)) return { ok: false, error: { code: 'email_in_use', message: 'An account with this email already exists.' } }
      return fail(error)
    }
    // Supabase hides existing accounts by returning a user with no identities.
    if (data.user && data.user.identities?.length === 0) return { ok: false, error: { code: 'email_in_use', message: 'An account with this email already exists.' } }
    return dispatch(input.email)
  },

  async signIn(input) {
    setRememberSession(input.remember)
    const { data, error } = await supabase.auth.signInWithPassword({ email: input.email, password: input.password })
    if (error) {
      if (error.code === 'email_not_confirmed') return { ok: false, error: { code: 'email_not_verified', message: 'Please verify your email address before logging in.' } }
      if (error.code === 'invalid_credentials') return { ok: false, error: { code: 'invalid_credentials', message: 'The email or password is incorrect.' } }
      return fail(error)
    }
    const session = await toSession(data.session)
    if (!session) return fail(null, 'Your profile couldn’t be loaded.')
    if (session.user.status === 'suspended') {
      await supabase.auth.signOut()
      return { ok: false, error: { code: 'unauthorised', message: 'This account is suspended. Contact HeyCileng support.' } }
    }
    return ok(session)
  },

  async resendOtp(email, purpose) {
    const { error } =
      purpose === 'signup'
        ? await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: window.location.origin } })
        : await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    return error ? fail(error) : dispatch(email)
  },

  async verifySignupOtp(email, code) {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    if (error) return otpError(error)
    // The flow continues to log in, so start from a clean state.
    await supabase.auth.signOut()
    return ok({ verified: true })
  },

  async requestPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    // Don't reveal whether the email is registered: only surface rate limits and network issues.
    if (error && (error.status === 429 || /network|fetch/i.test(error.message))) return fail(error)
    return dispatch(email)
  },

  async verifyPasswordResetOtp(email, code) {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' })
    if (error) return otpError(error)
    return ok({ verified: true })
  },

  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return fail(error)
    await supabase.auth.signOut({ scope: 'others' })
    await supabase.auth.signOut()
    return ok({ updated: true })
  },

  async signOut() {
    await supabase.auth.signOut()
    return ok(null)
  },

  async getSession() {
    const { data } = await supabase.auth.getSession()
    return toSession(data.session)
  },

  onSessionChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer profile loading out of the auth callback (Supabase recommends not awaiting inside it).
      setTimeout(() => void toSession(session).then(callback), 0)
    })
    return () => data.subscription.unsubscribe()
  },
}
