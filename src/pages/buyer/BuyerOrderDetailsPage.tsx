import { ArrowLeft, CreditCard, Info, LifeBuoy, PackageSearch } from 'lucide-react'
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
import { getStatusMeta } from '@/config/statuses'
import { DeliveryDetails } from '@/features/orders/DeliveryDetails'
import { OrderTimeline } from '@/features/orders/OrderTimeline'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate, formatDateTime, formatQuantity, formatUnitPrice } from '@/lib/format'
import { services } from '@/services'

function BackLink() {
  return (
    <Link to="/buyer/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
      <ArrowLeft className="size-4" aria-hidden="true" />
      All orders
    </Link>
  )
}

export function BuyerOrderDetailsPage() {
  const { orderId = '' } = useParams()
  const { toast } = useToast()
  const { data: order, loading, error, reload, setData } = useAsync(() => services.orders.get(orderId), orderId)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  if (loading) return <LoadingState label="Loading order…" />
  if (error || !order) {
    return (
      <div className="space-y-6">
        <BackLink />
        {error?.code === 'not_found' ? (
          <EmptyState icon={<PackageSearch />} title="Order not found" action={<ButtonLink to="/buyer/orders">Back to orders</ButtonLink>} />
        ) : (
          <ErrorState description={error?.message} onRetry={reload} />
        )}
      </div>
    )
  }

  const meta = getStatusMeta('order', order.status)
  const cancellable = order.status === 'pending' || order.status === 'accepted'

  const cancel = async () => {
    setCancelling(true)
    const result = await services.orders.cancel(order.id, reason.trim())
    setCancelling(false)
    if (result.ok) {
      setData(result.data)
      setCancelOpen(false)
      toast({ tone: 'success', title: 'Order cancelled', description: `${order.reference} has been cancelled.` })
    } else {
      toast({ tone: 'error', title: 'Couldn’t cancel order', description: result.error.message })
    }
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind="order" status={order.status} size="md" />
            {order.isDemo && <DemoBadge />}
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Order {order.reference}</h1>
          <p className="mt-1 text-sm text-muted">Requested {formatDateTime(order.createdAt)}</p>
        </div>
        {cancellable && (
          <Button variant="outline" onClick={() => setCancelOpen(true)}>
            Cancel order
          </Button>
        )}
      </div>

      <Alert tone={['declined', 'cancelled', 'delivery_failed'].includes(order.status) ? 'warning' : 'info'} title={meta.label}>
        {meta.description}
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] *:min-w-0">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Order summary" />
            <CardBody>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {[
                  ['Material', order.listing.name],
                  ['Category', CATEGORY_BY_ID[order.listing.category].name],
                  ['Seller', order.listing.sellerBusinessName],
                  ['Seller area', order.listing.sellerLocation.area],
                  ['Quantity', formatQuantity(order.quantity, order.listing.unit)],
                  ['Unit price', formatUnitPrice(order.listing.pricePerUnit, order.listing.unit)],
                  ['Fulfilment', order.fulfilment === 'delivery' ? 'Delivery' : 'Collection'],
                  ['Preferred date', order.preferredDate ? formatDate(order.preferredDate) : 'Not specified'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-subtle">{label}</dt>
                    <dd className="mt-0.5 text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              {order.buyerNote && (
                <div className="mt-4 rounded-lg bg-surface-muted p-3 text-sm">
                  <p className="text-xs font-semibold text-subtle">Your note for HeyCileng</p>
                  <p className="mt-1 text-muted">{order.buyerNote}</p>
                </div>
              )}
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm text-muted">Material value</span>
                <span className="font-display text-2xl font-bold tabular-nums">{formatCurrency(order.subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-subtle">Excludes any delivery fee. Prices are as listed when you made the request.</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Order timeline" />
            <CardBody>
              <OrderTimeline events={order.timeline} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <DeliveryDetails order={order} />

          <Card>
            <CardHeader title="Payment" />
            <CardBody className="flex gap-3">
              <CreditCard className="mt-0.5 size-5 shrink-0 text-subtle" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-semibold">Online payment not available yet</p>
                <p className="mt-1 text-muted">
                  Paystack payments will be added in a future release. No payment has been taken for this order on HeyCileng.
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex gap-3">
              <LifeBuoy className="mt-0.5 size-5 shrink-0 text-action" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-semibold">Questions about this order?</p>
                <p className="mt-1 text-muted">HeyCileng support handles all order communication with the seller.</p>
                <ButtonLink to={`/buyer/support?new=1&order=${order.id}`} size="sm" variant="outline" className="mt-3">
                  Contact support
                </ButtonLink>
              </div>
            </CardBody>
          </Card>

          {order.status === 'pending' && (
            <p className="flex gap-2 text-xs text-subtle">
              <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              Pending requests don’t reserve stock. If the listing sells out before the seller responds, the request may be declined.
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => void cancel()}
        tone="danger"
        title={`Cancel order ${order.reference}?`}
        description={
          order.status === 'accepted'
            ? 'The seller has already accepted this order. Cancelling releases the reserved stock and notifies the seller through HeyCileng.'
            : 'The seller hasn’t responded yet. Cancelling withdraws your request.'
        }
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        loading={cancelling}
      >
        <Textarea label="Reason (optional)" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} hint="Shared with HeyCileng only." />
      </ConfirmDialog>
    </div>
  )
}
