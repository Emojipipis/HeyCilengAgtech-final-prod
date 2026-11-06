import { ClipboardList, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { Tabs } from '@/components/ui/Tabs'
import { APPLICATIONS, CATEGORY_BY_ID } from '@/config/catalog'
import { stateName } from '@/config/locations'
import { MatchCard } from '@/features/matching/MatchCard'
import { MatchDisclaimer, MatchLegend } from '@/features/matching/MatchParts'
import { RequestOrderModal } from '@/features/orders/RequestOrderModal'
import { useAsync } from '@/hooks/useAsync'
import { formatQuantity, formatUnitPrice } from '@/lib/format'
import { convertQuantity } from '@/lib/inventory'
import { effectiveRequirementStatus } from '@/lib/requirements'
import { services, type ListingMatch } from '@/services'

type View = 'all' | 'full' | 'partial'

export function MatchesPage() {
  const [params, setParams] = useSearchParams()
  const requirements = useAsync(() => services.requirements.list(), 'requirements')
  const active = (requirements.data ?? []).filter((r) => effectiveRequirementStatus(r) === 'active')
  const requested = params.get('requirement')
  const selectedId = requested ?? active[0]?.id ?? ''
  const selectedRequirement = (requirements.data ?? []).find((r) => r.id === selectedId)
  const selectedStatus = selectedRequirement ? effectiveRequirementStatus(selectedRequirement) : undefined

  const matches = useAsync(
    () => (selectedId ? services.matching.matchesForRequirement(selectedId) : Promise.resolve({ ok: true as const, data: undefined })),
    selectedId,
  )
  const [view, setView] = useState<View>('all')
  const [ordering, setOrdering] = useState<ListingMatch | null>(null)

  const all = matches.data?.matches ?? []
  const visible = view === 'all' ? all : all.filter((m) => m.match.type === view)
  const fullCount = all.filter((m) => m.match.type === 'full').length

  const selectRequirement = (id: string) => {
    setView('all')
    setParams({ requirement: id }, { replace: true })
  }

  if (requirements.loading) return <Skeleton className="h-96 w-full rounded-xl" />
  if (requirements.error) return <ErrorState description={requirements.error.message} onRetry={requirements.reload} />

  return (
    <>
      <PageHeader
        title="Matches"
        description="Listings recommended for your requirements, with the reasons behind each score."
        actions={
          <ButtonLink to="/buyer/requirements" variant="outline" leftIcon={<ClipboardList className="size-4" />}>
            Manage requirements
          </ButtonLink>
        }
      />

      {active.length === 0 && !selectedRequirement ? (
        <EmptyState
          icon={<Sparkles />}
          title="No active requirements"
          description="Matches are based on your requirements. Publish one to see recommended listings."
          action={<ButtonLink to="/buyer/requirements?new=1">New requirement</ButtonLink>}
        />
      ) : (
        <div className="space-y-6">
          <MatchDisclaimer />

          <Card padded className="space-y-4">
            <Select
              label="Requirement"
              options={[
                ...active.map((r) => ({ value: r.id, label: r.title })),
                ...(selectedRequirement && selectedStatus !== 'active' ? [{ value: selectedRequirement.id, label: `${selectedRequirement.title} (${selectedStatus})` }] : []),
              ]}
              value={selectedId}
              onChange={(e) => selectRequirement(e.target.value)}
              containerClassName="max-w-xl"
            />
            {selectedRequirement && (
              <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {[
                  ['Material', CATEGORY_BY_ID[selectedRequirement.category].name],
                  ['Quantity', formatQuantity(selectedRequirement.quantity, selectedRequirement.unit)],
                  ['Max budget', formatUnitPrice(selectedRequirement.budgetMax, selectedRequirement.unit)],
                  ['Location', `${stateName(selectedRequirement.preferredLocation)} · ≤${selectedRequirement.maxDeliveryDistanceKm} km`],
                  ['Application', APPLICATIONS[selectedRequirement.intendedApplication]],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-subtle">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {selectedStatus && selectedStatus !== 'active' && (
              <Alert tone="warning">This requirement is {selectedStatus}, so it isn’t used for new recommendations. Results below are for reference.</Alert>
            )}
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              label="Filter by match type"
              variant="pill"
              value={view}
              onChange={setView}
              items={[
                { value: 'all', label: 'All', count: all.length },
                { value: 'full', label: 'Full matches', count: fullCount },
                { value: 'partial', label: 'Partial matches', count: all.length - fullCount },
              ]}
            />
            <MatchLegend />
          </div>

          {matches.loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-36 w-full rounded-xl" />
              ))}
            </div>
          ) : matches.error ? (
            <ErrorState description={matches.error.message} onRetry={matches.reload} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<Sparkles />}
              title={all.length === 0 ? 'No suitable listings right now' : `No ${view} matches`}
              description={
                all.length === 0
                  ? 'No listings in this category currently meet the minimum score. We’ll keep checking as new listings arrive.'
                  : 'Try another filter.'
              }
            />
          ) : (
            <div className="space-y-4">
              {visible.map((item, index) => (
                <MatchCard
                  key={item.listing.listing.id}
                  item={item}
                  listingPath={`/buyer/marketplace/${item.listing.listing.id}`}
                  onRequestOrder={() => setOrdering(item)}
                  defaultExpanded={index === 0}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <RequestOrderModal
        item={ordering?.listing ?? null}
        onClose={() => setOrdering(null)}
        ordersPath="/buyer/orders"
        defaultQuantity={
          ordering && selectedRequirement
            ? Math.ceil(convertQuantity(selectedRequirement.quantity, selectedRequirement.unit, ordering.listing.listing.unit))
            : undefined
        }
      />
    </>
  )
}
