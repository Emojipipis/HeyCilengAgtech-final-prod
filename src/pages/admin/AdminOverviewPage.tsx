import { Boxes, ClipboardCheck, LifeBuoy, Package, Scale, ShoppingBasket, Store, TriangleExclamationPoint, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { StatCard } from '@/components/ui/StatCard'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { Bars, ChartFrame } from '@/features/admin/charts'
import { useAsync } from '@/hooks/useAsync'
import { useViewer } from '@/hooks/useSession'
import { formatCurrency, formatDate, formatRelative } from '@/lib/format'
import { services } from '@/services'

export function AdminOverviewPage() {
  const { isDemo } = useViewer()
  const overview = useAsync(() => services.insights.overview(), 'admin-overview')
  const activity = useAsync(() => services.audit.list(), 'admin-audit')

  if (overview.loading && !overview.data) return <Skeleton className="h-96 w-full rounded-xl" />
  if (overview.error || !overview.data) return <ErrorState description={overview.error?.message} onRetry={overview.reload} />
  const o = overview.data
  const weekly = o.ordersByWeek.map((w) => ({ week: formatDate(w.week).replace(/ \d{4}$/, ''), orders: w.orders }))

  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)
  const attention = [
    { count: o.listings.pendingReview, label: plural(o.listings.pendingReview, 'listing waiting for review', 'listings waiting for review'), to: '/admin/listings', icon: ClipboardCheck },
    { count: o.orders.needsAction, label: plural(o.orders.needsAction, 'order needing logistics or confirmation', 'orders needing logistics or confirmation'), to: '/admin/orders', icon: Truck },
    { count: o.support.openTickets, label: plural(o.support.openTickets, 'open support ticket', 'open support tickets'), to: '/admin/support', icon: LifeBuoy },
    { count: o.support.openDisputes, label: plural(o.support.openDisputes, 'open dispute', 'open disputes'), to: '/admin/disputes', icon: Scale },
  ]

  return (
    <>
      <PageHeader eyebrow={isDemo ? <DemoBadge label="Illustrative demo data — not real platform statistics" /> : undefined} title="Overview" description="Platform activity and what needs HeyCileng’s attention." />

      <section aria-label="Platform statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sellers" value={o.users.sellers} icon={<Store />} hint={o.users.suspended ? `${o.users.suspended} account${o.users.suspended === 1 ? '' : 's'} suspended` : 'No suspensions'} />
        <StatCard label="Buyers" value={o.users.buyers} icon={<ShoppingBasket />} tone="accent" />
        <StatCard label="Active listings" value={o.listings.active} icon={<Boxes />} tone="info" hint={`${o.listings.pendingReview} pending review`} />
        <StatCard label="Open orders" value={o.orders.open} icon={<Package />} tone="neutral" hint={`${o.orders.completed} completed · ${formatCurrency(o.orders.completedValue)}`} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.3fr] *:min-w-0">
        <Card>
          <CardHeader title="Needs attention" />
          <CardBody className="p-0 sm:p-0">
            <ul className="divide-y divide-border">
              {attention.map(({ count, label, to, icon: Icon }) => (
                <li key={label}>
                  <Link to={to} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-muted sm:px-6">
                    <Icon className={count ? 'size-5 text-ochre-600 dark:text-ochre-300' : 'size-5 text-subtle'} aria-hidden="true" />
                    <span className="flex-1 text-sm">
                      <span className="font-semibold text-fg tabular-nums">{count}</span> <span className="text-muted">{label}</span>
                    </span>
                    {count > 0 && <TriangleExclamationPoint className="size-4 text-ochre-600 dark:text-ochre-300" aria-label="Action needed" />}
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <ChartFrame
          title="New orders per week"
          description="Last 8 weeks, by week starting Monday."
          data={weekly}
          labelKey="week"
          labelHeader="Week of"
          series={[{ key: 'orders', label: 'Orders', slot: 1 }]}
          demo={isDemo}
        >
          <Bars data={weekly} labelKey="week" series={[{ key: 'orders', label: 'Orders', slot: 1 }]} height={220} />
        </ChartFrame>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent administrative activity" action={<Link to="/admin/audit" className="text-sm font-semibold text-action hover:underline">Audit logs</Link>} />
        <CardBody className="p-0 sm:p-0">
          {activity.loading ? (
            <div className="p-5">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {(activity.data ?? []).slice(0, 6).map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-5 py-3 text-sm sm:px-6">
                  <span>
                    <span className="font-medium text-fg">{e.action}</span> <span className="text-muted">· {e.targetLabel}</span>
                  </span>
                  <span className="text-xs text-subtle">
                    {e.actor} · {formatRelative(e.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  )
}
