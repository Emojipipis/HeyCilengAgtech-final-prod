import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface ProgressStepsProps {
  steps: string[]
  /** Zero-based index of the current step. */
  current: number
  className?: string
}

/** Step indicator for multi-step flows. Labels sit under each step so they never truncate. */
export function ProgressSteps({ steps, current, className }: ProgressStepsProps) {
  return (
    <ol className={cn('flex items-start', className)} aria-label={`Step ${current + 1} of ${steps.length}`}>
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current
        return (
          <li key={step} className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5" aria-current={active ? 'step' : undefined}>
            {index > 0 && (
              <span
                className={cn('absolute top-3.5 right-1/2 left-[-50%] h-0.5 -translate-y-1/2', index <= current ? 'bg-action' : 'bg-border')}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                done && 'bg-action text-white dark:text-forest-950',
                active && 'bg-primary text-primary-fg ring-4 ring-leaf-100 dark:ring-leaf-500/20',
                !done && !active && 'bg-surface-sunken text-subtle',
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : index + 1}
            </span>
            <span className={cn('px-1 text-center text-[11px] leading-tight font-medium', active ? 'text-fg' : 'text-subtle')}>
              {step}
              {done && <span className="sr-only"> (completed)</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
