import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Lift on hover — for clickable cards. */
  interactive?: boolean
  padded?: boolean
}

export function Card({ interactive = false, padded = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        // min-w-0 lets cards shrink inside grid and flex layouts instead of overflowing.
        'min-w-0 rounded-xl border border-border bg-surface shadow-card',
        interactive && 'transition-colors duration-200 hover:border-border-strong',
        padded && 'p-5 sm:p-6',
        className,
      )}
      {...props}
    />
  )
}

interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export function CardHeader({ title, description, action, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6', className)} {...props}>
      <div className="min-w-0">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-5 sm:px-6', className)} {...props} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3.5 sm:px-6', className)}
      {...props}
    />
  )
}
