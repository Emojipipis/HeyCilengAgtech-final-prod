import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useState } from 'react'
import { Input, type InputProps } from './Input'

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'rightSlot'>>(function PasswordInput(
  props,
  ref,
) {
  const [visible, setVisible] = useState(false)

  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      autoComplete="current-password"
      {...props}
      rightSlot={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="inline-flex size-9 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-sunken hover:text-fg"
        >
          {visible ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
        </button>
      }
    />
  )
})
