import type { ServiceError, ServiceResult } from '../types'

interface BackendError {
  message?: string
  code?: string
  status?: number
}

/**
 * Turns Supabase/Postgres errors into the app's ServiceError.
 * Database functions raise readable messages (e.g. "Only 9 tonnes is available."), which are passed through.
 */
/** True when Supabase Auth failed to send a verification or reset email. */
export function isEmailSendFailure(error: BackendError | null | undefined) {
  return !!error && /error sending .*email|smtp/i.test(error.message ?? '')
}

export function toServiceError(error: BackendError | null | undefined, fallback = 'Something went wrong. Please try again.'): ServiceError {
  if (!error) return { code: 'unknown', message: fallback }
  const message = error.message ?? fallback
  if (error.status === 429 || error.code === 'over_email_send_rate_limit' || /rate limit/i.test(message)) {
    return { code: 'rate_limited', message: 'Too many attempts. Please wait a minute and try again.' }
  }
  // Supabase Auth couldn't hand the email to the SMTP provider (e.g. provider rejected the server).
  if (isEmailSendFailure(error)) {
    return { code: 'unknown', message: 'We couldn’t send the email right now. Please try again in a few minutes, or contact HeyCileng support if it keeps happening.' }
  }
  if (error.code === 'PGRST116') return { code: 'not_found', message: 'That item couldn’t be found.' }
  if (error.code === '42501' || /permission denied|row-level security/i.test(message)) {
    return { code: 'unauthorised', message: 'You don’t have permission to do that.' }
  }
  if (/failed to fetch|network/i.test(message)) return { code: 'network', message: 'Can’t reach HeyCileng. Check your connection and try again.' }
  // P0001 = raised by our database functions: a readable business-rule message.
  if (error.code === 'P0001' || error.code === '23514') return { code: 'validation', message }
  return { code: 'unknown', message }
}

export const fail = <T>(error: BackendError | null | undefined, fallback?: string): ServiceResult<T> => ({ ok: false, error: toServiceError(error, fallback) })
export const ok = <T>(data: T): ServiceResult<T> => ({ ok: true, data })
export const notFound = <T>(what: string): ServiceResult<T> => ({ ok: false, error: { code: 'not_found', message: `${what} couldn’t be found.` } })
export const invalid = <T>(message: string): ServiceResult<T> => ({ ok: false, error: { code: 'validation', message } })
export const signedOut = <T>(): ServiceResult<T> => ({ ok: false, error: { code: 'unauthorised', message: 'Please sign in again.' } })
