import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Field } from './Field'
import { controlClasses, describedBy } from './fieldStyles'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  containerClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { id, label, hint, error, className, containerClassName, required, rows = 4, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} required={required} className={containerClassName}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className={cn(controlClasses(Boolean(error)), 'resize-y px-3.5 py-2.5 text-sm leading-relaxed', className)}
        {...props}
      />
    </Field>
  )
})
