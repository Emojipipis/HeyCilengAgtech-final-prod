import { ChevronDown } from 'lucide-react'
import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Field } from './Field'
import { controlClasses, describedBy } from './fieldStyles'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  options: SelectOption[]
  /** Renders a first, empty option. */
  placeholder?: string
  containerClassName?: string
  size?: 'sm' | 'md'
}

/** Native select: accessible and mobile-friendly by default, styled to match inputs. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, label, hint, error, options, placeholder, className, containerClassName, required, size = 'md', ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, error, hint)}
          className={cn(
            controlClasses(Boolean(error)),
            'cursor-pointer appearance-none pr-10 pl-3.5 text-sm',
            size === 'sm' ? 'h-9' : 'h-11',
            className,
          )}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-subtle"
          aria-hidden="true"
        />
      </div>
    </Field>
  )
})
