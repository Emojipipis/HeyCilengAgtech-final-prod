import { Building, CircleCheckBig, MapPin, Phone, ShoppingBasket, Store, User, UserPlus } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { ProgressSteps } from '@/components/ui/ProgressSteps'
import { Textarea } from '@/components/ui/Textarea'
import { useAuthModal } from '@/hooks/useAuthModal'
import { cn } from '@/lib/cn'
import { hasErrors, isEmail, isPhone, isStrongPassword, type Errors } from '@/lib/validation'
import { services, type ServiceError } from '@/services'
import type { AccountType, SignupInput } from '@/types/user'
import { AuthErrorAlert, AuthHeader, AuthSuccess, BackButton, PasswordStrength } from './AuthParts'
import { DEFAULT_RESEND_COOLDOWN } from './constants'
import { OtpVerification } from './OtpVerification'
import { TermsDialog } from './TermsDialog'

type Step = 'type' | 'details' | 'business' | 'verify' | 'done'

interface FormValues {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  acceptedTerms: boolean
  businessName: string
  businessLocation: string
  businessDescription: string
}

const EMPTY: FormValues = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
  businessName: '',
  businessLocation: '',
  businessDescription: '',
}

const STEP_LABELS: Record<AccountType, { steps: Step[]; labels: string[] }> = {
  buyer: { steps: ['type', 'details', 'verify'], labels: ['Account type', 'Your details', 'Verify email'] },
  seller: { steps: ['type', 'details', 'business', 'verify'], labels: ['Account type', 'Your details', 'Business', 'Verify email'] },
}

function validateDetails(v: FormValues, requireTerms: boolean): Errors<FormValues> {
  return {
    fullName: v.fullName.trim().length >= 2 ? undefined : 'Enter your full name.',
    email: !v.email.trim() ? 'Enter your email address.' : isEmail(v.email) ? undefined : 'Enter a valid email address.',
    phone: !v.phone.trim() ? 'Enter your phone number.' : isPhone(v.phone) ? undefined : 'Enter a valid phone number, e.g. +234 801 234 5678.',
    password: !v.password ? 'Create a password.' : isStrongPassword(v.password) ? undefined : 'Your password doesn’t meet all the requirements.',
    confirmPassword: !v.confirmPassword
      ? 'Confirm your password.'
      : v.confirmPassword === v.password
        ? undefined
        : 'Passwords don’t match.',
    acceptedTerms: !requireTerms || v.acceptedTerms ? undefined : 'You must accept the terms and conditions.',
  }
}

function validateBusiness(v: FormValues): Errors<FormValues> {
  return {
    businessName: v.businessName.trim().length >= 2 ? undefined : 'Enter your business name.',
    businessLocation: v.businessLocation.trim().length >= 2 ? undefined : 'Enter your business location.',
    businessDescription:
      v.businessDescription.trim().length >= 30 ? undefined : 'Describe your business in at least 30 characters.',
    acceptedTerms: v.acceptedTerms ? undefined : 'You must accept the terms and conditions.',
  }
}

function toInput(type: AccountType, v: FormValues): SignupInput {
  const base = {
    fullName: v.fullName.trim(),
    email: v.email.trim(),
    phone: v.phone.trim(),
    password: v.password,
    acceptedTerms: v.acceptedTerms,
  }
  return type === 'buyer'
    ? { accountType: 'buyer', ...base }
    : {
        accountType: 'seller',
        ...base,
        businessName: v.businessName.trim(),
        businessLocation: v.businessLocation.trim(),
        businessDescription: v.businessDescription.trim(),
      }
}

function AccountTypeOption({
  value,
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  value: AccountType
  selected: boolean
  onSelect: (value: AccountType) => void
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer gap-4 rounded-xl border-2 p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
        selected ? 'border-action bg-leaf-50 dark:bg-leaf-500/10' : 'border-border hover:border-border-strong',
      )}
    >
      <input
        type="radio"
        name="account-type"
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-xl [&>svg]:size-6',
          selected ? 'bg-action text-white dark:text-forest-950' : 'bg-surface-sunken text-muted',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-fg">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{description}</span>
      </span>
      {selected && <CircleCheckBig className="absolute top-3 right-3 size-5 text-action" aria-hidden="true" />}
    </label>
  )
}

