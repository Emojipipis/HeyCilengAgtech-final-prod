import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'action' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const base =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover',
  action: 'bg-action text-white hover:bg-action-hover dark:text-forest-950',
  accent: 'bg-ochre-400 text-forest-950 hover:bg-ochre-300',
  secondary: 'bg-surface-sunken text-fg hover:bg-border',
  outline: 'border border-border-strong bg-surface text-fg hover:border-subtle hover:bg-surface-muted',
  ghost: 'text-muted hover:bg-surface-sunken hover:text-fg',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4.5 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'size-10',
}

export interface ButtonStyleOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
}

export function buttonClasses({ variant = 'primary', size = 'md', fullWidth, className }: ButtonStyleOptions = {}) {
  return cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)
}

