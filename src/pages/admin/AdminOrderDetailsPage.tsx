import { ArrowLeft, Ban, PackageSearch, Pencil, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Textarea } from '@/components/ui/Textarea'
import { CATEGORY_BY_ID } from '@/config/catalog'
import { stateName } from '@/config/locations'
import { getStatusMeta } from '@/config/statuses'
import { StockBar } from '@/features/listings/StockBar'
import { AssignDeliveryModal } from '@/features/logistics/AssignDeliveryModal'
import { UpdateDeliveryModal } from '@/features/logistics/UpdateDeliveryModal'
import { DeliveryDetails } from '@/features/orders/DeliveryDetails'
import { OrderTimeline } from '@/features/orders/OrderTimeline'
import { AdminPaymentCard } from '@/features/payments/AdminPaymentCard'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate, formatDateTime, formatQuantity, formatUnitPrice } from '@/lib/format'
import { nextAdminAction, NEXT_ACTION_LABEL } from '@/lib/logistics'
import { services, type ServiceError } from '@/services'
import type { Order } from '@/types/order'

type Dialog = 'assign' | 'update' | 'cancel' | null

export function AdminOrderDetailsPage() {
  const { orderId = '' } = useParams()
  const { toast } = useToast()
  const order = useAsync(() => services.adminOrders.get(orderId), orderId)
  // Partners and live stock refresh whenever the order changes.
  const partners = useAsync(() => services.logistics.listPartners(), 'partners')
  const stock = useAsync(
    () => (order.data ? services.marketplace.getListing(order.data.listingId) : Promise.resolve({ ok: true as const, data: undefined })),
    `${order.data?.listingId}|${order.data?.updatedAt}`,
  )
  const [dialog, setDialog] = useState<Dialog>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<ServiceError | null>(null)
  const [note, setNote] = useState('')

  const back = (
    <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
      <ArrowLeft className="size-4" aria-hidden="true" />
      All orders
    </Link>
  )

  if (order.loading && !order.data) return <LoadingState label="Loading order…" />
  if (order.error || !order.data) {
    return (
      <div className="space-y-6">
        {back}
        {order.error?.code === 'not_found' ? (
          <EmptyState icon={<PackageSearch />} title="Order not found" action={<ButtonLink to="/admin/orders">Back to orders</ButtonLink>} />
        ) : (
          <ErrorState description={order.error?.message} onRetry={order.reload} />
        )}
      </div>
    )
  }

  const o = order.data
  const next = nextAdminAction(o)
  const closed = ['completed', 'cancelled', 'declined'].includes(o.status)

  const open = (d: Dialog) => {
    setActionError(null)
    setNote('')
    setDialog(d)
  }

  /** Runs an admin action, refreshes the order and reports the result. */
  const apply = async (run: () => Promise<{ ok: true; data: Order } | { ok: false; error: ServiceError }>, success: string) => {
    setBusy(true)
    setActionError(null)
    const result = await run()
    setBusy(false)
    if (!result.ok) {
      setActionError(result.error)
      return { ok: false as const, error: result.error }
    }
    order.setData(result.data)
    toast({ tone: 'success', title: success, description: 'Buyer and seller have been notified.' })
    setDialog(null)
    return { ok: true as const }
  }

  const deliveryAction =
    o.fulfilment === 'delivery' && !closed && o.status !== 'pending' ? (
      o.delivery?.partnerId ? (
        <div className="flex gap-2">
          {o.status !== 'delivery_failed' && (
            <Button size="sm" variant="outline" leftIcon={<Pencil className="size-3.5" />} onClick={() => open('assign')}>
              Edit
            </Button>
          )}
          <Button size="sm" leftIcon={<Truck className="size-3.5" />} onClick={() => open('update')}>
            Update status
          </Button>
        </div>
      ) : (
        <Button size="sm" leftIcon={<Truck className="size-3.5" />} onClick={() => open('assign')}>
          Assign partner
        </Button>
      )
    ) : undefined

  return (
    <div className="space-y-6">
      {back}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind="order" status={o.status} size="md" />
            {o.delivery && <StatusBadge kind="delivery" status={o.delivery.status} size="md" />}
            {o.isDemo && <DemoBadge />}
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Order {o.reference}</h1>
          <p className="mt-1 text-sm text-muted">Requested {formatDateTime(o.createdAt)} · updated {formatDateTime(o.updatedAt)}</p>
        </div>
        {!closed && (
          <Button variant="outline" leftIcon={<Ban className="size-4" />} onClick={() => open('cancel')}>
            Cancel order
          </Button>
        )}
      </div>

      <Alert tone={next === 'resolve_failed' ? 'warning' : next === 'none' ? 'success' : 'info'} title={`Next step: ${NEXT_ACTION_LABEL[next]}`}>
        {getStatusMeta('order', o.status).description}
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] *:min-w-0">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Order summary" description="Visible to HeyCileng only in full — each party sees their own view." />
            <CardBody>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {[
                  ['Material', o.listing.name],
                  ['Category', CATEGORY_BY_ID[o.listing.category].name],
                  ['Seller', `${o.listing.sellerBusinessName} · ${o.listing.sellerLocation.area}, ${stateName(o.listing.sellerLocation.state)}`],
                  ['Buyer', o.buyerBusinessName],
                  ['Quantity', formatQuantity(o.quantity, o.listing.unit)],
                  ['Unit price', formatUnitPrice(o.listing.pricePerUnit, o.listing.unit)],
                  ['Fulfilment', 'Delivery by a HeyCileng logistics partner'],
                  ['Preferred date', o.preferredDate ? formatDate(o.preferredDate) : 'Not specified'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-subtle">{label}</dt>
                    <dd className="mt-0.5 text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              {o.buyerNote && (
                <div className="mt-4 rounded-lg bg-surface-muted p-3 text-sm">
                  <p className="text-xs font-semibold text-subtle">Buyer’s note for HeyCileng</p>
                  <p className="mt-1 text-muted">{o.buyerNote}</p>
                </div>
              )}
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm text-muted">Material value</span>
                <span className="font-display text-2xl font-bold tabular-nums">{formatCurrency(o.subtotal)}</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Order timeline" />
            <CardBody>
              <OrderTimeline events={o.timeline} />
            </CardBody>
          </Card>

          {o.partyNotes && o.partyNotes.length > 0 && (
            <Card>
              <CardHeader title="Notes from the buyer and seller" description="Visible to HeyCileng only — the other party sees “Reason shared with HeyCileng”." />
              <CardBody>
                <ul className="space-y-3">
                  {o.partyNotes.map((n) => (
                    <li key={n.at + n.title} className="rounded-lg bg-surface-muted p-3 text-sm">
                      <p className="text-xs font-semibold text-subtle">
                        {n.actor === 'buyer' ? 'Buyer' : 'Seller'} · {n.title} · {formatDateTime(n.at)}
                      </p>
                      <p className="mt-1 text-muted">{n.note}</p>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <DeliveryDetails order={o} audience="admin" action={deliveryAction} />

          <AdminPaymentCard order={o} onChanged={order.reload} />

          {stock.data && (
            <Card>
              <CardHeader title="Seller stock" description={stock.data.listing.name} />
              <CardBody>
                <StockBar listing={stock.data.listing} />
                <p className="mt-3 text-xs text-subtle">
                  {o.status === 'pending'
                    ? 'Pending: nothing is reserved for this order yet.'
                    : closed
                      ? o.status === 'completed'
                        ? 'Completed: this order’s quantity is counted as sold.'
                        : 'Closed: this order holds no stock.'
                      : `${formatQuantity(o.quantity, o.listing.unit)} is reserved for this order until it completes or is cancelled.`}
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {partners.data && (
        <AssignDeliveryModal
          open={dialog === 'assign'}
          order={o}
          partners={partners.data}
          onClose={() => setDialog(null)}
          onSubmit={(input) => apply(() => services.adminOrders.assignDelivery(o.id, input), o.delivery?.partnerId ? 'Logistics updated' : 'Logistics partner assigned')}
        />
      )}
      {o.delivery?.partnerId && (
        <UpdateDeliveryModal
          open={dialog === 'update'}
          order={o}
          onClose={() => setDialog(null)}
          onSubmit={(input) => apply(() => services.adminOrders.updateDelivery(o.id, input), `Delivery marked ${getStatusMeta('delivery', input.status).label.toLowerCase()}`)}
        />
      )}

      <ConfirmDialog
        open={dialog === 'cancel'}
        onClose={() => setDialog(null)}
        onConfirm={() => void apply(() => services.adminOrders.cancel(o.id, note), 'Order cancelled')}
        tone="danger"
        title={`Cancel order ${o.reference}?`}
        description={o.status === 'pending' ? 'The request is withdrawn. No stock is affected.' : `Any reserved stock (${formatQuantity(o.quantity, o.listing.unit)}) is released back to the seller’s listing.`}
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        loading={busy}
      >
        <Textarea label="Reason" required rows={2} value={note} onChange={(e) => setNote(e.target.value)} hint="Recorded in the timeline and shared with both parties." />
        {actionError && <Alert tone="error" className="mt-3">{actionError.message}</Alert>}
      </ConfirmDialog>
    </div>
  )
}