export function SignupFlow() {
  const { openAuth } = useAuthModal()
  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const [step, setStep] = useState<Step>('type')
  const [values, setValues] = useState<FormValues>(EMPTY)
  const [errors, setErrors] = useState<Errors<FormValues>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)
  const [preview, setPreview] = useState(false)
  const [cooldown, setCooldown] = useState(DEFAULT_RESEND_COOLDOWN)
  const [termsOpen, setTermsOpen] = useState(false)

  const flow = accountType ? STEP_LABELS[accountType] : STEP_LABELS.buyer
  const stepIndex = Math.max(0, flow.steps.indexOf(step))
  const isLastFormStep = (accountType === 'buyer' && step === 'details') || step === 'business'

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
    setError(null)
  }

  const goTo = (next: Step) => {
    setError(null)
    setStep(next)
  }

  const submit = async () => {
    if (!accountType) return
    setSubmitting(true)
    const result = await services.auth.signUp(toInput(accountType, values))
    setSubmitting(false)
    if (result.ok) {
      setPreview(false)
      setCooldown(result.data.resendCooldownSeconds)
      goTo('verify')
    } else if (result.error.code === 'email_in_use') {
      setErrors((e) => ({ ...e, email: 'An account with this email already exists.' }))
      setStep('details')
    } else {
      setError(result.error)
    }
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (step === 'type') {
      if (accountType) goTo('details')
      return
    }
    const nextErrors = step === 'details' ? validateDetails(values, accountType === 'buyer') : validateBusiness(values)
    setErrors(nextErrors)
    if (hasErrors(nextErrors)) return
    if (step === 'details' && accountType === 'seller') goTo('business')
    else void submit()
  }

  const termsCheckbox = (
    <Checkbox
      checked={values.acceptedTerms}
      onChange={(e) => set('acceptedTerms', e.target.checked)}
      error={errors.acceptedTerms}
      label={
        <>
          I agree to the{' '}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setTermsOpen(true)
            }}
            className="font-semibold text-action underline underline-offset-2"
          >
            terms and conditions
          </button>
        </>
      }
    />
  )

  if (step === 'done') {
    return (
      <AuthSuccess
        title="Email verified"
        description={
          accountType === 'seller'
            ? 'Your seller account is ready. Log in to set up your business profile and create your first listing.'
            : 'Your buyer account is ready. Log in to browse the marketplace and post your first requirement.'
        }
        actionLabel="Continue to log in"
        onAction={() => openAuth('login')}
      />
    )
  }

  return (
    <>
      {accountType && step !== 'type' && <ProgressSteps steps={flow.labels} current={stepIndex} className="mb-6" />}

      {step === 'verify' ? (
        <OtpVerification
          email={values.email.trim()}
          preview={preview}
          initialCooldown={cooldown}
          onVerify={(code) => services.auth.verifySignupOtp(values.email.trim(), code)}
          onResend={() => services.auth.resendOtp(values.email.trim(), 'signup')}
          onVerified={() => goTo('done')}
          onBack={() => goTo('details')}
        />
      ) : (
        <form noValidate onSubmit={onSubmit} className="space-y-6">
          {step === 'type' && (
            <>
              <AuthHeader icon={<UserPlus />} title="Create your account" description="How will you use HeyCileng?" />
              <fieldset className="space-y-3">
                <legend className="sr-only">Account type</legend>
                <AccountTypeOption
                  value="buyer"
                  selected={accountType === 'buyer'}
                  onSelect={setAccountType}
                  icon={<ShoppingBasket />}
                  title="I’m a buyer"
                  description="My business needs agricultural by-products as raw materials."
                />
                <AccountTypeOption
                  value="seller"
                  selected={accountType === 'seller'}
                  onSelect={setAccountType}
                  icon={<Store />}
                  title="I’m a seller"
                  description="I’m a farmer, cooperative or agro-processor with by-products to sell."
                />
              </fieldset>
              <p className="text-center text-xs text-subtle">Administrator accounts are created by HeyCileng and can’t be registered here.</p>
            </>
          )}

          {step === 'details' && (
            <>
              <AuthHeader
                icon={<User />}
                title="Your details"
                description={accountType === 'seller' ? 'The account holder for your business.' : 'Tell us who’s creating this account.'}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  autoComplete="name"
                  required
                  value={values.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  error={errors.fullName}
                  containerClassName="sm:col-span-2"
                />
                <Input
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  required
                  value={values.email}
                  onChange={(e) => set('email', e.target.value)}
                  error={errors.email}
                />
                <Input
                  label="Phone number"
                  type="tel"
                  autoComplete="tel"
                  required
                  leftIcon={<Phone />}
                  value={values.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  error={errors.phone}
                  hint="Private — never shown to other users."
                />
                <PasswordInput
                  label="Password"
                  autoComplete="new-password"
                  required
                  value={values.password}
                  onChange={(e) => set('password', e.target.value)}
                  error={errors.password}
                />
                <PasswordInput
                  label="Confirm password"
                  autoComplete="new-password"
                  required
                  value={values.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  error={errors.confirmPassword}
                />
                <div className="sm:col-span-2">
                  <PasswordStrength password={values.password} />
                </div>
              </div>
              {accountType === 'buyer' && termsCheckbox}
            </>
          )}

          {step === 'business' && (
            <>
              <AuthHeader
                icon={<Building />}
                title="Your business"
                description="Buyers see this on your listings. Your personal contact details stay private."
              />
              <div className="grid gap-4">
                <Input
                  label="Business name"
                  autoComplete="organization"
                  required
                  value={values.businessName}
                  onChange={(e) => set('businessName', e.target.value)}
                  error={errors.businessName}
                />
                <Input
                  label="Business location"
                  required
                  leftIcon={<MapPin />}
                  placeholder="Town or city, state / region"
                  value={values.businessLocation}
                  onChange={(e) => set('businessLocation', e.target.value)}
                  error={errors.businessLocation}
                />
                <Textarea
                  label="Business description"
                  required
                  rows={4}
                  placeholder="What do you grow or process, and which by-products do you usually have available?"
                  value={values.businessDescription}
                  onChange={(e) => set('businessDescription', e.target.value)}
                  error={errors.businessDescription}
                  hint={`${values.businessDescription.trim().length}/30 characters minimum`}
                />
              </div>
              {termsCheckbox}
            </>
          )}

          {error && (
            <AuthErrorAlert
              error={error}
              previewLabel="Preview email verification"
              onPreview={() => {
                setPreview(true)
                setCooldown(DEFAULT_RESEND_COOLDOWN)
                goTo('verify')
              }}
            />
          )}

          <div className="space-y-4">
            <Button type="submit" size="lg" fullWidth loading={submitting} disabled={step === 'type' && !accountType}>
              {isLastFormStep ? (submitting ? 'Creating account…' : 'Create account') : 'Continue'}
            </Button>
            <div className="flex items-center justify-between gap-3 text-sm">
              {step !== 'type' ? (
                <BackButton onClick={() => goTo(step === 'business' ? 'details' : 'type')} />
              ) : (
                <span />
              )}
              <p className="text-muted">
                Have an account?{' '}
                <button type="button" onClick={() => openAuth('login')} className="font-semibold text-action underline-offset-4 hover:underline">
                  Log in
                </button>
              </p>
            </div>
          </div>
        </form>
      )}

      <TermsDialog open={termsOpen} onClose={() => setTermsOpen(false)} onAccept={() => set('acceptedTerms', true)} />
    </>
  )
}
