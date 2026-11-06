import { LogIn, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { DASHBOARD_PATH } from '@/config/routes'
import { useAuthModal } from '@/hooks/useAuthModal'
import { useSession } from '@/hooks/useSession'
import { hasErrors, isEmail, type Errors } from '@/lib/validation'
import { services, type ServiceError } from '@/services'
import type { SignInInput } from '@/types/user'
import { AuthErrorAlert, AuthHeader } from './AuthParts'
import { OtpVerification } from './OtpVerification'

function validate(values: SignInInput): Errors<SignInInput> {
  return {
    email: !values.email.trim() ? 'Enter your email address.' : isEmail(values.email) ? undefined : 'Enter a valid email address.',
    password: values.password ? undefined : 'Enter your password.',
  }
}

export function LoginForm() {
  const navigate = useNavigate()
  const { openAuth, closeAuth } = useAuthModal()
  const { signedIn } = useSession()
  const [values, setValues] = useState<SignInInput>({ email: '', password: '', remember: true })
  const [errors, setErrors] = useState<Errors<SignInInput>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [justVerified, setJustVerified] = useState(false)

  const set = <K extends keyof SignInInput>(key: K, value: SignInInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
    setError(null)
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    setSubmitting(true)
    const result = await services.auth.signIn({ ...values, email: values.email.trim() })
    setSubmitting(false)
    if (result.ok) {
      // Store the session first: the dashboard guard must not see a signed-out state and bounce back to login.
      signedIn(result.data)
      closeAuth()
      navigate(DASHBOARD_PATH[result.data.user.role])
    } else {
      setError(result.error)
    }
  }

  if (verifying) {
    return (
      <OtpVerification
        email={values.email.trim()}
        title="Verify your email"
        onVerify={(code) => services.auth.verifySignupOtp(values.email.trim(), code)}
        onResend={() => services.auth.resendOtp(values.email.trim(), 'signup')}
        onVerified={() => {
          setVerifying(false)
          setError(null)
          setJustVerified(true)
        }}
        onBack={() => setVerifying(false)}
        backLabel="Back to login"
        initialCooldown={0}
      />
    )
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-6">
      <AuthHeader icon={<LogIn />} title="Welcome back" description="Log in to manage your listings, requirements and orders." />

      <div className="space-y-4">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          leftIcon={<Mail />}
          value={values.email}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email}
          required
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => set('password', e.target.value)}
          error={errors.password}
          required
        />
        <div className="flex items-center justify-between gap-3">
          <Checkbox label="Remember me" checked={values.remember} onChange={(e) => set('remember', e.target.checked)} />
          <button
            type="button"
            onClick={() => openAuth('forgot-password')}
            className="text-sm font-semibold text-action underline-offset-4 hover:underline"
          >
            Forgot password?
          </button>
        </div>
      </div>

      {justVerified && !error && (
        <Alert tone="success" title="Email verified" onDismiss={() => setJustVerified(false)}>
          You can now log in.
        </Alert>
      )}

      {error &&
        (error.code === 'invalid_credentials' ? (
          <AuthErrorAlert error={{ ...error, message: 'The email or password is incorrect.' }} />
        ) : error.code === 'email_not_verified' ? (
          <div className="space-y-3">
            <AuthErrorAlert error={{ ...error, message: 'Please verify your email address before logging in.' }} />
            <Button variant="outline" fullWidth onClick={() => setVerifying(true)}>
              Verify my email
            </Button>
          </div>
        ) : (
          <AuthErrorAlert error={error} onDismiss={() => setError(null)} />
        ))}

      <Button type="submit" size="lg" fullWidth loading={submitting}>
        {submitting ? 'Logging in…' : 'Log in'}
      </Button>

      <p className="text-center text-sm text-muted">
        New to HeyCileng?{' '}
        <button type="button" onClick={() => openAuth('signup')} className="font-semibold text-action underline-offset-4 hover:underline">
          Create an account
        </button>
      </p>
    </form>
  )
}
