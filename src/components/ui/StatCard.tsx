import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface StatCardProps {
  label: ReactNode
  value: ReactNode
  icon?: ReactNode
  /** Secondary line, e.g. a unit or comparison. */
  hint?: ReactNode
  tone?: 'brand' | 'accent' | 'info' | 'neutral'
  className?: string
}

const iconTones = {
  brand: 'bg-leaf-100 text-leaf-700 dark:bg-leaf-500/15 dark:text-leaf-300',
  accent: 'bg-ochre-100 text-ochre-700 dark:bg-ochre-400/15 dark:text-ochre-300',
  info: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  neutral: 'bg-surface-sunken text-muted',
}

export function StatCard({ label, value, icon, hint, tone = 'brand', className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-surface p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        {icon && (
          <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-md [&>svg]:size-4', iconTones[tone])}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-fg tabular-nums sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-sm text-subtle">{hint}</p>}
    </div>
  )
}
