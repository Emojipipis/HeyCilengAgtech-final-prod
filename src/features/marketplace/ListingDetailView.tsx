import { ArrowLeft, BadgeCheck, CalendarDays, Lock, MapPin, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { APPLICATIONS, CATEGORY_BY_ID, QUALITY_TAGS } from '@/config/catalog'
import { stateName } from '@/config/locations'
import { formatDate, formatQuantity, formatUnitPrice } from '@/lib/format'
import { availableQuantity } from '@/lib/inventory'
import type { MarketplaceListing } from '@/types/listing'
import { ListingGallery } from './ListingGallery'

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </Link>
  )
}

interface ListingDetailViewProps {
  item: MarketplaceListing
  back: { to: string; label: string }
  /** Buttons under the price, e.g. Request order + Save, or a sign-in prompt. */
  actions: ReactNode
  /** Extra panel under the price card, e.g. requirement matches. */
  aside?: ReactNode
}

/** Listing details shared by the public marketplace and the buyer dashboard. Never shows seller contact details. */
export function ListingDetailView({ item, back, actions, aside }: ListingDetailViewProps) {
  const { listing, seller } = item
  const available = availableQuantity(listing)
  const category = CATEGORY_BY_ID[listing.category]

  return (
    <div className="space-y-6">
      <BackLink {...back} />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] *:min-w-0">
        <ListingGallery listing={listing} />

        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">{category.name}</Badge>
              {listing.isDemo && <DemoBadge />}
            </div>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{listing.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="size-4" aria-hidden="true" />
              {listing.location.area}, {stateName(listing.location.state)}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="font-display text-3xl font-bold tabular-nums">{formatUnitPrice(listing.pricePerUnit, listing.unit)}</p>
            <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
              <div>
                <dt className="text-subtle">Available now</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{available === 0 ? 'Sold out' : formatQuantity(available, listing.unit)}</dd>
              </div>
              <div>
                <dt className="text-subtle">Minimum order</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{formatQuantity(listing.minOrderQuantity, listing.unit)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-subtle">
              Available quantity excludes stock already reserved for accepted orders. Requesting an order doesn’t reserve stock.
            </p>
            <div className="mt-5">{actions}</div>
          </div>

          {aside}

          <Card>
            <CardHeader title="Seller" description="Business information shared by HeyCileng." />
            <CardBody>
              <p className="flex items-center gap-1.5 font-semibold">
                {seller.businessName}
                {seller.verified && <BadgeCheck className="size-4.5 text-action" aria-label="Verified by HeyCileng" />}
              </p>
              <p className="mt-1 text-sm text-muted">{seller.description}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-subtle">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" aria-hidden="true" />
                  {seller.location.area}, {stateName(seller.location.state)}
                </span>
                {seller.memberSince && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4" aria-hidden="true" />
                    Member since {formatDate(seller.memberSince)}
                  </span>
                )}
                {seller.verified && (
                  <span className="inline-flex items-center gap-1.5 text-leaf-700 dark:text-leaf-300">
                    <ShieldCheck className="size-4" aria-hidden="true" />
                    Business details verified
                  </span>
                )}
              </div>
              <p className="mt-4 flex gap-2 rounded-lg bg-surface-muted p-3 text-xs text-muted">
                <Lock className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                Seller contact details are private. Questions about this listing or an order are handled by HeyCileng support.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 *:min-w-0">
        <Card>
          <CardHeader title="Description" />
          <CardBody>
            <p className="text-sm leading-relaxed text-muted">{listing.description}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Quality and applications" />
          <CardBody className="space-y-5">
            <div>
              <h3 className="font-sans text-sm font-semibold">Quality</h3>
              {listing.qualityTags.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {listing.qualityTags.map((tag) => (
                    <li key={tag}>
                      <Badge tone="success">{QUALITY_TAGS[tag]}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-subtle">No quality characteristics listed.</p>
              )}
              {listing.qualitySpecifications && <p className="mt-2 text-sm text-muted">{listing.qualitySpecifications}</p>}
            </div>
            <div>
              <h3 className="font-sans text-sm font-semibold">Intended applications</h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {listing.applications.map((app) => (
                  <li key={app}>
                    <Badge tone="brand">{APPLICATIONS[app]}</Badge>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-subtle">Quality details are provided by the seller. Ask HeyCileng support if you need test results.</p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
