import { ArrowRight, Bell, ClipboardList, Heart, Package, Plus, Sparkles, Store } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ListingCard } from '@/features/marketplace/ListingCard'
import { MatchScore, MatchTypeBadge } from '@/features/matching/MatchParts'
import { NotificationItem } from '@/features/notifications/NotificationItem'
import { announceNotificationsChanged } from '@/features/notifications/notificationEvents'
import { OrdersTable } from '@/features/orders/OrdersTable'
import { useAsync } from '@/hooks/useAsync'
import { useSavedListings } from '@/hooks/useSavedListings'
import { useViewer } from '@/hooks/useSession'
import { formatQuantity } from '@/lib/format'
import { effectiveRequirementStatus } from '@/lib/requirements'
import { services } from '@/services'
import type { OrderStatus } from '@/types/status'

const ACTIVE_ORDER: OrderStatus[] = ['pending', 'accepted', 'processing', 'dispatched']

function greeting() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

export function BuyerOverviewPage() {
  const navigate = useNavigate()
  const { user, isDemo } = useViewer()
  const saved = useSavedListings()
  const orders = useAsync(() => services.orders.listMine(), 'orders')
  const requirements = useAsync(() => services.requirements.list(), 'requirements')
  const matches = useAsync(() => services.matching.topMatches(12), 'matches')
  const notifications = useAsync(() => services.notifications.list(), 'notifications')

  const activeOrders = (orders.data ?? []).filter((o) => ACTIVE_ORDER.includes(o.status))
  const activeRequirements = (requirements.data ?? []).filter((r) => effectiveRequirementStatus(r) === 'active')
  // One recommended card per listing, best score first.
  const recommended = [...new Map((matches.data ?? []).map((m) => [m.listing.listing.id, m])).values()].slice(0, 3)

  return (
    <>
      <PageHeader
        eyebrow={isDemo ? <DemoBadge /> : undefined}
        title={`${greeting()}, ${user.fullName.split(' ')[0]}`}
        description="Here’s what’s happening with your sourcing on HeyCileng."
        actions={
          <>
            <ButtonLink to="/buyer/requirements?new=1" variant="outline" leftIcon={<Plus className="size-4" />}>
              New requirement
            </ButtonLink>
            <ButtonLink to="/buyer/marketplace" leftIcon={<Store className="size-4" />}>
              Browse marketplace
            </ButtonLink>
          </>
        }
      />

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active orders" value={orders.loading ? '—' : activeOrders.length} icon={<Package />} hint="Pending, accepted or on the way" />
        <StatCard label="Active requirements" value={requirements.loading ? '—' : activeRequirements.length} icon={<ClipboardList />} tone="accent" hint="Used for matchmaking" />
        <StatCard label="Recommended matches" value={matches.loading ? '—' : (matches.data?.length ?? 0)} icon={<Sparkles />} tone="info" hint="Advisory, across requirements" />
        <StatCard label="Saved listings" value={saved.saved.size} icon={<Heart />} tone="neutral" hint="Your shortlist" />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr] *:min-w-0">
        <Card>
          <CardHeader
            title="Active orders"
            description="Orders that are still in progress."
            action={
              <Link to="/buyer/orders" className="text-sm font-semibold text-action hover:underline">
                View all
              </Link>
            }
          />
          <CardBody className="p-0 sm:p-0">
            {orders.loading ? (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : orders.error ? (
              <ErrorState description={orders.error.message} onRetry={orders.reload} />
            ) : activeOrders.length === 0 ? (
              <EmptyState compact icon={<Package />} title="No active orders" description="Request an order from a listing to get started." />
            ) : (
              <ul className="divide-y divide-border">
                {activeOrders.slice(0, 5).map((order) => (
                  <li key={order.id}>
                    <Link to={`/buyer/orders/${order.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-muted sm:px-6">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-fg">{order.listing.name}</p>
                        <p className="truncate text-xs text-subtle">
                          {order.reference} · {formatQuantity(order.quantity, order.listing.unit)} · {order.listing.sellerBusinessName}
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
            title="Matching opportunities"
            description="Advisory scores — not guarantees."
            action={
              <Link to="/buyer/matches" className="text-sm font-semibold text-action hover:underline">
                All matches
              </Link>
            }
          />
          <CardBody className="p-0 sm:p-0">
            {matches.loading ? (
              <div className="space-y-3 p-5">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : matches.error ? (
              <ErrorState description={matches.error.message} onRetry={matches.reload} />
            ) : (matches.data ?? []).length === 0 ? (
              <EmptyState
                compact
                icon={<Sparkles />}
                title="No matches yet"
                description="Publish a requirement to get recommended listings."
                action={<ButtonLink to="/buyer/requirements?new=1" size="sm">New requirement</ButtonLink>}
              />
            ) : (
              <ul className="divide-y divide-border">
                {(matches.data ?? []).slice(0, 4).map((m) => (
                  <li key={`${m.requirement.id}-${m.listing.listing.id}`}>
                    <Link
                      to={`/buyer/matches?requirement=${m.requirement.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted sm:px-6"
                    >
                      <MatchScore score={m.match.score} type={m.match.type} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-fg">{m.listing.listing.name}</p>
                        <p className="truncate text-xs text-subtle">For “{m.requirement.title}”</p>
                      </div>
                      <MatchTypeBadge type={m.match.type} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <section className="mt-8" aria-labelledby="recommended-heading">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 id="recommended-heading" className="text-lg font-bold">
              Recommended listings
            </h2>
            <p className="text-sm text-muted">Top matches for your active requirements.</p>
          </div>
          <Link to="/buyer/marketplace" className="inline-flex items-center gap-1 text-sm font-semibold text-action hover:underline">
            Marketplace <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {matches.loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        ) : recommended.length === 0 ? (
          <Card>
            <EmptyState compact icon={<Store />} title="No recommendations yet" description="Recommendations appear once you have an active requirement." />
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((m) => (
              <ListingCard
                key={m.listing.listing.id}
                item={m.listing}
                to={`/buyer/marketplace/${m.listing.listing.id}`}
                saved={saved.isSaved(m.listing.listing.id)}
                onToggleSave={() => void saved.toggle(m.listing.listing.id)}
                footer={
                  <div className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2 text-xs">
                    <span className="text-muted">Match score</span>
                    <span className="font-semibold text-fg tabular-nums">{m.match.score} / 100</span>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr] *:min-w-0">
        <section aria-labelledby="recent-orders-heading">
          <h2 id="recent-orders-heading" className="mb-4 text-lg font-bold">
            Recent orders
          </h2>
          <OrdersTable
            orders={(orders.data ?? []).slice(0, 5)}
            basePath="/buyer/orders"
            loading={orders.loading}
            counterparty="seller"
            empty={<EmptyState compact icon={<Package />} title="No orders yet" />}
          />
        </section>
        <Card>
          <CardHeader title="Recent notifications" />
          <CardBody className="p-2 sm:p-2">
            {notifications.loading ? (
              <div className="space-y-2 p-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (notifications.data ?? []).length === 0 ? (
              <EmptyState compact icon={<Bell />} title="No notifications" />
            ) : (
              (notifications.data ?? []).slice(0, 4).map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  compact
                  onOpen={(item) => {
                    void services.notifications.markRead(item.id).then(announceNotificationsChanged)
                    if (item.href) navigate(item.href)
                  }}
                />
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </>
  )
}
