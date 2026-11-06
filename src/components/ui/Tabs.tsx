import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface TabItem<V extends string = string> {
  value: V
  label: ReactNode
  icon?: ReactNode
  /** Small count shown beside the label. */
  count?: number
  disabled?: boolean
}

export interface TabsProps<V extends string> {
  items: TabItem<V>[]
  value: V
  onChange: (value: V) => void
  variant?: 'underline' | 'pill'
  className?: string
  /** Accessible name for the tab list. */
  label: string
  /** id prefix used to link tabs to panels via <TabPanel>. */
  idPrefix?: string
}

/** Controlled tab list with arrow-key navigation (WAI-ARIA tabs pattern). */
export function Tabs<V extends string>({ items, value, onChange, variant = 'underline', className, label, idPrefix }: TabsProps<V>) {
  const fallbackId = useId()
  const prefix = idPrefix ?? fallbackId
  const listRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.filter((item) => !item.disabled)
    const index = enabled.findIndex((item) => item.value === value)
    let next: number | null = null
    if (event.key === 'ArrowRight') next = (index + 1) % enabled.length
    if (event.key === 'ArrowLeft') next = (index - 1 + enabled.length) % enabled.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = enabled.length - 1
    if (next === null) return
    event.preventDefault()
    const target = enabled[next]
    onChange(target.value)
    listRef.current?.querySelector<HTMLButtonElement>(`[data-value="${target.value}"]`)?.focus()
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        'flex max-w-full overflow-x-auto [scrollbar-width:none]',
        variant === 'underline' ? 'gap-1 border-b border-border' : 'w-fit gap-1 rounded-lg bg-surface-sunken p-1',
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`${prefix}-tab-${item.value}`}
            aria-controls={`${prefix}-panel-${item.value}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            data-value={item.value}
            onClick={() => onChange(item.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-50 [&>svg]:size-4',
              variant === 'underline'
                ? cn(
                    '-mb-px border-b-2 px-3 py-2.5',
                    selected ? 'border-action text-fg' : 'border-transparent text-muted hover:border-border-strong hover:text-fg',
                  )
                : cn('rounded-md px-3.5 py-1.5', selected ? 'bg-surface text-fg shadow-card' : 'text-muted hover:text-fg'),
            )}
          >
            {item.icon}
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-px text-xs tabular-nums',
                  selected ? 'bg-leaf-100 text-leaf-800 dark:bg-leaf-500/20 dark:text-leaf-200' : 'bg-surface-sunken text-subtle',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({
  idPrefix,
  value,
  children,
  className,
}: {
  idPrefix: string
  value: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${value}`}
      aria-labelledby={`${idPrefix}-tab-${value}`}
      tabIndex={0}
      className={cn('animate-fade-in outline-none', className)}
    >
      {children}
    </div>
  )
}
