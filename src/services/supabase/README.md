# Supabase integration notes

Nothing in this folder is implemented yet. The UI talks to the contracts in `../types.ts`; a Supabase
implementation of each contract goes here and is wired up in `../index.ts`.

## Auth (`AuthService`)

| Contract method | Supabase Auth call | Notes |
|---|---|---|
| `signUp` | `auth.signUp({ email, password, options: { data } })` | Configure the email template to send a 6-digit **OTP** (`{{ .Token }}`), not a magic link. Store profile fields (name, phone, business details) via a trigger into `profiles` / `seller_profiles`. |
| `verifySignupOtp` | `auth.verifyOtp({ email, token, type: 'signup' })` | Map `otp_expired` → `expired_otp`, invalid token → `invalid_otp`. |
| `resendOtp(email, 'signup')` | `auth.resend({ type: 'signup', email })` | Return the cooldown the project enforces; map 429 → `rate_limited`. |
| `signIn` | `auth.signInWithPassword` | Map `email_not_confirmed` → `email_not_verified`, `invalid_credentials` → `invalid_credentials`. Use `remember` to choose persistent vs session storage for the client. |
| `requestPasswordReset` | `auth.resetPasswordForEmail(email)` | Email template must contain `{{ .Token }}` (OTP), not a reset link. Always return success to avoid revealing which emails are registered. |
| `verifyPasswordResetOtp` | `auth.verifyOtp({ email, token, type: 'recovery' })` | Creates a short-lived session that authorises the password update. |
| `updatePassword` | `auth.updateUser({ password })` | Sign out other sessions afterwards. |
| `signOut` | `auth.signOut()` | |

## Security rules that must live on the backend

- **Role assignment.** New users are `buyer` or `seller` only. `admin` is granted manually by HeyCileng, never from signup metadata.
- **RLS** on every table; buyers and sellers must never be able to read each other's phone numbers or emails.
- Inventory reservations, order state transitions, commission calculation and logistics assignment happen in database functions / edge functions, not in the browser.
