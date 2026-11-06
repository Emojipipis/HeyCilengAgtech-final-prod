import type { HTMLAttributes, ReactNode } from 'react'
import type { Tone } from '@/config/statuses'
import { cn } from '@/lib/cn'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-muted ring-border-strong/60',
  info: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-500/12 dark:text-sky-300 dark:ring-sky-500/25',
  success: 'bg-leaf-50 text-leaf-800 ring-leaf-200 dark:bg-leaf-500/12 dark:text-leaf-300 dark:ring-leaf-500/25',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/12 dark:text-amber-300 dark:ring-amber-500/25',
  danger: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/12 dark:text-red-300 dark:ring-red-500/25',
  brand: 'bg-forest-50 text-forest-800 ring-forest-200 dark:bg-forest-400/15 dark:text-forest-200 dark:ring-forest-400/30',
  accent: 'bg-ochre-50 text-ochre-800 ring-ochre-200 dark:bg-ochre-400/12 dark:text-ochre-200 dark:ring-ochre-400/25',
}

const dotClasses: Record<Tone, string> = {
  neutral: 'bg-subtle',
  info: 'bg-sky-500',
  success: 'bg-leaf-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  brand: 'bg-forest-600 dark:bg-forest-300',
  accent: 'bg-ochre-500',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  dot?: boolean
  icon?: ReactNode
  size?: 'sm' | 'md'
}

export function Badge({ tone = 'neutral', dot = false, icon, size = 'sm', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ring-1 ring-inset',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('size-1.5 rounded-full', dotClasses[tone])} aria-hidden="true" />}
      {icon && <span className="[&>svg]:size-3.5">{icon}</span>}
      {children}
    </span>
  )
}
