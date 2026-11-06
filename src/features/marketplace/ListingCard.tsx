import { BadgeCheck, MapPin } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { CATEGORY_BY_ID } from '@/config/catalog'
import { stateName } from '@/config/locations'
import { formatQuantity, formatUnitPrice } from '@/lib/format'
import { availableQuantity } from '@/lib/inventory'
import type { MarketplaceListing } from '@/types/listing'
import { ListingImage } from './ListingImage'
import { SaveListingButton } from './SaveListingButton'

interface ListingCardProps {
  item: MarketplaceListing
  to: string
  saved?: boolean
  onToggleSave?: () => void
  /** Optional slot below the price, e.g. a match score. */
  footer?: ReactNode
}

export function ListingCard({ item, to, saved, onToggleSave, footer }: ListingCardProps) {
  const { listing, seller } = item
  const available = availableQuantity(listing)
  const soldOut = available === 0

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-colors duration-200 hover:border-border-strong has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring">
      <div className="relative aspect-[4/3]">
        <ListingImage image={listing.images[0]} category={listing.category} />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge tone="neutral" className="bg-surface/90 backdrop-blur">
            {CATEGORY_BY_ID[listing.category].name}
          </Badge>
        </div>
        {onToggleSave && (
          <SaveListingButton saved={Boolean(saved)} onToggle={onToggleSave} label={listing.name} className="absolute top-3 right-3 z-10" />
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/60 backdrop-blur-[1px]">
            <Badge tone="accent" size="md">
              Sold out
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-sans text-base leading-snug font-semibold">
          <Link to={to} className="after:absolute after:inset-0 focus-visible:outline-none">
            {listing.name}
          </Link>
        </h3>
        <p className="mt-1 flex items-center gap-1 truncate text-sm text-muted">
          {seller.businessName}
          {seller.verified && <BadgeCheck className="size-4 shrink-0 text-action" aria-label="Verified by HeyCileng" />}
        </p>
        <p className="mt-1 flex items-center gap-1 text-sm text-subtle">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          {listing.location.area}, {stateName(listing.location.state)}
        </p>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-3 border-t border-border pt-3">
            <div>
              <p className="text-xs text-subtle">Available</p>
              <p className="text-sm font-semibold text-fg tabular-nums">{soldOut ? '—' : formatQuantity(available, listing.unit)}</p>
            </div>
            <p className="text-right font-display text-lg font-bold text-fg tabular-nums">{formatUnitPrice(listing.pricePerUnit, listing.unit)}</p>
          </div>
        </div>
        {footer && <div className="relative z-10 mt-3">{footer}</div>}
      </div>
    </article>
  )
}
