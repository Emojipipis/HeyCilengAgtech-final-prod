import { MailCheck, RotateCw } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { OtpInput } from '@/components/ui/OtpInput'
import { useCountdown } from '@/hooks/useCountdown'
import type { OtpDispatch, ServiceError, ServiceResult } from '@/services'
import { AuthErrorAlert, AuthHeader, BackButton, PreviewBanner } from './AuthParts'
import { DEFAULT_RESEND_COOLDOWN, OTP_LENGTH } from './constants'

export type OtpFeedback =
  | { kind: 'none' }
  | { kind: 'error'; error: ServiceError }
  | { kind: 'resent'; email: string }
  | { kind: 'incomplete' }

export interface OtpVerificationProps {
  email: string
  title?: string
  description?: string
  verifyLabel?: string
  /** Backend not connected: show a preview banner. */
  preview?: boolean
  onVerify: (code: string) => Promise<ServiceResult<{ verified: true }>>
  onResend: () => Promise<ServiceResult<OtpDispatch>>
  onVerified: () => void
  onBack?: () => void
  backLabel?: string
  /** Shown with the not-connected warning when verification can't run, to continue the interface preview. */
  onPreviewContinue?: () => void
  initialCooldown?: number
  /** Start in a given feedback state — used by the design-system gallery. */
  initialFeedback?: OtpFeedback
  initialCode?: string
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  if (!domain) return email
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(1, name.length - 2))}@${domain}`
}

export function OtpVerification({
  email,
  title = 'Check your email',
  description,
  verifyLabel = 'Verify email',
  preview = false,
  onVerify,
  onResend,
  onVerified,
  onBack,
  backLabel = 'Use a different email',
  onPreviewContinue,
  initialCooldown = DEFAULT_RESEND_COOLDOWN,
  initialFeedback = { kind: 'none' },
  initialCode = '',
}: OtpVerificationProps) {
  const [code, setCode] = useState(initialCode)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [feedback, setFeedback] = useState<OtpFeedback>(initialFeedback)
  const cooldown = useCountdown(initialCooldown)

  const invalid = feedback.kind === 'incomplete' || (feedback.kind === 'error' && ['invalid_otp', 'expired_otp'].includes(feedback.error.code))
  const expired = feedback.kind === 'error' && feedback.error.code === 'expired_otp'

  const verify = async (value = code) => {
    if (value.length !== OTP_LENGTH) {
      setFeedback({ kind: 'incomplete' })
      return
    }
    setVerifying(true)
    const result = await onVerify(value)
    setVerifying(false)
    if (result.ok) onVerified()
    else setFeedback({ kind: 'error', error: result.error })
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void verify()
  }

  const resend = async () => {
    setResending(true)
    const result = await onResend()
    setResending(false)
    if (result.ok) {
      setCode('')
      setFeedback({ kind: 'resent', email: result.data.email })
      cooldown.start(result.data.resendCooldownSeconds)
    } else {
      setFeedback({ kind: 'error', error: result.error })
      if (result.error.code === 'rate_limited') cooldown.start(DEFAULT_RESEND_COOLDOWN)
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-6">
      {preview && <PreviewBanner />}

      <AuthHeader
        icon={<MailCheck />}
        title={title}
        description={
          description ?? (
            <>
              We sent a {OTP_LENGTH}-digit code to <span className="font-semibold text-fg">{maskEmail(email)}</span>. Enter it below to
              continue.
            </>
          )
        }
      />

      <div className="space-y-3">
        <OtpInput
          value={code}
          onChange={(next) => {
            setCode(next)
            if (feedback.kind === 'incomplete' || feedback.kind === 'error') setFeedback({ kind: 'none' })
          }}
          length={OTP_LENGTH}
          invalid={invalid}
          disabled={verifying}
          describedBy="otp-feedback"
          onComplete={(value) => void verify(value)}
        />

        <div id="otp-feedback" aria-live="polite">
          {feedback.kind === 'incomplete' && (
            <p className="text-center text-sm text-red-600 dark:text-red-400">Enter all {OTP_LENGTH} digits of the code.</p>
          )}
          {feedback.kind === 'error' && feedback.error.code === 'invalid_otp' && (
            <Alert tone="error" title="Code not accepted">
              That code is incorrect or has expired. Check the latest email from HeyCileng, or request a new code below.
            </Alert>
          )}
          {expired && (
            <Alert tone="warning" title="Code expired">
              This code is no longer valid. Request a new code below.
            </Alert>
          )}
          {feedback.kind === 'error' && !['invalid_otp', 'expired_otp'].includes(feedback.error.code) && (
            <AuthErrorAlert error={feedback.error} onPreview={onPreviewContinue} previewLabel="Continue the preview" />
          )}
          {feedback.kind === 'resent' && (
            <Alert tone="success" title="New code sent">
              Check {maskEmail(feedback.email)}. Earlier codes no longer work.
            </Alert>
          )}
        </div>
      </div>

      <Button type="submit" fullWidth size="lg" loading={verifying} disabled={code.length === 0}>
        {verifying ? 'Verifying…' : verifyLabel}
      </Button>

      <div className="flex flex-col items-center gap-3 text-sm">
        <p className="text-muted">
          Didn’t get a code?{' '}
          {cooldown.running ? (
            <span className="font-medium text-fg tabular-nums" aria-live="off">
              Resend in 0:{String(cooldown.remaining).padStart(2, '0')}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void resend()}
              disabled={resending}
              className="inline-flex items-center gap-1 font-semibold text-action underline-offset-4 hover:underline disabled:opacity-60"
            >
              <RotateCw className={resending ? 'size-3.5 animate-spin' : 'size-3.5'} aria-hidden="true" />
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </p>
        <p className="text-center text-xs text-subtle">Check your spam folder. Codes expire after 10 minutes.</p>
        {onBack && <BackButton onClick={onBack} label={backLabel} />}
      </div>
    </form>
  )
}
