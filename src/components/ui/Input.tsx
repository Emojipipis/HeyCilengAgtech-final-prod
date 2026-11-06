import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Field } from './Field'
import { controlClasses, describedBy } from './fieldStyles'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  leftIcon?: ReactNode
  /** Content rendered inside the right edge (e.g. a toggle button or unit). */
  rightSlot?: ReactNode
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, leftIcon, rightSlot, className, containerClassName, required, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <Field id={inputId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-subtle [&>svg]:size-4.5">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, hint)}
          className={cn(controlClasses(Boolean(error)), 'h-11 px-3.5 text-sm', leftIcon && 'pl-10', rightSlot && 'pr-11', className)}
          {...props}
        />
        {rightSlot && <span className="absolute inset-y-0 right-1 flex items-center">{rightSlot}</span>}
      </div>
    </Field>
  )
})
