import { Coins, Settings } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { DataTable, type Column } from '@/components/ui/Table'
import { useAsync } from '@/hooks/useAsync'
import { useViewer } from '@/hooks/useSession'
import { formatCurrency, formatDate } from '@/lib/format'
import { services } from '@/services'
import type { CommissionEstimate } from '@/types/admin'

export function AdminCommissionsPage() {
  const { isDemo } = useViewer()
  const { data, loading, error, reload } = useAsync(() => services.insights.commissions(), 'commissions')

  if (loading && !data) return <Skeleton className="h-96 w-full rounded-xl" />
  if (error || !data) return <ErrorState description={error?.message} onRetry={reload} />

  const total = data.records.reduce((sum, r) => sum + r.amount, 0)
  const collected = data.records.filter((r) => r.status === 'collected').reduce((sum, r) => sum + r.amount, 0)
  const value = data.records.reduce((sum, r) => sum + r.orderValue, 0)

  const columns: Column<CommissionEstimate>[] = [
    {
      key: 'order',
      header: 'Completed order',
      render: (r) => (
        <div>
          <p className="font-semibold text-fg">{r.orderReference}</p>
          <p className="text-xs text-subtle">{formatDate(r.completedAt)}</p>
        </div>
      ),
    },
    { key: 'seller', header: 'Seller', hideOnMobile: true, render: (r) => <span className="text-xs text-muted">{r.sellerBusinessName}</span> },
    { key: 'value', header: 'Order value', align: 'right', render: (r) => <span className="tabular-nums">{formatCurrency(r.orderValue)}</span> },
    { key: 'rate', header: 'Rate', align: 'right', hideOnMobile: true, render: (r) => <span className="tabular-nums">{r.ratePercent}%</span> },
    { key: 'amount', header: 'Commission', align: 'right', render: (r) => <span className="font-semibold tabular-nums">{formatCurrency(r.amount)}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (r.status === 'collected' ? <Badge tone="success">Collected</Badge> : <Badge tone="neutral">Not collected</Badge>),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow={isDemo ? <DemoBadge /> : undefined}
        title="Commissions"
        description="HeyCileng’s commission on completed orders, at the configured rate."
        actions={
          <ButtonLink to="/admin/settings" variant="outline" leftIcon={<Settings className="size-4" />}>
            Commission settings
          </ButtonLink>
        }
      />

      <Alert tone="info" title="How commission is collected" className="mb-6">
        Buyers pay the full order value to HeyCileng through Paystack. HeyCileng keeps the commission — at the rate recorded when the buyer paid — and transfers the rest to the seller after completion.
        Completed orders that were never paid are shown as estimates at the current rate.
      </Alert>

      <section aria-label="Commission summary" className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Commission rate" value={`${data.ratePercent}%`} icon={<Coins />} hint="Of completed order value" />
        <StatCard label="Completed order value" value={formatCurrency(value)} tone="neutral" hint={`${data.records.length} orders`} />
        <StatCard label="Commission collected" value={formatCurrency(collected)} tone="accent" hint={total > collected ? `${formatCurrency(total - collected)} on unpaid orders (estimate)` : 'Through Paystack payments'} />
      </section>

      <DataTable
        caption="Commission estimates by completed order"
        columns={columns}
        rows={data.records}
        rowKey={(r) => r.orderId}
        empty={<EmptyState compact icon={<Coins />} title="No completed orders yet" />}
      />
    </>
  )
}
