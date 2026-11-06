import { Clock, CreditCard, ReceiptText, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody } from '@/components/ui/Card'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { DataTable, type Column } from '@/components/ui/Table'
import { CheckoutButton } from '@/features/payments/CheckoutButton'
import { useAsync } from '@/hooks/useAsync'
import { useViewer } from '@/hooks/useSession'
import { formatCurrency, formatDateTime, formatQuantity } from '@/lib/format'
import { amountDue, awaitingDeliveryFee, buyerDeliveryFee, isPayable } from '@/lib/payments'
import { services } from '@/services'
import type { Order } from '@/types/order'

const HISTORY_STATUS: Record<Exclude<Order['payment']['status'], 'unpaid'>, { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  paid: { label: 'Paid', tone: 'success' },
  refund_pending: { label: 'Refund pending', tone: 'warning' },
  refunded: { label: 'Refunded', tone: 'neutral' },
}

const orderLink = (o: Order) => (
  <Link to={`/buyer/orders/${o.id}`} className="font-semibold text-action hover:underline">
    {o.reference}
  </Link>
)

const historyColumns: Column<Order>[] = [
  { key: 'order', header: 'Order', render: orderLink },
  { key: 'material', header: 'Material', hideOnMobile: true, render: (o) => <span className="text-muted">{o.listing.name}</span> },
  { key: 'amount', header: 'Amount', align: 'right', render: (o) => <span className="font-semibold tabular-nums">{formatCurrency(o.payment.amountPaid ?? amountDue(o))}</span> },
  { key: 'date', header: 'Paid', hideOnMobile: true, render: (o) => <span className="text-xs">{o.payment.paidAt ? formatDateTime(o.payment.paidAt) : '—'}</span> },
  {
    key: 'status',
    header: 'Status',
    render: (o) => {
      const s = HISTORY_STATUS[o.payment.status as keyof typeof HISTORY_STATUS]
      return <Badge tone={s.tone}>{s.label}</Badge>
    },
  },
]

/** One payable order: what's owed and the Paystack checkout button. */
function ReadyToPay({ order }: { order: Order }) {
  const fee = buyerDeliveryFee(order)
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-fg">{orderLink(order)}</p>
            <p className="truncate text-sm text-muted">
              {order.listing.name} · {formatQuantity(order.quantity, order.listing.unit)}
            </p>
          </div>
          <Badge tone="warning">Payment due</Badge>
        </div>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Goods</dt>
            <dd className="tabular-nums">{formatCurrency(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Delivery by HeyCileng</dt>
            <dd className="tabular-nums">{fee > 0 ? formatCurrency(fee) : 'Not charged to you'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-1.5 font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatCurrency(amountDue(order))}</dd>
          </div>
        </dl>
        <CheckoutButton order={order} />
      </CardBody>
    </Card>
  )
}

/** Buyer checkout hub: orders ready to pay, orders waiting for a delivery fee, and payment history. */
export function BuyerPaymentsPage() {
  const { isDemo } = useViewer()
  const { data, loading, error, reload } = useAsync(() => services.orders.listMine(), 'orders')

  if (loading && !data) return <Skeleton className="h-96 w-full rounded-xl" />
  if (error || !data) return <ErrorState description={error?.message} onRetry={reload} />

  const ready = data.filter(isPayable)
  const waitingForFee = data.filter(awaitingDeliveryFee)
  const waitingForSeller = data.filter((o) => o.status === 'pending')
  const history = data.filter((o) => o.payment.status !== 'unpaid')
  const dueTotal = ready.reduce((sum, o) => sum + amountDue(o), 0)

  return (
    <>
      <PageHeader
        eyebrow={isDemo ? <DemoBadge label="Demo orders — payments aren’t processed in demo mode" /> : undefined}
        title="Payments"
        description="Pay for your orders through Paystack and see what you’ve paid. You can pay once the seller accepts and HeyCileng confirms the delivery fee."
      />

      <section aria-labelledby="ready-heading" className="mb-8">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="ready-heading" className="flex items-center gap-2 text-lg font-bold">
            <CreditCard className="size-5 text-action" aria-hidden="true" />
            Ready to pay
          </h2>
          {ready.length > 1 && <p className="text-sm text-muted">Total due: <span className="font-semibold text-fg tabular-nums">{formatCurrency(dueTotal)}</span></p>}
        </div>
        {ready.length === 0 ? (
          <EmptyState
            compact
            icon={<CreditCard />}
            title="Nothing to pay right now"
            description="When a seller accepts your order and HeyCileng confirms the delivery fee, it appears here with a Pay button."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 *:min-w-0">
            {ready.map((o) => (
              <ReadyToPay key={o.id} order={o} />
            ))}
          </div>
        )}
        <p className="mt-3 flex gap-2 text-xs text-subtle">
          <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          You pay HeyCileng on Paystack’s secure page. HeyCileng’s logistics partner delivers once payment is confirmed, and HeyCileng pays the seller after delivery.
        </p>
      </section>

      {(waitingForFee.length > 0 || waitingForSeller.length > 0) && (
        <section aria-labelledby="soon-heading" className="mb-8">
          <h2 id="soon-heading" className="mb-3 flex items-center gap-2 text-lg font-bold">
            <Clock className="size-5 text-subtle" aria-hidden="true" />
            Not ready to pay yet
          </h2>
          <Card>
            <CardBody className="p-0 sm:p-0">
              <ul className="divide-y divide-border">
                {[...waitingForFee, ...waitingForSeller].map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                    <span className="min-w-0">
                      {orderLink(o)} <span className="text-muted">· {o.listing.name}</span>
                    </span>
                    <span className="text-xs text-subtle">
                      {o.status === 'pending' ? 'Waiting for the seller to accept' : 'Waiting for HeyCileng to confirm the delivery fee'}
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </section>
      )}

      <section aria-labelledby="history-heading">
        <h2 id="history-heading" className="mb-3 flex items-center gap-2 text-lg font-bold">
          <ReceiptText className="size-5 text-subtle" aria-hidden="true" />
          Payment history
        </h2>
        <DataTable
          caption="Payment history"
          columns={historyColumns}
          rows={history}
          rowKey={(o) => o.id}
          empty={<EmptyState compact icon={<ReceiptText />} title="No payments yet" />}
        />
      </section>
    </>
  )
}
