import { formatQuantity } from '@/lib/format'
import { availableQuantity } from '@/lib/inventory'
import { cn } from '@/lib/cn'
import type { Listing } from '@/types/listing'

type StockFields = Pick<Listing, 'listedQuantity' | 'reservedQuantity' | 'soldQuantity' | 'unit'>

/** Segmented bar: sold · reserved · available, as shares of the listed quantity. */
export function StockBar({ listing, showLegend = true, className }: { listing: StockFields; showLegend?: boolean; className?: string }) {
  const listed = Math.max(listing.listedQuantity, 1)
  const available = availableQuantity(listing)
  const segments = [
    { key: 'sold', label: 'Sold', value: listing.soldQuantity, className: 'bg-forest-700 dark:bg-forest-300' },
    { key: 'reserved', label: 'Reserved', value: listing.reservedQuantity, className: 'bg-ochre-400' },
    { key: 'available', label: 'Available', value: available, className: 'bg-leaf-400' },
  ]

  return (
    <div className={className}>
      <div
        className="flex h-2 overflow-hidden rounded-full bg-surface-sunken"
        role="img"
        aria-label={`${formatQuantity(listing.soldQuantity, listing.unit)} sold, ${formatQuantity(listing.reservedQuantity, listing.unit)} reserved, ${formatQuantity(available, listing.unit)} available of ${formatQuantity(listing.listedQuantity, listing.unit)} listed`}
      >
        {segments.map((s) => (
          <span key={s.key} className={cn('h-full', s.className)} style={{ width: `${(s.value / listed) * 100}%` }} />
        ))}
      </div>
      {showLegend && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {segments.map((s) => (
            <li key={s.key} className="inline-flex items-center gap-1.5">
              <span className={cn('size-2 rounded-full', s.className)} aria-hidden="true" />
              {s.label} <span className="font-semibold text-fg tabular-nums">{formatQuantity(s.value, listing.unit)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
