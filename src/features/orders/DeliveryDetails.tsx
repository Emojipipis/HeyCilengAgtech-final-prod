import { CalendarDays, Hash, MapPin, Receipt, Truck, UserRound, Warehouse } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { getStatusMeta } from '@/config/statuses'
import type { FeePayer, Order } from '@/types/order'

const PAYER: Record<FeePayer, string> = { buyer: 'Buyer', seller: 'Seller', heycileng: 'HeyCileng' }

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5">
      <span className="mt-0.5 text-subtle [&>svg]:size-4">{icon}</span>
      <dt className="w-32 shrink-0 text-sm text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm font-medium text-fg">{children}</dd>
    </div>
  )
}

const pending = <span className="font-normal text-subtle">To be confirmed by HeyCileng</span>

/** Read-only logistics summary. Logistics are assigned and updated by HeyCileng administrators. */
/** `admin` sees everything, including the delivery address; `seller` never sees the buyer's address. */
export function DeliveryDetails({ order, audience = 'buyer', action }: { order: Order; audience?: 'buyer' | 'seller' | 'admin'; action?: ReactNode }) {
  if (order.fulfilment === 'collection') {
    const ready = order.status === 'ready_for_collection'
    return (
      <Card>
        <CardHeader title="Collection" description={audience === 'seller' ? 'The buyer collects this order from your site.' : audience === 'admin' ? 'The buyer collects this order from the seller’s site.' : 'You collect this order from the seller’s site.'}
          action={action} />
        <CardBody>
          <dl className="divide-y divide-border">
            <Row icon={<Warehouse />} label="Status">
              {ready ? <StatusBadge kind="delivery" status="ready_for_collection" /> : order.delivery ? <StatusBadge kind="delivery" status={order.delivery.status} /> : 'Not ready yet'}
            </Row>
            <Row icon={<MapPin />} label="Collection area">
              {order.listing.sellerLocation.area}
            </Row>
          </dl>
          <p className="mt-3 text-xs text-subtle">
            {ready
              ? 'HeyCileng will share the exact collection point and instructions. Bring your order reference.'
              : 'You’ll be notified when the order is ready for collection.'}
          </p>
        </CardBody>
      </Card>
    )
  }

  const delivery = order.delivery
  return (
    <Card>
      <CardHeader
        title="Delivery"
        description="Logistics are arranged and updated by HeyCileng."
        action={
          action ?? (delivery ? <StatusBadge kind="delivery" status={delivery.status} /> : undefined)
        }
      />
      <CardBody>
        {!delivery ? (
          <p className="text-sm text-muted">
            {order.status === 'declined' || order.status === 'cancelled'
              ? `No delivery is needed — this order was ${order.status}.`
              : 'Delivery is arranged after the seller accepts the order.'}
          </p>
        ) : (
          <>
            <dl className="divide-y divide-border">
              <Row icon={<Truck />} label="Logistics partner">
                {delivery.partnerName ?? pending}
              </Row>
              <Row icon={<Receipt />} label="Delivery fee">
                {delivery.fee !== undefined ? formatCurrency(delivery.fee) : pending}
              </Row>
              <Row icon={<UserRound />} label="Fee paid by">
                {delivery.feePayer ? PAYER[delivery.feePayer] : pending}
              </Row>
              <Row icon={<CalendarDays />} label="Estimated date">
                {delivery.estimatedDate ? formatDate(delivery.estimatedDate) : pending}
              </Row>
              <Row icon={<Hash />} label="Tracking ref.">
                {delivery.trackingReference ?? <span className="font-normal text-subtle">Not available yet</span>}
              </Row>
              <Row icon={<MapPin />} label="Deliver to">
                {audience === 'seller' ? (
                  <span className="font-normal text-subtle">Shared with the logistics partner only</span>
                ) : (
                  (order.deliveryAddress ?? '—')
                )}
              </Row>
            </dl>
            {delivery.history.length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <h4 className="font-sans text-sm font-semibold">Delivery history</h4>
                <ul className="mt-2 space-y-2">
                  {[...delivery.history].reverse().map((update) => (
                    <li key={update.at + update.status} className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                      <span className="text-fg">
                        {getStatusMeta('delivery', update.status).label}
                        {update.note && <span className="text-muted"> — {update.note}</span>}
                      </span>
                      <span className="text-xs text-subtle">{formatDateTime(update.at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  )
}
