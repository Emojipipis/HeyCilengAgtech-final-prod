import { Settings, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { ButtonLink } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/ui/Table'
import { CRITERION_LABELS, MATCH_CONFIG, MATCH_WEIGHTS } from '@/config/matching'
import { useAsync } from '@/hooks/useAsync'
import { useViewer } from '@/hooks/useSession'
import { services } from '@/services'
import type { AdminMatchmaking } from '@/types/admin'
import type { RequirementStatus } from '@/types/status'

type Row = AdminMatchmaking['requirements'][number]

export function AdminMatchmakingPage() {
  const { isDemo } = useViewer()
  const { data, loading, error, reload } = useAsync(() => services.insights.matchmaking(), 'admin-matchmaking')

  if (loading && !data) return <Skeleton className="h-96 w-full rounded-xl" />
  if (error || !data) return <ErrorState description={error?.message} onRetry={reload} />

  const columns: Column<Row>[] = [
    {
      key: 'title',
      header: 'Requirement',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-fg">{r.title}</p>
          <p className="truncate text-xs text-subtle">
            {r.buyerLabel} · {r.category}
          </p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge kind="requirement" status={r.status as RequirementStatus} /> },
    {
      key: 'matches',
      header: 'Recommended listings',
      align: 'right',
      render: (r) => (r.status === 'active' ? <span className="tabular-nums">{r.matches} <span className="text-xs text-subtle">({r.full} full)</span></span> : <span className="text-xs text-subtle">Not matched</span>),
    },
    { key: 'best', header: 'Best score', align: 'right', hideOnMobile: true, render: (r) => <span className="tabular-nums">{r.bestScore ?? '—'}</span> },
  ]

  return (
    <>
      <PageHeader
        eyebrow={isDemo ? <DemoBadge /> : undefined}
        title="Matchmaking"
        description="How well buyer requirements and seller listings are matching across the platform."
        actions={
          <ButtonLink to="/admin/settings" variant="outline" leftIcon={<Settings className="size-4" />}>
            Matching settings
          </ButtonLink>
        }
      />

      <Alert tone="info" title="Matching is advisory" className="mb-6">
        Scores recommend listings and potential buyers. They never create orders, reserve stock or contact anyone. Material category is a hard restriction.
      </Alert>

      <section aria-label="Matching statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active requirements" value={data.activeRequirements} icon={<Sparkles />} />
        <StatCard label="Active listings" value={data.activeListings} tone="accent" />
        <StatCard label="Full matches" value={data.fullMatches} tone="info" hint="Quantity, location and price all fit" />
        <StatCard label="Partial matches" value={data.partialMatches} tone="neutral" hint="Usable with limitations" />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr] *:min-w-0">
        <section aria-labelledby="req-heading">
          <h2 id="req-heading" className="mb-3 text-lg font-bold">
            Requirements
          </h2>
          <DataTable caption="Requirements and their matches" columns={columns} rows={data.requirements} rowKey={(r) => r.id} />
        </section>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Current weights" description={`Minimum recommended score: ${MATCH_CONFIG.minRecommendedScore}`} />
            <CardBody>
              <ul className="space-y-3">
                {(Object.keys(MATCH_WEIGHTS) as (keyof typeof MATCH_WEIGHTS)[]).map((k) => (
                  <li key={k}>
                    <div className="flex justify-between text-sm">
                      <span>{CRITERION_LABELS[k]}</span>
                      <span className="font-semibold tabular-nums">{Math.round(MATCH_WEIGHTS[k] * 100)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                      <div className="h-full rounded-full bg-chart-1" style={{ width: `${MATCH_WEIGHTS[k] * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Listings without demand" description="Active listings no active requirement matches." />
            <CardBody className="p-0 sm:p-0">
              {data.unmatchedListings.length === 0 ? (
                <EmptyState compact title="Every active listing has a match" />
              ) : (
                <ul className="divide-y divide-border">
                  {data.unmatchedListings.map((l) => (
                    <li key={l.id}>
                      <Link to={`/admin/listings/${l.id}`} className="block px-5 py-3 text-sm transition-colors hover:bg-surface-muted sm:px-6">
                        <p className="font-medium text-fg">{l.name}</p>
                        <p className="text-xs text-subtle">
                          {l.sellerBusinessName} · {l.category}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}

