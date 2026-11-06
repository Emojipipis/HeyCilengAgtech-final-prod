import { useId, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { cn } from '@/lib/cn'

export interface DropdownItem {
  key: string
  label: ReactNode
  icon?: ReactNode
  onSelect: () => void
  tone?: 'default' | 'danger'
  disabled?: boolean
}

export interface DropdownProps {
  /** Renders the trigger. Spread `props` onto a <button>. */
  trigger: (props: {
    ref: Ref<HTMLButtonElement>
    onClick: () => void
    'aria-haspopup': 'menu'
    'aria-expanded': boolean
    'aria-controls': string
  }) => ReactNode
  items: DropdownItem[]
  align?: 'start' | 'end'
  header?: ReactNode
  className?: string
}

/** Menu button with keyboard navigation, outside-click and Escape closing. */
export function Dropdown({ trigger, items, align = 'end', header, className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = (restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  useClickOutside([triggerRef, menuRef], () => setOpen(false), open)
  useEscapeKey(() => close(), open)

  const focusItem = (direction: 1 | -1 | 'first' | 'last') => {
    const nodes = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])
    if (nodes.length === 0) return
    const current = nodes.indexOf(document.activeElement as HTMLButtonElement)
    let next = 0
    if (direction === 'last') next = nodes.length - 1
    else if (direction === 1) next = (current + 1) % nodes.length
    else if (direction === -1) next = (current - 1 + nodes.length) % nodes.length
    nodes[next].focus()
  }

  const onMenuKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') focusItem(1)
    else if (event.key === 'ArrowUp') focusItem(-1)
    else if (event.key === 'Home') focusItem('first')
    else if (event.key === 'End') focusItem('last')
    else if (event.key === 'Tab') setOpen(false)
    else return
    if (event.key !== 'Tab') event.preventDefault()
  }

  return (
    <div className={cn('relative inline-flex', className)}>
      {trigger({
        ref: triggerRef,
        onClick: () => {
          setOpen((v) => !v)
          requestAnimationFrame(() => focusItem('first'))
        },
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': menuId,
      })}
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          onKeyDown={onMenuKeyDown}
          className={cn(
            'absolute top-full z-40 mt-2 min-w-52 animate-scale-in rounded-lg border border-border bg-surface p-1.5 shadow-raised',
            align === 'end' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
          )}
        >
          {header && <div className="border-b border-border px-2.5 pt-1.5 pb-2.5 mb-1">{header}</div>}
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={item.disabled}
              onClick={() => {
                close(false)
                item.onSelect()
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors outline-none disabled:opacity-50 [&>svg]:size-4',
                item.tone === 'danger'
                  ? 'text-red-600 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:focus:bg-red-500/10'
                  : 'text-fg hover:bg-surface-sunken focus:bg-surface-sunken',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
