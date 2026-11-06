import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'

export interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  invalid?: boolean
  /** Called once all digits are filled. */
  onComplete?: (value: string) => void
  /** id of the element describing errors/hints. */
  describedBy?: string
  label?: string
}

/** Segmented one-time-code input: digits only, paste-aware, arrow/backspace navigation. */
export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  invalid,
  onComplete,
  describedBy,
  label = 'Verification code',
}: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  const focus = (index: number) => inputs.current[Math.max(0, Math.min(length - 1, index))]?.focus()

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length)
    onChange(clean)
    if (clean.length === length) onComplete?.(clean)
  }

  const setDigit = (index: number, digit: string) => {
    const chars = digits.slice()
    chars[index] = digit
    // Collapse gaps so the value stays a contiguous string.
    commit(chars.join(''))
  }

  const onInput = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, '')
    if (!typed) return
    if (typed.length > 1) {
      // Autofill or fast typing inserted several digits at once.
      commit(value.slice(0, index) + typed)
      focus(index + typed.length)
      return
    }
    setDigit(index, typed)
    focus(index + 1)
  }

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      if (digits[index]) setDigit(index, '')
      else if (index > 0) {
        setDigit(index - 1, '')
        focus(index - 1)
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focus(index - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      focus(index + 1)
    }
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    commit(pasted)
    focus(pasted.length)
  }

  return (
    <div role="group" aria-label={label} aria-describedby={describedBy} className="flex justify-between gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          value={digit}
          // Only the first empty box (or the last) accepts focus via Tab, keeping entry sequential.
          tabIndex={index === Math.min(value.length, length - 1) ? 0 : -1}
          onChange={(event) => onInput(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={onPaste}
          onFocus={(event) => event.target.select()}
          className={cn(
            'h-13 w-full min-w-0 rounded-lg border bg-surface text-center font-display text-2xl font-bold text-fg tabular-nums transition-[border-color,box-shadow]',
            'focus:ring-3 focus:outline-none disabled:opacity-60 sm:h-14',
            invalid
              ? 'border-red-500 focus:ring-red-500/20'
              : digit
                ? 'border-action focus:ring-action/20'
                : 'border-border-strong focus:border-action focus:ring-action/20',
          )}
        />
      ))}
    </div>
  )
}
