import { ArrowRight, Ellipsis, Pause, Pencil, Play, Trash, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Dropdown } from '@/components/ui/Dropdown'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CATEGORY_BY_ID } from '@/config/catalog'
import { getStatusMeta } from '@/config/statuses'
import { formatDate, formatUnitPrice } from '@/lib/format'
import type { Listing } from '@/types/listing'
import { ListingImage } from '../marketplace/ListingImage'
import { StockBar } from './StockBar'

interface SellerListingCardProps {
  listing: Listing
  editPath: string
  onTogglePause: () => void
  onDelete: () => void
  /** Matching buyer requirements for this listing, when known. */
  potentialBuyers?: number
}

export function SellerListingCard({ listing, editPath, onTogglePause, onDelete, potentialBuyers }: SellerListingCardProps) {
  const navigate = useNavigate()
  const items = [
    { key: 'edit', label: 'Edit listing', icon: <Pencil />, onSelect: () => navigate(editPath) },
    ...(listing.status === 'active' ? [{ key: 'pause', label: 'Pause listing', icon: <Pause />, onSelect: onTogglePause }] : []),
    ...(listing.status === 'paused' ? [{ key: 'resume', label: 'Resume listing', icon: <Play />, onSelect: onTogglePause }] : []),
    { key: 'delete', label: 'Delete listing', icon: <Trash />, tone: 'danger' as const, onSelect: onDelete },
  ]

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="relative aspect-[16/9]">
        <ListingImage image={listing.images[0]} category={listing.category} />
        <div className="absolute top-3 left-3">
          <StatusBadge kind="listing" status={listing.status} className="bg-surface/95 backdrop-blur" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-subtle">{CATEGORY_BY_ID[listing.category].name}</p>
            <h3 className="mt-0.5 font-sans text-base leading-snug font-semibold">
              <Link to={editPath} className="hover:underline">
                {listing.name}
              </Link>
            </h3>
          </div>
          <Dropdown
            items={items}
            trigger={(props) => (
              <button
                {...props}
                type="button"
                aria-label={`Actions for ${listing.name}`}
                className="-mt-1 -mr-1 inline-flex size-9 items-center justify-center rounded-md text-subtle hover:bg-surface-sunken hover:text-fg"
              >
                <Ellipsis className="size-5" />
              </button>
            )}
          />
        </div>
        <p className="mt-2 font-display text-lg font-bold tabular-nums">{formatUnitPrice(listing.pricePerUnit, listing.unit)}</p>
        <StockBar listing={listing} className="mt-3" />
        {listing.reviewNote && (listing.status === 'rejected' || listing.status === 'suspended') && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800 dark:bg-red-500/10 dark:text-red-200">
            <span className="font-semibold">HeyCileng:</span> {listing.reviewNote}
          </p>
        )}
        {potentialBuyers !== undefined && potentialBuyers > 0 && (
          <Link
            to={`/seller/potential-buyers?listing=${listing.id}`}
            className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-action hover:underline"
          >
            <Users className="size-4" aria-hidden="true" />
            {potentialBuyers} potential buyer{potentialBuyers === 1 ? '' : 's'}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
        <p className="mt-auto pt-4 text-xs text-subtle">
          {getStatusMeta('listing', listing.status).description} · Updated {formatDate(listing.updatedAt)}
        </p>
      </div>
    </article>
  )
}
