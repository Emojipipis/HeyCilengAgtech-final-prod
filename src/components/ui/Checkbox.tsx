import { Check } from 'lucide-react'
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  description?: ReactNode
  error?: ReactNode
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { id, label, description, error, className, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-start gap-3">
        <span className="relative mt-0.5 flex size-5 shrink-0">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={cn(
              'peer size-5 cursor-pointer appearance-none rounded-[5px] border bg-surface transition-colors',
              'checked:border-action checked:bg-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              error ? 'border-red-500' : 'border-border-strong hover:border-subtle',
            )}
            {...props}
          />
          <Check
            className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white opacity-0 peer-checked:opacity-100 dark:text-forest-950"
            strokeWidth={3}
            aria-hidden="true"
          />
        </span>
        <label htmlFor={inputId} className="cursor-pointer text-sm leading-6 select-none">
          <span className="text-fg">{label}</span>
          {description && <span className="block text-subtle">{description}</span>}
        </label>
      </div>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="pl-8 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
})
