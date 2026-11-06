import { eventIcon } from './timelineIcons'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { OrderEvent } from '@/types/order'

const actorLabel: Record<OrderEvent['actor'], string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  heycileng: 'HeyCileng',
  system: 'System',
}

const negative = new Set(['declined', 'cancelled', 'delivery_failed'])

/** Chronological order history, newest last. */
export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  return (
    <ol className="relative space-y-6">
      {events.map((event, index) => {
        const last = index === events.length - 1
        const bad = event.status && negative.has(event.status)
        const Icon = eventIcon(event)
        return (
          <li key={event.id} className="relative flex gap-4">
            {!last && <span className="absolute top-9 bottom-[-1.5rem] left-[17px] w-0.5 bg-border" aria-hidden="true" />}
            <span
              className={cn(
                'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-surface',
                bad
                  ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'
                  : last
                    ? 'bg-primary text-primary-fg'
                    : 'bg-leaf-100 text-leaf-700 dark:bg-leaf-500/15 dark:text-leaf-300',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-sm font-semibold text-fg">{event.title}</p>
              {event.description && <p className="mt-0.5 text-sm text-muted">{event.description}</p>}
              <p className="mt-1 text-xs text-subtle">
                {formatDateTime(event.at)} · {actorLabel[event.actor]}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
