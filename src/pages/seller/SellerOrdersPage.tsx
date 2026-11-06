import { Inbox } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Tabs } from '@/components/ui/Tabs'
import { STATUS_META } from '@/config/statuses'
import { OrdersTable } from '@/features/orders/OrdersTable'
import { useAsync } from '@/hooks/useAsync'
import { usePagination } from '@/hooks/usePagination'
import { services } from '@/services'
import type { OrderStatus } from '@/types/status'

type TabValue = 'all' | OrderStatus
const ORDER: OrderStatus[] = ['pending', 'accepted', 'processing', 'dispatched', 'ready_for_collection', 'completed', 'declined', 'cancelled', 'delivery_failed']

export function SellerOrdersPage() {
  const { data, loading, error, reload } = useAsync(() => services.sellerOrders.listIncoming(), 'seller-orders')
  const [tab, setTab] = useState<TabValue>('pending')
  const [query, setQuery] = useState('')

  const orders = useMemo(() => data ?? [], [data])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter(
      (o) => (tab === 'all' || o.status === tab) && (!q || [o.reference, o.listing.name, o.buyerBusinessName].some((t) => t.toLowerCase().includes(q))),
    )
  }, [orders, tab, query])
  const pagination = usePagination(filtered, 8, `${tab}|${query}`)

  return (
    <>
      <PageHeader title="Incoming orders" description="Review new requests and follow accepted orders through to completion." />

      <Tabs
        label="Filter orders by status"
        value={tab}
        onChange={setTab}
        className="mb-4"
        items={[
          ...ORDER.map((status) => ({
            value: status,
            label: status === 'pending' ? 'New requests' : STATUS_META.order[status].label,
            count: orders.filter((o) => o.status === status).length,
          })),
          { value: 'all' as const, label: 'All history', count: orders.length },
        ]}
      />
      <SearchBar value={query} onChange={setQuery} placeholder="Search by order number, material or buyer" className="mb-4 max-w-md" label="Search orders" />

      {error ? (
        <ErrorState description={error.message} onRetry={reload} />
      ) : (
        <>
          <OrdersTable
            orders={pagination.pageItems}
            basePath="/seller/orders"
            loading={loading}
            counterparty="buyer"
            empty={
              <EmptyState
                compact
                icon={<Inbox />}
                title={tab === 'pending' ? 'No new requests' : 'No orders here'}
                description={tab === 'pending' ? 'You’ll be notified when a buyer requests one of your listings.' : 'Try another status.'}
              />
            }
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
