import { FlaskConical } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { StatCard } from '@/components/ui/StatCard'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { Bars, ChartFrame } from '@/features/admin/charts'
import { useAsync } from '@/hooks/useAsync'
import { useViewer } from '@/hooks/useSession'
import { formatCurrency } from '@/lib/format'
import { formatKg } from '@/lib/stock'
import { services } from '@/services'

const MONTH = new Intl.DateTimeFormat('en-NG', { month: 'short', year: 'numeric' })

/** Compact naira for axes and labels, e.g. ₦1.2m, ₦850k. */
function compactNaira(value: number) {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
  if (value >= 1_000) return `₦${Math.round(value / 1_000)}k`
  return `₦${value}`
}

export function AdminReportsPage() {
  const { isDemo } = useViewer()
  const { data, loading, error, reload } = useAsync(() => services.insights.reports(), 'admin-reports')

  if (loading && !data) return <Skeleton className="h-96 w-full rounded-xl" />
  if (error || !data) return <ErrorState description={error?.message} onRetry={reload} />

  const months = data.completedValueByMonth.map((m) => ({ month: MONTH.format(new Date(`${m.month}-01T00:00:00Z`)), value: m.value }))

  return (
    <>
      <PageHeader title="Reports & analytics" description="Orders, completed value, supply and demand across the marketplace." />

      {isDemo ? (
        <Alert tone="warning" title="Illustrative demo data" className="mb-6">
          <span className="inline-flex items-center gap-1.5">
            <FlaskConical className="size-4" aria-hidden="true" />
            Every figure below is computed from sample records. None of it describes real customers, transactions or platform performance.
          </span>
        </Alert>
      ) : (
        <Alert tone="info" className="mb-6">
          Figures are calculated from live platform data.
        </Alert>
      )}

      <section aria-label="Stock across the marketplace" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Listed stock" value={formatKg(data.stockKg.listed)} tone="neutral" hint="All units converted to kg" />
        <StatCard label="Available" value={formatKg(data.stockKg.available)} hint="Listed − reserved − sold" />
        <StatCard label="Reserved" value={formatKg(data.stockKg.reserved)} tone="accent" hint="Accepted, not yet completed" />
        <StatCard label="Sold" value={formatKg(data.stockKg.sold)} tone="info" hint="Completed orders" />
      </section>

      <div className="grid gap-6 xl:grid-cols-2 *:min-w-0">
        <ChartFrame title="Orders by status" description="All orders, current status." data={data.ordersByStatus} labelKey="status" labelHeader="Status" series={[{ key: 'count', label: 'Orders', slot: 1 }]} demo={isDemo}>
          <Bars data={data.ordersByStatus} labelKey="status" series={[{ key: 'count', label: 'Orders', slot: 1 }]} layout="horizontal" height={Math.max(200, data.ordersByStatus.length * 36)} />
        </ChartFrame>

        <ChartFrame
          title="Completed order value"
          description="Material value of orders completed each month (excludes delivery fees)."
          data={months}
          labelKey="month"
          labelHeader="Month"
          series={[{ key: 'value', label: 'Completed value', slot: 1 }]}
          format={(v) => formatCurrency(v)}
          demo={isDemo}
        >
          <Bars data={months} labelKey="month" series={[{ key: 'value', label: 'Completed value', slot: 1 }]} format={compactNaira} />
        </ChartFrame>

        <ChartFrame
          title="Supply and demand by category"
          description="Active listings compared with active buyer requirements."
          data={data.supplyDemandByCategory}
          labelKey="category"
          labelHeader="Category"
          series={[
            { key: 'listings', label: 'Active listings', slot: 1 },
            { key: 'requirements', label: 'Active requirements', slot: 2 },
          ]}
          demo={isDemo}
          className="xl:col-span-2"
        >
          <Bars
            data={data.supplyDemandByCategory}
            labelKey="category"
            series={[
              { key: 'listings', label: 'Active listings', slot: 1 },
              { key: 'requirements', label: 'Active requirements', slot: 2 },
            ]}
            layout="horizontal"
            height={Math.max(220, data.supplyDemandByCategory.length * 56)}
          />
        </ChartFrame>
      </div>
    </>
  )
}
