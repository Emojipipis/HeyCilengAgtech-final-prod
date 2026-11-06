import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** aria-describedby value matching the message Field renders. */
export function describedBy(id: string, error?: ReactNode, hint?: ReactNode) {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

export const controlClasses = (hasError: boolean) =>
  cn(
    'w-full rounded-md border bg-surface text-fg placeholder:text-subtle transition-[border-color,box-shadow] duration-150',
    'focus:outline-none focus:ring-3 disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-70',
    hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : 'border-border-strong hover:border-subtle focus:border-action focus:ring-action/20',
  )
