import { Package } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
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
const STATUSES = Object.keys(STATUS_META.order) as OrderStatus[]

export function BuyerOrdersPage() {
  const { data, loading, error, reload } = useAsync(() => services.orders.listMine(), 'orders')
  const [tab, setTab] = useState<TabValue>('all')
  const [query, setQuery] = useState('')

  const orders = useMemo(() => data ?? [], [data])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter(
      (o) =>
        (tab === 'all' || o.status === tab) &&
        (!q || [o.reference, o.listing.name, o.listing.sellerBusinessName].some((text) => text.toLowerCase().includes(q))),
    )
  }, [orders, tab, query])
  const pagination = usePagination(filtered, 8, `${tab}|${query}`)

  return (
    <>
      <PageHeader title="My orders" description="Track every order request from pending through to completion." />

      <Tabs
        label="Filter orders by status"
        value={tab}
        onChange={setTab}
        className="mb-4"
        items={[
          { value: 'all', label: 'All', count: orders.length },
          ...STATUSES.map((status) => ({
            value: status,
            label: STATUS_META.order[status].label,
            count: orders.filter((o) => o.status === status).length,
          })),
        ]}
      />

      <SearchBar value={query} onChange={setQuery} placeholder="Search by order number, material or seller" className="mb-4 max-w-md" label="Search orders" />

      {error ? (
        <ErrorState description={error.message} onRetry={reload} />
      ) : (
        <>
          <OrdersTable
            orders={pagination.pageItems}
            basePath="/buyer/orders"
            loading={loading}
            counterparty="seller"
            empty={
              <EmptyState
                compact
                icon={<Package />}
                title={orders.length === 0 ? 'No orders yet' : 'No orders match'}
                description={orders.length === 0 ? 'Order requests you send from listings appear here.' : 'Try another status or search.'}
                action={orders.length === 0 ? <ButtonLink to="/buyer/marketplace" size="sm">Browse marketplace</ButtonLink> : undefined}
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
