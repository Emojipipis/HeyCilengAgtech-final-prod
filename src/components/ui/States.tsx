import { CircleX, Inbox, LoaderCircle, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" className="inline-flex">
      <LoaderCircle className={cn('size-5 animate-spin text-action', className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-sunken', className)} aria-hidden="true" />
}

export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-14 text-sm text-muted', className)}>
      <Spinner className="size-7" label={label} />
      <p>{label}</p>
    </div>
  )
}

interface StateProps {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({ icon, title, description, action, className, compact = false }: StateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8' : 'py-14', className)}>
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-ochre-600 dark:text-ochre-300 [&>svg]:size-6.5">
        {icon ?? <Inbox />}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

interface ErrorStateProps extends Omit<StateProps, 'title'> {
  title?: ReactNode
  onRetry?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We couldn’t load this content. Please try again.',
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center py-14 text-center', className)}>
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/12 dark:text-red-400">
        <CircleX className="size-6.5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      <div className="mt-5 flex gap-2">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<RotateCcw className="size-4" />}>
            Try again
          </Button>
        )}
        {action}
      </div>
    </div>
  )
}
