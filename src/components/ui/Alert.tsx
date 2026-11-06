import { CircleCheckBig, CircleExclamationPoint, Info, TriangleExclamationPoint, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type AlertTone = 'info' | 'success' | 'warning' | 'error'

const styles: Record<AlertTone, { box: string; icon: string; Icon: typeof Info }> = {
  info: {
    box: 'border-sky-200 bg-sky-50 dark:border-sky-500/25 dark:bg-sky-500/10',
    icon: 'text-sky-600 dark:text-sky-400',
    Icon: Info,
  },
  success: {
    box: 'border-leaf-200 bg-leaf-50 dark:border-leaf-500/25 dark:bg-leaf-500/10',
    icon: 'text-leaf-600 dark:text-leaf-400',
    Icon: CircleCheckBig,
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-400',
    Icon: TriangleExclamationPoint,
  },
  error: {
    box: 'border-red-200 bg-red-50 dark:border-red-500/25 dark:bg-red-500/10',
    icon: 'text-red-600 dark:text-red-400',
    Icon: CircleExclamationPoint,
  },
}

export interface AlertProps {
  tone?: AlertTone
  title?: ReactNode
  children?: ReactNode
  action?: ReactNode
  onDismiss?: () => void
  className?: string
}

/** Inline message for success, error, warning and informational feedback. */
export function Alert({ tone = 'info', title, children, action, onDismiss, className }: AlertProps) {
  const { box, icon, Icon } = styles[tone]
  return (
    <div
      role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg border p-4 text-sm', box, className)}
    >
      <Icon className={cn('mt-0.5 size-4.5 shrink-0', icon)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold text-fg">{title}</p>}
        {children && <div className={cn('text-muted', title && 'mt-0.5')}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="-m-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-subtle hover:bg-black/5 hover:text-fg dark:hover:bg-white/10"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
