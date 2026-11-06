import { CalendarDays, ChevronDown, CircleCheckBig, MapPin, ShieldCheck, TriangleExclamationPoint, Users } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { ButtonLink } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { Tabs } from '@/components/ui/Tabs'
import { APPLICATIONS, QUALITY_TAGS } from '@/config/catalog'
import { MatchBreakdown, MatchLegend, MatchScore, MatchTypeBadge } from '@/features/matching/MatchParts'
import { useAsync } from '@/hooks/useAsync'
import { cn } from '@/lib/cn'
import { formatDate, formatQuantity, formatUnitPrice } from '@/lib/format'
import { services, type PotentialBuyer } from '@/services'

function PotentialBuyerCard({ item }: { item: PotentialBuyer }) {
  const [open, setOpen] = useState(false)
  const { requirement: r, match } = item
  const panelId = `pb-${r.id}-${item.listing.id}`

  return (
    <article className={cn('rounded-xl border bg-surface shadow-card', match.type === 'full' ? 'border-leaf-200 dark:border-leaf-500/30' : 'border-border')}>
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <MatchTypeBadge type={match.type} />
            <span className="text-xs text-subtle">matches your listing “{item.listing.name}”</span>
          </div>
          <h3 className="mt-1.5 font-sans text-base font-semibold">{r.title}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <MapPin className="size-3.5" aria-hidden="true" />
            {item.buyerLabel}
          </p>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {[
              ['Needs', formatQuantity(r.quantity, r.unit)],
              ['Budget', `up to ${formatUnitPrice(r.budgetMax, r.unit)}`],
              ['Use', APPLICATIONS[r.intendedApplication]],
              ['Within', `${r.maxDeliveryDistanceKm} km`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-subtle">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {r.qualityRequirements.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Quality requirements">
              {r.qualityRequirements.map((tag) => (
                <li key={tag} className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-xs font-medium text-muted">
                  {QUALITY_TAGS[tag]}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <MatchScore score={match.score} type={match.type} />
          <span className="flex items-center gap-1 text-xs text-subtle">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Until {formatDate(r.expiresAt)}
          </span>
        </div>
      </div>
      <div className="border-t border-border px-4 py-3 sm:px-5">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={panelId} className="inline-flex items-center gap-1.5 text-sm font-semibold text-action">
          {open ? 'Hide explanation' : 'Why this match?'}
          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </button>
        {open && (
          <div id={panelId} className="mt-4 grid animate-fade-in gap-6 pb-2 lg:grid-cols-2">
            <MatchBreakdown criteria={match.criteria} />
            <div className="space-y-3 text-sm">
              {match.reasons.map((reason) => (
                <p key={reason} className="flex gap-2 text-muted">
                  <CircleCheckBig className="mt-0.5 size-4 shrink-0 text-leaf-600 dark:text-leaf-400" aria-hidden="true" />
                  {reason}
                </p>
              ))}
              {match.warnings.map((warning) => (
                <p key={warning} className="flex gap-2 text-muted">
                  <TriangleExclamationPoint className="mt-0.5 size-4 shrink-0 text-ochre-600 dark:text-ochre-300" aria-hidden="true" />
                  {warning}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

export function PotentialBuyersPage() {
  const { data, loading, error, reload } = useAsync(() => services.matching.potentialBuyers(), 'potential-buyers')
  const [params] = useSearchParams()
  const [listingId, setListingId] = useState(params.get('listing') ?? 'all')
  const [view, setView] = useState<'all' | 'full' | 'partial'>('all')

  const all = data ?? []
  const listingOptions = [...new Map(all.map((b) => [b.listing.id, b.listing.name])).entries()]
  // Fall back to all listings if the requested listing has no matches (or doesn't exist).
  const selected = listingId !== 'all' && listingOptions.some(([id]) => id === listingId) ? listingId : 'all'
  const byListing = selected === 'all' ? all : all.filter((b) => b.listing.id === selected)
  const visible = view === 'all' ? byListing : byListing.filter((b) => b.match.type === view)
  const full = byListing.filter((b) => b.match.type === 'full').length

  return (
    <>
      <PageHeader title="Potential buyers" description="Active buyer requirements that match your listings." />

      <Alert tone="info" title="Buyers stay anonymous, and nothing happens automatically" className="mb-6">
        Matching never contacts buyers, creates orders or reserves stock. Buyers see your listing in their recommendations and decide whether to
        request an order. Keep quantities, prices and quality details up to date to rank higher.
      </Alert>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error.message} onRetry={reload} />
      ) : all.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No matching buyer requirements right now"
          description="Only active listings are matched. Check that your listings are active and fully described."
          action={<ButtonLink to="/seller/listings">My listings</ButtonLink>}
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <Select
              label="Listing"
              options={[{ value: 'all', label: 'All listings' }, ...listingOptions.map(([value, label]) => ({ value, label }))]}
              value={selected}
              onChange={(e) => setListingId(e.target.value)}
              containerClassName="md:w-80"
            />
            <Tabs
              label="Filter by match type"
              variant="pill"
              value={view}
              onChange={setView}
              items={[
                { value: 'all', label: 'All', count: byListing.length },
                { value: 'full', label: 'Full', count: full },
                { value: 'partial', label: 'Partial', count: byListing.length - full },
              ]}
            />
          </div>
          <MatchLegend />
          {visible.length === 0 ? (
            <EmptyState compact icon={<Users />} title={`No ${view} matches`} />
          ) : (
            <div className="space-y-4">
              {visible.map((item) => (
                <PotentialBuyerCard key={`${item.requirement.id}-${item.listing.id}`} item={item} />
              ))}
            </div>
          )}
          <p className="flex items-center gap-1.5 text-xs text-subtle">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Buyer names and contact details are never shown. All communication goes through HeyCileng.
          </p>
        </div>
      )}
    </>
  )
}
