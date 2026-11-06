import { Boxes, CircleCheckBig, Inbox, PackageCheck, Plus, Store, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MatchScore, MatchTypeBadge } from '@/features/matching/MatchParts'
import { eventIcon } from '@/features/orders/timelineIcons'
import { useAsync } from '@/hooks/useAsync'
import { useViewer } from '@/hooks/useSession'
import { formatQuantity, formatRelative } from '@/lib/format'
import { formatTonnes, stockTotalsInTonnes } from '@/lib/stock'
import { services } from '@/services'

export function SellerOverviewPage() {
  const { user, isDemo } = useViewer()
  const listings = useAsync(() => services.sellerListings.listMine(), 'seller-listings')
  const orders = useAsync(() => services.sellerOrders.listIncoming(), 'seller-orders')
  const buyers = useAsync(() => services.matching.potentialBuyers(), 'potential-buyers')

  const mine = listings.data ?? []
  const totals = stockTotalsInTonnes(mine)
  const activeCount = mine.filter((l) => l.status === 'active').length
  const pending = (orders.data ?? []).filter((o) => o.status === 'pending')
  const activity = (orders.data ?? [])
    .flatMap((order) => order.timeline.map((event) => ({ event, order })))
    .sort((a, b) => b.event.at.localeCompare(a.event.at))
    .slice(0, 6)
  const loadingStock = listings.loading ? '—' : undefined

  return (
    <>
      <PageHeader
        eyebrow={isDemo ? <DemoBadge /> : undefined}
        title={`Welcome back, ${user.fullName.split(' ')[0]}`}
        description="Your listings, stock and incoming orders at a glance."
        actions={
          <ButtonLink to="/seller/listings/new" leftIcon={<Plus className="size-4" />}>
            Create listing
          </ButtonLink>
        }
      />

      <section aria-label="Listing and stock summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active listings" value={loadingStock ?? activeCount} icon={<Store />} hint={`${mine.length} listings in total`} />
        <StatCard label="Available stock" value={loadingStock ?? formatTonnes(totals.available)} icon={<Boxes />} tone="info" hint="Listed − reserved − sold" />
        <StatCard label="Reserved stock" value={loadingStock ?? formatTonnes(totals.reserved)} icon={<Inbox />} tone="accent" hint="Held for accepted orders" />
        <StatCard label="Sold stock" value={loadingStock ?? formatTonnes(totals.sold)} icon={<PackageCheck />} tone="neutral" hint="Completed orders" />
      </section>
      <p className="mt-2 text-xs text-subtle">Stock totals are tonne-equivalents (50 kg per bag) so listings in different units add up.</p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr] *:min-w-0">
        <Card>
          <CardHeader
            title="New order requests"
            description="Accept or decline — stock is reserved only when you accept."
            action={
              <Link to="/seller/orders" className="text-sm font-semibold text-action hover:underline">
                All orders
              </Link>
            }
          />
          <CardBody className="p-0 sm:p-0">
            {orders.loading ? (
              <div className="space-y-3 p-5">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : orders.error ? (
              <ErrorState description={orders.error.message} onRetry={orders.reload} />
            ) : pending.length === 0 ? (
              <EmptyState compact icon={<CircleCheckBig />} title="No new requests" description="New order requests from buyers will appear here." />
            ) : (
              <ul className="divide-y divide-border">
                {pending.map((order) => (
                  <li key={order.id}>
                    <Link to={`/seller/orders/${order.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-muted sm:px-6">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{order.listing.name}</p>
                        <p className="truncate text-xs text-subtle">
                          {order.reference} · {formatQuantity(order.quantity, order.listing.unit)} · {order.buyerBusinessName}
                        </p>
                      </div>
                      <StatusBadge kind="order" status={order.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Potential buyers"
            description="Buyer requirements that match your listings."
            action={
              <Link to="/seller/potential-buyers" className="text-sm font-semibold text-action hover:underline">
                View all
              </Link>
            }
          />
          <CardBody className="p-0 sm:p-0">
            {buyers.loading ? (
              <div className="space-y-3 p-5">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (buyers.data ?? []).length === 0 ? (
              <EmptyState compact icon={<Users />} title="No matching requirements yet" description="Keep your listings up to date to be recommended." />
            ) : (
              <ul className="divide-y divide-border">
                {(buyers.data ?? []).slice(0, 4).map((b) => (
                  <li key={`${b.requirement.id}-${b.listing.id}`} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                    <MatchScore score={b.match.score} type={b.match.type} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{b.requirement.title}</p>
                      <p className="truncate text-xs text-subtle">
                        {b.buyerLabel} · for “{b.listing.name}”
                      </p>
                    </div>
                    <MatchTypeBadge type={b.match.type} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr] *:min-w-0">
        <Card>
          <CardHeader title="Your listings" description="Stock by listing." action={<Link to="/seller/inventory" className="text-sm font-semibold text-action hover:underline">Inventory</Link>} />
          <CardBody className="p-0 sm:p-0">
            {listings.loading ? (
              <div className="p-5">
                <Skeleton className="h-32 w-full" />
              </div>
            ) : mine.length === 0 ? (
              <EmptyState compact icon={<Store />} title="No listings yet" action={<ButtonLink to="/seller/listings/new" size="sm">Create listing</ButtonLink>} />
            ) : (
              <ul className="divide-y divide-border">
                {mine.slice(0, 5).map((l) => (
                  <li key={l.id}>
                    <Link to={`/seller/listings/${l.id}/edit`} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-muted sm:px-6">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{l.name}</p>
                        <p className="text-xs text-subtle tabular-nums">
                          {formatQuantity(Math.max(0, l.listedQuantity - l.reservedQuantity - l.soldQuantity), l.unit)} available of {formatQuantity(l.listedQuantity, l.unit)}
                        </p>
                      </div>
                      <StatusBadge kind="listing" status={l.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent activity" />
          <CardBody>
            {orders.loading ? (
              <Skeleton className="h-40 w-full" />
            ) : activity.length === 0 ? (
              <p className="text-sm text-muted">No activity yet.</p>
            ) : (
              <ul className="space-y-4">
                {activity.map(({ event, order }) => {
                  const Icon = eventIcon(event)
                  return (
                    <li key={event.id} className="flex gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-muted">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 text-sm">
                        <p className="font-medium">
                          {event.title} <span className="font-normal text-subtle">· {order.reference}</span>
                        </p>
                        <p className="text-xs text-subtle">
                          {order.listing.name} · {formatRelative(event.at)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
