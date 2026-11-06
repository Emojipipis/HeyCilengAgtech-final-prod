import type { AuthService } from '../types'
import { delay, notConnected } from './shared'

/**
 * Placeholder until Supabase Auth is connected. Every call reports `not_connected`:
 * no account is created, no email is sent, and nothing is ever verified.
 */
export const demoAuthService: AuthService = {
  async signUp() {
    await delay()
    return notConnected('Account creation')
  },
  async signIn() {
    await delay()
    return notConnected('Signing in')
  },
  async resendOtp() {
    await delay(400)
    return notConnected('Sending a verification code')
  },
  async verifySignupOtp() {
    await delay()
    return notConnected('Email verification')
  },
  async requestPasswordReset() {
    await delay()
    return notConnected('Password reset')
  },
  async verifyPasswordResetOtp() {
    await delay()
    return notConnected('Code verification')
  },
  async updatePassword() {
    await delay()
    return notConnected('Updating your password')
  },
  async signOut() {
    return { ok: true, data: null }
  },
  // Demo Preview Mode never has a real session.
  async getSession() {
    return null
  },
  onSessionChange() {
    return () => undefined
  },
}
