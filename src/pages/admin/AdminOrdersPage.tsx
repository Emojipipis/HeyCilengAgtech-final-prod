import { ArrowRight, Package } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/ui/Table'
import { Tabs } from '@/components/ui/Tabs'
import { STATUS_META } from '@/config/statuses'
import { useAsync } from '@/hooks/useAsync'
import { usePagination } from '@/hooks/usePagination'
import { useViewer } from '@/hooks/useSession'
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format'
import { nextAdminAction, NEXT_ACTION_LABEL, type AdminNextAction } from '@/lib/logistics'
import { services } from '@/services'
import type { Order } from '@/types/order'
import type { OrderStatus } from '@/types/status'

type TabValue = 'needs_action' | 'all' | OrderStatus
// Collection is retired: every order is delivered by a HeyCileng logistics partner.
const STATUSES = (Object.keys(STATUS_META.order) as OrderStatus[]).filter((s) => s !== 'ready_for_collection')

/** Steps HeyCileng must take. Waiting on the seller, or deliveries already under way, aren't listed. */
const ACTIONABLE: AdminNextAction[] = ['assign_partner', 'resolve_failed']
const needsAction = (o: Order) => ACTIONABLE.includes(nextAdminAction(o))

export function AdminOrdersPage() {
  const navigate = useNavigate()
  const { isDemo } = useViewer()
  const { data, loading, error, reload } = useAsync(() => services.adminOrders.listAll(), 'admin-orders')
  const [tab, setTab] = useState<TabValue>('needs_action')
  const [query, setQuery] = useState('')

  const orders = useMemo(() => data ?? [], [data])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter(
      (o) =>
        (tab === 'all' || (tab === 'needs_action' ? needsAction(o) : o.status === tab)) &&
        (!q || [o.reference, o.listing.name, o.buyerBusinessName, o.listing.sellerBusinessName].some((t) => t.toLowerCase().includes(q))),
    )
  }, [orders, tab, query])
  const pagination = usePagination(filtered, 10, `${tab}|${query}`)

  const columns: Column<Order>[] = [
    {
      key: 'ref',
      header: 'Order',
      render: (o) => (
        <div>
          <p className="font-semibold text-fg">{o.reference}</p>
          <p className="text-xs text-subtle">Updated {formatDate(o.updatedAt)}</p>
        </div>
      ),
    },
    {
      key: 'material',
      header: 'Material',
      render: (o) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">{o.listing.name}</p>
          <p className="text-xs text-subtle tabular-nums">
            {formatQuantity(o.quantity, o.listing.unit)} · {formatCurrency(o.subtotal)}
          </p>
        </div>
      ),
    },
    {
      key: 'parties',
      header: 'Seller → Buyer',
      hideOnMobile: true,
      render: (o) => (
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <span className="max-w-36 truncate">{o.listing.sellerBusinessName}</span>
          <ArrowRight className="size-3 shrink-0" aria-hidden="true" />
          <span className="max-w-36 truncate">{o.buyerBusinessName}</span>
        </p>
      ),
    },
    { key: 'status', header: 'Order', render: (o) => <StatusBadge kind="order" status={o.status} /> },
    {
      key: 'next',
      header: 'Next step',
      hideOnMobile: true,
      render: (o) => <span className={needsAction(o) ? 'text-xs font-semibold text-ochre-700 dark:text-ochre-300' : 'text-xs text-subtle'}>{NEXT_ACTION_LABEL[nextAdminAction(o)]}</span>,
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow={isDemo ? <DemoBadge /> : undefined}
        title="Orders"
        description="Every order on the platform. HeyCileng assigns a logistics partner to each one, confirms delivery and resolves problems."
      />

      <Tabs
        label="Filter orders"
        value={tab}
        onChange={setTab}
        className="mb-4"
        items={[
          { value: 'needs_action', label: 'Needs action', count: orders.filter(needsAction).length },
          { value: 'all', label: 'All', count: orders.length },
          ...STATUSES.map((s) => ({ value: s, label: STATUS_META.order[s].label, count: orders.filter((o) => o.status === s).length })),
        ]}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchBar value={query} onChange={setQuery} placeholder="Search order, material, buyer or seller" className="sm:max-w-md sm:flex-1" label="Search orders" />
      </div>

      {error ? (
        <ErrorState description={error.message} onRetry={reload} />
      ) : (
        <>
          <DataTable
            caption="All orders"
            columns={columns}
            rows={pagination.pageItems}
            rowKey={(o) => o.id}
            loading={loading}
            onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
            empty={<EmptyState compact icon={<Package />} title={tab === 'needs_action' ? 'Nothing needs action' : 'No orders here'} description="Try another tab or search." />}
          />
          {pagination.pageCount > 1 && (
            <Pagination
              className="mt-4"
              page={pagination.page}
              pageCount={pagination.pageCount}
              onPageChange={pagination.setPage}
              rangeStart={pagination.rangeStart}
              rangeEnd={pagination.rangeEnd}
              total={pagination.total}
            />
          )}
        </>
      )}
    </>
  )
}
