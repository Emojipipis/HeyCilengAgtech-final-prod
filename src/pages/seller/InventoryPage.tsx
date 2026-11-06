import { Boxes, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/ui/Table'
import { StockBar } from '@/features/listings/StockBar'
import { useAsync } from '@/hooks/useAsync'
import { formatQuantity } from '@/lib/format'
import { availableQuantity } from '@/lib/inventory'
import { formatTonnes, stockTotalsInTonnes } from '@/lib/stock'
import { services } from '@/services'
import type { Listing } from '@/types/listing'

export function InventoryPage() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useAsync(() => services.sellerListings.listMine(), 'seller-listings')
  const listings = data ?? []
  const totals = stockTotalsInTonnes(listings)

  const qty = (value: number, l: Listing) => <span className="tabular-nums">{formatQuantity(value, l.unit)}</span>
  const columns: Column<Listing>[] = [
    {
      key: 'name',
      header: 'Listing',
      render: (l) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">{l.name}</p>
          <div className="mt-1">
            <StatusBadge kind="listing" status={l.status} />
          </div>
        </div>
      ),
    },
    { key: 'listed', header: 'Listed', align: 'right', render: (l) => qty(l.listedQuantity, l) },
    { key: 'reserved', header: 'Reserved', align: 'right', render: (l) => qty(l.reservedQuantity, l) },
    { key: 'sold', header: 'Sold', align: 'right', render: (l) => qty(l.soldQuantity, l) },
    { key: 'available', header: 'Available', align: 'right', render: (l) => <span className="font-semibold text-fg tabular-nums">{formatQuantity(availableQuantity(l), l.unit)}</span> },
    { key: 'bar', header: <span className="sr-only">Stock breakdown</span>, render: (l) => <StockBar listing={l} showLegend={false} className="w-32" />, hideOnMobile: true },
  ]

  return (
    <>
      <PageHeader title="Inventory" description="Track listed, reserved, sold and available quantities for every listing." />

      <Card padded className="mb-6 flex gap-3 bg-surface-muted">
        <Info className="mt-0.5 size-5 shrink-0 text-action" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold">
            Available = Listed − Reserved − Sold
          </p>
          <p className="mt-1 text-muted">
            Stock is <span className="font-medium text-fg">reserved</span> when you accept an order and becomes <span className="font-medium text-fg">sold</span> when
            HeyCileng confirms delivery or collection. Pending requests don’t affect stock.
          </p>
        </div>
      </Card>

      <section aria-label="Stock totals" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Listed" value={loading ? '—' : formatTonnes(totals.listed)} icon={<Boxes />} tone="neutral" />
        <StatCard label="Reserved" value={loading ? '—' : formatTonnes(totals.reserved)} tone="accent" />
        <StatCard label="Sold" value={loading ? '—' : formatTonnes(totals.sold)} tone="neutral" />
        <StatCard label="Available" value={loading ? '—' : formatTonnes(totals.available)} tone="brand" />
      </section>

      {error ? (
        <ErrorState description={error.message} onRetry={reload} />
      ) : (
        <>
          <DataTable
            caption="Inventory by listing"
            columns={columns}
            rows={listings}
            rowKey={(l) => l.id}
            loading={loading}
            onRowClick={(l) => navigate(`/seller/listings/${l.id}/edit`)}
            empty={<EmptyState compact icon={<Boxes />} title="No listings yet" />}
          />
          <p className="mt-2 text-xs text-subtle">Totals are tonne-equivalents (50 kg per bag). Rows show each listing’s own unit.</p>
        </>
      )}
    </>
  )
}
