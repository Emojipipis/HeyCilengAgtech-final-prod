import { ArrowLeft, Check, FlaskConical, ShieldCheck, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { passwordChecks } from '@/lib/validation'
import type { ServiceError } from '@/services'

export function AuthHeader({ icon, title, description }: { icon: ReactNode; title: ReactNode; description?: ReactNode }) {
  return (
    <div className="text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-leaf-100 text-leaf-700 dark:bg-leaf-500/15 dark:text-leaf-300 [&>svg]:size-6">
        {icon}
      </span>
      <h2 className="mt-4 text-2xl font-bold">{title}</h2>
      {description && <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
    </div>
  )
}

/** Final confirmation screen of an auth flow. Only reached after the backend confirms success. */
export function AuthSuccess({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="space-y-6 py-2 text-center">
      <AuthHeader icon={<ShieldCheck />} title={title} description={description} />
      <Button size="lg" fullWidth onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  )
}

export function BackButton({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md py-1 text-sm font-medium text-muted transition-colors hover:text-fg"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </button>
  )
}

/** Live checklist of password rules. */
export function PasswordStrength({ password }: { password: string }) {
  const checks = passwordChecks(password)
  const passed = checks.filter((c) => c.passed).length
  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {checks.map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i < passed ? (passed === checks.length ? 'bg-action' : 'bg-ochre-400') : 'bg-surface-sunken',
            )}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {checks.map((check) => (
          <li key={check.label} className={cn('flex items-center gap-1.5 text-xs', check.passed ? 'text-leaf-700 dark:text-leaf-300' : 'text-subtle')}>
            {check.passed ? <Check className="size-3.5" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}
            <span>
              {check.label}
              <span className="sr-only">{check.passed ? ' — met' : ' — not met'}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Shown on screens reached in preview mode, i.e. without a connected backend. */
export function PreviewBanner({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-ochre-400/70 bg-ochre-50 px-3.5 py-2.5 text-xs text-ochre-900 dark:bg-ochre-400/10 dark:text-ochre-100">
      <FlaskConical className="mt-px size-4 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-semibold">Interface preview.</span>{' '}
        {children ?? 'The authentication backend isn’t connected — no account exists and no email was sent.'}
      </p>
    </div>
  )
}

/** Standard rendering of a failed auth call, with an optional path into preview mode. */
export function AuthErrorAlert({
  error,
  onPreview,
  previewLabel = 'Preview the next screen',
  onDismiss,
}: {
  error: ServiceError
  onPreview?: () => void
  previewLabel?: string
  onDismiss?: () => void
}) {
  const notConnected = error.code === 'not_connected'
  return (
    <Alert
      tone={notConnected ? 'warning' : 'error'}
      title={notConnected ? 'Backend not connected' : undefined}
      onDismiss={onDismiss}
      action={
        notConnected && onPreview ? (
          <Button size="sm" variant="outline" onClick={onPreview}>
            {previewLabel}
          </Button>
        ) : undefined
      }
    >
      {error.message}
    </Alert>
  )
}
