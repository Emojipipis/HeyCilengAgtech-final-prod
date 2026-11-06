/**
 * Client-side validation for user feedback only.
 * The backend must re-validate everything — never rely on these for security.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim())
}

/** Accepts international formats: optional +, digits, spaces, dashes, parentheses; 7–15 digits. */
export function isPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  return /^\+?[\d\s\-()]+$/.test(value.trim()) && digits.length >= 7 && digits.length <= 15
}

export interface PasswordCheck {
  label: string
  passed: boolean
}

export function passwordChecks(value: string): PasswordCheck[] {
  return [
    { label: 'At least 8 characters', passed: value.length >= 8 },
    { label: 'An uppercase letter', passed: /[A-Z]/.test(value) },
    { label: 'A lowercase letter', passed: /[a-z]/.test(value) },
    { label: 'A number', passed: /\d/.test(value) },
  ]
}

export function isStrongPassword(value: string) {
  return passwordChecks(value).every((check) => check.passed)
}

export type Errors<T> = Partial<Record<keyof T, string>>

export function hasErrors<T>(errors: Errors<T>) {
  return Object.values(errors).some(Boolean)
}
