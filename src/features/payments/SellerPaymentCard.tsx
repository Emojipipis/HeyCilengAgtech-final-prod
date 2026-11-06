import { CircleCheckBig, Clock, CreditCard, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, formatDate } from '@/lib/format'
import { sellerPayout } from '@/lib/payments'
import { services } from '@/services'
import type { Order } from '@/types/order'

const PAYMENT_LABEL: Record<Order['payment']['status'], { label: string; tone: 'warning' | 'success' | 'neutral' }> = {
  unpaid: { label: 'Awaiting buyer payment', tone: 'warning' },
  paid: { label: 'Paid by buyer', tone: 'success' },
  refund_pending: { label: 'Refund to buyer pending', tone: 'neutral' },
  refunded: { label: 'Refunded to buyer', tone: 'neutral' },
}

/** Seller view of payment and payout. Buyers pay HeyCileng; HeyCileng pays the seller after completion. */
export function SellerPaymentCard({ order }: { order: Order }) {
  // Before payment the commission rate isn't fixed yet: show the current configured rate as an estimate.
  const config = useAsync(() => services.platformConfig.get(), 'platform-config')
  const payout = sellerPayout(order, config.data?.commissionRatePercent ?? 0)
  const { status, payoutStatus } = order.payment
  const closedUnpaid = status === 'unpaid' && ['declined', 'cancelled'].includes(order.status)
  const fixed = order.payment.commissionRate !== undefined

  return (
    <Card>
      <CardHeader title="Payment & payout" action={!closedUnpaid ? <Badge tone={PAYMENT_LABEL[status].tone}>{PAYMENT_LABEL[status].label}</Badge> : undefined} />
      <CardBody className="space-y-4 text-sm">
        {closedUnpaid ? (
          <p className="text-muted">This order closed before payment. No money was taken.</p>
        ) : (
          <>
            <dl className="space-y-1.5">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Order value</dt>
                <dd className="tabular-nums">{formatCurrency(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">HeyCileng commission ({payout.ratePercent}%)</dt>
                <dd className="tabular-nums">−{formatCurrency(payout.commission)}</dd>
              </div>
              {payout.sellerFee > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Delivery fee (paid by you)</dt>
                  <dd className="tabular-nums">−{formatCurrency(payout.sellerFee)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-border pt-1.5 font-semibold">
                <dt>{fixed ? 'Your payout' : 'Estimated payout'}</dt>
                <dd className="tabular-nums">{formatCurrency(payout.amount)}</dd>
              </div>
            </dl>

            {status === 'unpaid' && (
              <p className="flex gap-2 text-muted">
                <CreditCard className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden="true" />
                {order.status === 'pending'
                  ? 'Once you accept, the buyer pays HeyCileng through Paystack. Don’t release goods before HeyCileng confirms payment.'
                  : 'Waiting for the buyer to pay HeyCileng. You’ll be notified as soon as payment is confirmed — don’t release goods before then.'}
                {!fixed && ' The commission rate is fixed when the buyer pays.'}
              </p>
            )}
            {status === 'paid' && payoutStatus === 'not_due' && (
              <p className="flex gap-2 text-muted">
                <Clock className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden="true" />
                The buyer has paid. HeyCileng pays you by bank transfer after the order is completed.
              </p>
            )}
            {payoutStatus === 'due' && (
              <p className="flex gap-2 text-muted">
                <Clock className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden="true" />
                Order complete — your payout is being processed by HeyCileng.
              </p>
            )}
            {payoutStatus === 'paid' && (
              <p className="flex gap-2 text-muted">
                <CircleCheckBig className="mt-0.5 size-4 shrink-0 text-action" aria-hidden="true" />
                Payout sent{order.payment.payoutPaidAt ? ` on ${formatDate(order.payment.payoutPaidAt)}` : ''}
                {order.payment.payoutReference ? ` (reference ${order.payment.payoutReference})` : ''}.
              </p>
            )}
            {(status === 'refund_pending' || status === 'refunded') && (
              <p className="flex gap-2 text-muted">
                <RotateCcw className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden="true" />
                This order was cancelled after payment, so the buyer is refunded and no payout is due.
              </p>
            )}
          </>
        )}
      </CardBody>
    </Card>
  )
}
