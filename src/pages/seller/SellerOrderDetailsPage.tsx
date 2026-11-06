import { ArrowLeft, LifeBuoy, Lock, PackageSearch } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { Select } from '@/components/ui/Select'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Textarea } from '@/components/ui/Textarea'
import { CATEGORY_BY_ID } from '@/config/catalog'
import { getStatusMeta } from '@/config/statuses'
import { StockBar } from '@/features/listings/StockBar'
import { DeliveryDetails } from '@/features/orders/DeliveryDetails'
import { OrderTimeline } from '@/features/orders/OrderTimeline'
import { SellerPaymentCard } from '@/features/payments/SellerPaymentCard'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate, formatDateTime, formatQuantity, formatUnitPrice } from '@/lib/format'
import { availableQuantity } from '@/lib/inventory'
import { services, type ServiceError } from '@/services'

const DECLINE_REASONS = [
  { value: 'insufficient_stock', label: 'Not enough stock' },
  { value: 'quality', label: 'Can’t meet the quality requested' },
  { value: 'timing', label: 'Can’t meet the timing' },
  { value: 'distance', label: 'Location or distance not workable' },
  { value: 'other', label: 'Other reason' },
]

type Action = 'accept' | 'decline' | 'process' | null

export function SellerOrderDetailsPage() {
  const { orderId = '' } = useParams()
  const { toast } = useToast()
  const order = useAsync(() => services.sellerOrders.get(orderId), orderId)
  const listing = useAsync(
    () => (order.data ? services.sellerListings.get(order.data.listingId) : Promise.resolve({ ok: true as const, data: undefined })),
    `${order.data?.listingId ?? ''}|${order.data?.status ?? ''}`,
  )
  const [action, setAction] = useState<Action>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<ServiceError | null>(null)
  const [reason, setReason] = useState('insufficient_stock')
  const [details, setDetails] = useState('')

  const back = (
    <Link to="/seller/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
      <ArrowLeft className="size-4" aria-hidden="true" />
      Incoming orders
    </Link>
  )

  if (order.loading && !order.data) return <LoadingState label="Loading order…" />
  if (order.error || !order.data) {
    return (
      <div className="space-y-6">
        {back}
        {order.error?.code === 'not_found' ? (
          <EmptyState icon={<PackageSearch />} title="Order not found" action={<ButtonLink to="/seller/orders">Back to orders</ButtonLink>} />
        ) : (
          <ErrorState description={order.error?.message} onRetry={order.reload} />
        )}
      </div>
    )
  }

  const o = order.data
  const meta = getStatusMeta('order', o.status)
  const stock = listing.data
  const available = stock ? availableQuantity(stock) : undefined
  const enoughStock = available === undefined || available >= o.quantity

  const open = (next: Action) => {
    setActionError(null)
    setAction(next)
  }

  const run = async () => {
    setBusy(true)
    setActionError(null)
    const reasonLabel = DECLINE_REASONS.find((r) => r.value === reason)?.label ?? ''
    const result =
      action === 'accept'
        ? await services.sellerOrders.accept(o.id)
        : action === 'decline'
          ? await services.sellerOrders.decline(o.id, [reasonLabel, details.trim()].filter(Boolean).join(' — '))
          : await services.sellerOrders.startProcessing(o.id)
    setBusy(false)
    if (!result.ok) {
      setActionError(result.error)
      return
    }
    order.setData(result.data)
    listing.reload()
    toast({
      tone: 'success',
      title: action === 'accept' ? 'Order accepted' : action === 'decline' ? 'Order declined' : 'Marked as processing',
      description: action === 'accept' ? `${formatQuantity(o.quantity, o.listing.unit)} reserved. HeyCileng will arrange logistics.` : 'The buyer has been notified by HeyCileng.',
    })
    setAction(null)
  }

  return (
    <div className="space-y-6">
      {back}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind="order" status={o.status} size="md" />
            {o.isDemo && <DemoBadge />}
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Order {o.reference}</h1>
          <p className="mt-1 text-sm text-muted">
            From {o.buyerBusinessName} · requested {formatDateTime(o.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {o.status === 'pending' && (
            <>
              <Button variant="outline" onClick={() => open('decline')}>
                Decline
              </Button>
              <Button onClick={() => open('accept')}>Accept order</Button>
            </>
          )}
          {o.status === 'accepted' && <Button onClick={() => open('process')}>Start processing</Button>}
        </div>
      </div>

      <Alert tone={['declined', 'cancelled', 'delivery_failed'].includes(o.status) ? 'warning' : 'info'} title={meta.label}>
        {o.status === 'pending'
          ? 'This request hasn’t reserved any stock. Accepting reserves the quantity; declining leaves your stock unchanged.'
          : ['processing', 'dispatched', 'ready_for_collection'].includes(o.status)
            ? `${meta.description} Dispatch, delivery and collection updates are managed by HeyCileng.`
            : meta.description}
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] *:min-w-0">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Order summary" />
            <CardBody>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {[
                  ['Listing', o.listing.name],
                  ['Category', CATEGORY_BY_ID[o.listing.category].name],
                  ['Buyer', o.buyerBusinessName],
                  ['Quantity', formatQuantity(o.quantity, o.listing.unit)],
                  ['Unit price', formatUnitPrice(o.listing.pricePerUnit, o.listing.unit)],
                  ['Fulfilment', o.fulfilment === 'delivery' ? 'Delivery (HeyCileng logistics)' : 'Buyer collects'],
                  ['Preferred date', o.preferredDate ? formatDate(o.preferredDate) : 'Not specified'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-subtle">{label}</dt>
                    <dd className="mt-0.5 text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm text-muted">Order value</span>
                <span className="font-display text-2xl font-bold tabular-nums">{formatCurrency(o.subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-subtle">HeyCileng’s commission is deducted from completed orders. Commission details are confirmed by HeyCileng.</p>
              <p className="mt-4 flex gap-2 rounded-lg bg-surface-muted p-3 text-xs text-muted">
                <Lock className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                Buyer contact details and delivery addresses are private. HeyCileng coordinates everything with the buyer and logistics partner.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Order timeline" />
            <CardBody>
              <OrderTimeline events={o.timeline} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          {stock && (
            <Card>
              <CardHeader title="Listing stock" description={stock.name} />
              <CardBody>
                <StockBar listing={stock} />
                {o.status === 'pending' && !enoughStock && available !== undefined && (
                  <Alert tone="warning" className="mt-4">
                    Only {formatQuantity(available, stock.unit)} is available — not enough to accept this order. Update your listing or decline.
                  </Alert>
                )}
              </CardBody>
            </Card>
          )}

          <DeliveryDetails order={o} audience="seller" />

          <SellerPaymentCard order={o} />

          <Card>
            <CardBody className="flex gap-3">
              <LifeBuoy className="mt-0.5 size-5 shrink-0 text-action" aria-hidden="true" />
              <div className="text-sm">
                <p className="text-muted">
                  <span className="font-semibold text-fg">Need help?</span> Questions about this order go to HeyCileng support.
                </p>
                <ButtonLink to={`/seller/support?new=1&order=${o.id}`} size="sm" variant="outline" className="mt-3">
                  Contact support
                </ButtonLink>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={action === 'accept'}
        onClose={() => setAction(null)}
        onConfirm={() => void run()}
        title={`Accept order ${o.reference}?`}
        description={`${formatQuantity(o.quantity, o.listing.unit)} will be reserved for this buyer${available !== undefined ? ` (you have ${formatQuantity(available, o.listing.unit)} available)` : ''}. HeyCileng will then arrange ${o.fulfilment === 'delivery' ? 'delivery' : 'collection'}.`}
        confirmLabel="Accept and reserve stock"
        loading={busy}
      >
        {actionError && <Alert tone="error">{actionError.message}</Alert>}
      </ConfirmDialog>

      <ConfirmDialog
        open={action === 'decline'}
        onClose={() => setAction(null)}
        onConfirm={() => void run()}
        tone="danger"
        title={`Decline order ${o.reference}?`}
        description="The buyer will be notified by HeyCileng. Your stock isn’t affected."
        confirmLabel="Decline order"
        loading={busy}
      >
        <div className="space-y-3">
          <Select label="Reason" options={DECLINE_REASONS} value={reason} onChange={(e) => setReason(e.target.value)} />
          <Textarea label="Details (optional)" rows={2} value={details} onChange={(e) => setDetails(e.target.value)} hint="Shared with HeyCileng only. The buyer is told the order was declined, not your details." />
          {actionError && <Alert tone="error">{actionError.message}</Alert>}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={action === 'process'}
        onClose={() => setAction(null)}
        onConfirm={() => void run()}
        title="Start processing this order?"
        description="Let HeyCileng and the buyer know you’re preparing the order."
        confirmLabel="Start processing"
        loading={busy}
      >
        {actionError && <Alert tone="error">{actionError.message}</Alert>}
      </ConfirmDialog>
    </div>
  )
}
