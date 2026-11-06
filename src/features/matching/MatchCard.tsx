import { BadgeCheck, ChevronDown, CircleCheckBig, MapPin, TriangleExclamationPoint } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/ui/Button'
import { stateName } from '@/config/locations'
import { formatQuantity, formatUnitPrice } from '@/lib/format'
import { availableQuantity } from '@/lib/inventory'
import { cn } from '@/lib/cn'
import type { ListingMatch } from '@/services'
import { ListingImage } from '../marketplace/ListingImage'
import { MatchBreakdown, MatchScore, MatchTypeBadge } from './MatchParts'

interface MatchCardProps {
  item: ListingMatch
  listingPath: string
  onRequestOrder?: () => void
  defaultExpanded?: boolean
}

export function MatchCard({ item, listingPath, onRequestOrder, defaultExpanded = false }: MatchCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const { listing, seller } = item.listing
  const { match } = item
  const panelId = `match-${listing.id}-details`

  return (
    <article
      className={cn(
        'rounded-xl border bg-surface shadow-card',
        match.type === 'full' ? 'border-leaf-200 dark:border-leaf-500/30' : 'border-border',
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="size-18 shrink-0 overflow-hidden rounded-lg sm:size-20">
            <ListingImage image={listing.images[0]} category={listing.category} showLabel={false} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <MatchTypeBadge type={match.type} />
            </div>
            <h3 className="mt-1.5 truncate font-sans text-base font-semibold">
              <Link to={listingPath} className="hover:underline">
                {listing.name}
              </Link>
            </h3>
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted">
              {seller.businessName}
              {seller.verified && <BadgeCheck className="size-4 shrink-0 text-action" aria-label="Verified by HeyCileng" />}
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-subtle">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden="true" />
                {listing.location.area}, {stateName(listing.location.state)}
              </span>
              <span className="tabular-nums">{formatQuantity(availableQuantity(listing), listing.unit)} available</span>
              <span className="font-medium text-fg tabular-nums">{formatUnitPrice(listing.pricePerUnit, listing.unit)}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
          <MatchScore score={match.score} type={match.type} />
          <span className="text-xs text-subtle">Advisory score</span>
        </div>
      </div>

      <div className="border-t border-border px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={panelId}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-action"
          >
            {expanded ? 'Hide match details' : 'Why this match?'}
            <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
          </button>
          <div className="flex gap-2">
            <ButtonLink to={listingPath} variant="outline" size="sm">
              View listing
            </ButtonLink>
            {onRequestOrder && (
              <Button size="sm" onClick={onRequestOrder}>
                Request order
              </Button>
            )}
          </div>
        </div>

        {expanded && (
          <div id={panelId} className="mt-4 grid animate-fade-in gap-6 pb-2 lg:grid-cols-2">
            <MatchBreakdown criteria={match.criteria} />
            <div className="space-y-4">
              {match.reasons.length > 0 && (
                <div>
                  <h4 className="font-sans text-sm font-semibold">Reasons for the match</h4>
                  <ul className="mt-2 space-y-1.5">
                    {match.reasons.map((reason) => (
                      <li key={reason} className="flex gap-2 text-sm text-muted">
                        <CircleCheckBig className="mt-0.5 size-4 shrink-0 text-leaf-600 dark:text-leaf-400" aria-hidden="true" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {match.warnings.length > 0 && (
                <div>
                  <h4 className="font-sans text-sm font-semibold">Limitations and warnings</h4>
                  <ul className="mt-2 space-y-1.5">
                    {match.warnings.map((warning) => (
                      <li key={warning} className="flex gap-2 text-sm text-muted">
                        <TriangleExclamationPoint className="mt-0.5 size-4 shrink-0 text-ochre-600 dark:text-ochre-300" aria-hidden="true" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
