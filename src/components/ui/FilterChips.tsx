import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface FilterChipOption<V extends string = string> {
  value: V
  label: string
  count?: number
}

interface FilterChipsProps<V extends string> {
  options: FilterChipOption<V>[]
  /** Selected values. Empty array means "all". */
  value: V[]
  onChange: (value: V[]) => void
  multiple?: boolean
  label: string
  /** Show an "All" chip that clears the selection. */
  allLabel?: string
  className?: string
}

/** Toggleable filter chips — single or multi-select. */
export function FilterChips<V extends string>({
  options,
  value,
  onChange,
  multiple = false,
  label,
  allLabel,
  className,
}: FilterChipsProps<V>) {
  const toggle = (option: V) => {
    const selected = value.includes(option)
    if (multiple) onChange(selected ? value.filter((v) => v !== option) : [...value, option])
    else onChange(selected ? [] : [option])
  }

  const chip = (active: boolean) =>
    cn(
      'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors',
      active
        ? 'border-action bg-leaf-50 text-leaf-800 dark:bg-leaf-500/15 dark:text-leaf-200'
        : 'border-border bg-surface text-muted hover:border-border-strong hover:text-fg',
    )

  return (
    <div role="group" aria-label={label} className={cn('flex flex-wrap gap-2', className)}>
      {allLabel && (
        <button type="button" aria-pressed={value.length === 0} onClick={() => onChange([])} className={chip(value.length === 0)}>
          {allLabel}
        </button>
      )}
      {options.map((option) => {
        const active = value.includes(option.value)
        return (
          <button key={option.value} type="button" aria-pressed={active} onClick={() => toggle(option.value)} className={chip(active)}>
            {active && multiple && <Check className="size-3.5" aria-hidden="true" />}
            {option.label}
            {option.count !== undefined && <span className="text-xs text-subtle tabular-nums">{option.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
