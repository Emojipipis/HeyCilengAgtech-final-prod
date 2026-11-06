import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface AccordionItem {
  id: string
  title: ReactNode
  content: ReactNode
}

export function Accordion({ items, className, defaultOpen }: { items: AccordionItem[]; className?: string; defaultOpen?: string }) {
  const [openId, setOpenId] = useState<string | null>(defaultOpen ?? null)
  const baseId = useId()

  return (
    <div className={cn('divide-y divide-border rounded-xl border border-border bg-surface', className)}>
      {items.map((item) => {
        const open = openId === item.id
        const buttonId = `${baseId}-${item.id}-button`
        const panelId = `${baseId}-${item.id}-panel`
        return (
          <div key={item.id}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-sans text-base font-semibold text-fg transition-colors hover:bg-surface-muted sm:px-6"
              >
                {item.title}
                <ChevronDown
                  className={cn('size-5 shrink-0 text-subtle transition-transform duration-200', open && 'rotate-180 text-action')}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn('grid transition-[grid-template-rows] duration-200 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 text-sm leading-relaxed text-muted sm:px-6">{item.content}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
