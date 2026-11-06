import { KeyRound, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { ProgressSteps } from '@/components/ui/ProgressSteps'
import { useAuthModal } from '@/hooks/useAuthModal'
import { isEmail, isStrongPassword } from '@/lib/validation'
import { services, type ServiceError } from '@/services'
import { AuthErrorAlert, AuthHeader, AuthSuccess, BackButton, PasswordStrength, PreviewBanner } from './AuthParts'
import { DEFAULT_RESEND_COOLDOWN } from './constants'
import { OtpVerification } from './OtpVerification'

type Step = 'email' | 'verify' | 'password' | 'done'
const STEPS: Step[] = ['email', 'verify', 'password']

export function ForgotPasswordFlow() {
  const { openAuth } = useAuthModal()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string>()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<{ password?: string; confirm?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)
  const [preview, setPreview] = useState(false)
  const [cooldown, setCooldown] = useState(DEFAULT_RESEND_COOLDOWN)

  const goTo = (next: Step) => {
    setError(null)
    setStep(next)
  }

  const requestCode = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = email.trim()
    const message = !trimmed ? 'Enter your registered email address.' : isEmail(trimmed) ? undefined : 'Enter a valid email address.'
    setEmailError(message)
    if (message) return

    setSubmitting(true)
    const result = await services.auth.requestPasswordReset(trimmed)
    setSubmitting(false)
    if (result.ok) {
      setPreview(false)
      setCooldown(result.data.resendCooldownSeconds)
      goTo('verify')
    } else {
      setError(result.error)
    }
  }

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault()
    const next = {
      password: !password ? 'Enter a new password.' : isStrongPassword(password) ? undefined : 'Your password doesn’t meet all the requirements.',
      confirm: !confirm ? 'Confirm your new password.' : confirm === password ? undefined : 'Passwords don’t match.',
    }
    setPasswordErrors(next)
    if (next.password || next.confirm) return

    setSubmitting(true)
    const result = await services.auth.updatePassword(password)
    setSubmitting(false)
    if (result.ok) goTo('done')
    else setError(result.error)
  }

  if (step === 'done') {
    return (
      <AuthSuccess
        title="Password updated"
        description="Your password has been changed. Log in with your new password."
        actionLabel="Back to log in"
        onAction={() => openAuth('login')}
      />
    )
  }

  return (
    <>
      <ProgressSteps steps={['Email', 'Verify code', 'New password']} current={STEPS.indexOf(step)} className="mb-6" />

      {step === 'email' && (
        <form noValidate onSubmit={requestCode} className="space-y-6">
          <AuthHeader
            icon={<KeyRound />}
            title="Forgot your password?"
            description="Enter the email you registered with and we’ll send you a 6-digit code to reset it."
          />
          <Input
            label="Registered email address"
            type="email"
            autoComplete="email"
            leftIcon={<Mail />}
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailError(undefined)
              setError(null)
            }}
            error={emailError}
          />
          {error && (
            <AuthErrorAlert
              error={error}
              previewLabel="Preview code verification"
              onPreview={() => {
                setPreview(true)
                setCooldown(DEFAULT_RESEND_COOLDOWN)
                goTo('verify')
              }}
            />
          )}
          <Button type="submit" size="lg" fullWidth loading={submitting}>
            {submitting ? 'Sending code…' : 'Send reset code'}
          </Button>
          <div className="text-center">
            <BackButton onClick={() => openAuth('login')} label="Back to log in" />
          </div>
        </form>
      )}

      {step === 'verify' && (
        <OtpVerification
          email={email.trim()}
          title="Enter your reset code"
          verifyLabel="Verify code"
          preview={preview}
          initialCooldown={cooldown}
          onVerify={(code) => services.auth.verifyPasswordResetOtp(email.trim(), code)}
          onResend={() => services.auth.resendOtp(email.trim(), 'password_reset')}
          onVerified={() => goTo('password')}
          onPreviewContinue={preview ? () => goTo('password') : undefined}
          onBack={() => goTo('email')}
        />
      )}

      {step === 'password' && (
        <form noValidate onSubmit={updatePassword} className="space-y-6">
          {preview && <PreviewBanner>The backend isn’t connected, so no code was verified and your password can’t be changed.</PreviewBanner>}
          <AuthHeader icon={<KeyRound />} title="Choose a new password" description="Use a password you haven’t used on HeyCileng before." />
          <div className="space-y-4">
            <PasswordInput
              label="New password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setPasswordErrors((p) => ({ ...p, password: undefined }))
                setError(null)
              }}
              error={passwordErrors.password}
            />
            <PasswordStrength password={password} />
            <PasswordInput
              label="Confirm new password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value)
                setPasswordErrors((p) => ({ ...p, confirm: undefined }))
                setError(null)
              }}
              error={passwordErrors.confirm}
            />
          </div>
          {error && <AuthErrorAlert error={error} />}
          <Button type="submit" size="lg" fullWidth loading={submitting}>
            {submitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      )}
    </>
  )
}
