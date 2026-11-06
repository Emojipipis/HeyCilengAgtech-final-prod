import { Boxes } from 'lucide-react'
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
import { CATEGORY_BY_ID } from '@/config/catalog'
import { stateName } from '@/config/locations'
import { STATUS_META } from '@/config/statuses'
import { ListingImage } from '@/features/marketplace/ListingImage'
import { useAsync } from '@/hooks/useAsync'
import { usePagination } from '@/hooks/usePagination'
import { useViewer } from '@/hooks/useSession'
import { formatDate, formatQuantity, formatUnitPrice } from '@/lib/format'
import { availableQuantity } from '@/lib/inventory'
import { services } from '@/services'
import type { MarketplaceListing } from '@/types/listing'
import type { ListingStatus } from '@/types/status'

type TabValue = 'all' | ListingStatus
const ORDER: ListingStatus[] = ['pending_review', 'active', 'paused', 'sold_out', 'rejected', 'suspended', 'draft']

export function AdminListingsPage() {
  const navigate = useNavigate()
  const { isDemo } = useViewer()
  const { data, loading, error, reload } = useAsync(() => services.adminListings.list(), 'admin-listings')
  const [tab, setTab] = useState<TabValue>('pending_review')
  const [query, setQuery] = useState('')

  const all = useMemo(() => data ?? [], [data])
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((i) => (tab === 'all' || i.listing.status === tab) && (!q || [i.listing.name, i.seller.businessName].some((t) => t.toLowerCase().includes(q))))
  }, [all, tab, query])
  const pagination = usePagination(rows, 10, `${tab}|${query}`)

  const columns: Column<MarketplaceListing>[] = [
    {
      key: 'listing',
      header: 'Listing',
      render: ({ listing }) => (
        <div className="flex items-center gap-3">
          <div className="size-11 shrink-0 overflow-hidden rounded-md">
            <ListingImage image={listing.images[0]} category={listing.category} showLabel={false} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-fg">{listing.name}</p>
            <p className="truncate text-xs text-subtle">{CATEGORY_BY_ID[listing.category].name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'seller',
      header: 'Seller',
      hideOnMobile: true,
      render: ({ seller, listing }) => (
        <div className="text-xs">
          <p className="text-fg">{seller.businessName}</p>
          <p className="text-subtle">{listing.location.area}, {stateName(listing.location.state)}</p>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Available · price',
      hideOnMobile: true,
      render: ({ listing }) => (
        <div className="text-xs tabular-nums">
          <p className="text-fg">{formatQuantity(availableQuantity(listing), listing.unit)}</p>
          <p className="text-subtle">{formatUnitPrice(listing.pricePerUnit, listing.unit)}</p>
        </div>
      ),
    },
    { key: 'updated', header: 'Updated', hideOnMobile: true, render: ({ listing }) => <span className="text-xs text-muted">{formatDate(listing.updatedAt)}</span> },
    { key: 'status', header: 'Status', render: ({ listing }) => <StatusBadge kind="listing" status={listing.status} /> },
  ]

  return (
    <>
      <PageHeader eyebrow={isDemo ? <DemoBadge /> : undefined} title="Listings" description="Review new listings before they go live, and suspend listings that break marketplace rules." />
      <Tabs
        label="Filter listings"
        value={tab}
        onChange={setTab}
        className="mb-4"
        items={[
          ...ORDER.filter((s) => s === 'pending_review' || s === 'active' || all.some((i) => i.listing.status === s)).map((s) => ({
            value: s,
            label: s === 'pending_review' ? 'Needs review' : STATUS_META.listing[s].label,
            count: all.filter((i) => i.listing.status === s).length,
          })),
          { value: 'all' as const, label: 'All', count: all.length },
        ]}
      />
      <SearchBar value={query} onChange={setQuery} placeholder="Search listing or seller" className="mb-4 max-w-md" label="Search listings" />
      {error ? (
        <ErrorState description={error.message} onRetry={reload} />
      ) : (
        <>
          <DataTable
            caption="Listings"
            columns={columns}
            rows={pagination.pageItems}
            rowKey={(i) => i.listing.id}
            loading={loading}
            onRowClick={(i) => navigate(`/admin/listings/${i.listing.id}`)}
            empty={<EmptyState compact icon={<Boxes />} title={tab === 'pending_review' ? 'Nothing waiting for review' : 'No listings here'} />}
          />
          {pagination.pageCount > 1 && (
            <Pagination className="mt-4" page={pagination.page} pageCount={pagination.pageCount} onPageChange={pagination.setPage} rangeStart={pagination.rangeStart} rangeEnd={pagination.rangeEnd} total={pagination.total} />
          )}
        </>
      )}
    </>
  )
}
