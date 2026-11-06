import { CircleCheckBig, CreditCard, LoaderCircle, RotateCcw, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { amountDue, awaitingDeliveryFee, buyerDeliveryFee, isPayable } from '@/lib/payments'
import { services, type ServiceError } from '@/services'
import type { Order } from '@/types/order'

type ReturnState = { kind: 'idle' } | { kind: 'checking' } | { kind: 'paid' } | { kind: 'pending' } | { kind: 'failed' } | { kind: 'cancelled' } | { kind: 'error'; message: string }

/**
 * Buyer payment: shows what's owed and sends the buyer to Paystack's checkout. Payment status changes only
 * after the backend has verified the transaction with Paystack — never from the redirect alone.
 */
export function BuyerPaymentCard({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const [params, setParams] = useSearchParams()
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<ServiceError | null>(null)
  // Arriving back from Paystack: ?payment=return&reference=…(&cancelled=1). Read once on mount.
  const [returnInfo] = useState(() => ({
    reference: params.get('payment') === 'return' ? params.get('reference') : null,
    cancelled: params.get('cancelled') === '1',
  }))
  const [returned, setReturned] = useState<ReturnState>(() =>
    !returnInfo.reference ? { kind: 'idle' } : returnInfo.cancelled ? { kind: 'cancelled' } : { kind: 'checking' },
  )
  const verified = useRef(false)

  // Confirm with the backend (the redirect alone proves nothing), then clean the URL.
  useEffect(() => {
    const { reference, cancelled } = returnInfo
    if (!reference || verified.current) return
    verified.current = true
    const next = new URLSearchParams(params)
    ;['payment', 'reference', 'cancelled', 'trxref'].forEach((k) => next.delete(k))
    setParams(next, { replace: true })
    if (cancelled) return
    void services.payments.verifyPayment(reference).then((r) => {
      if (!r.ok) return setReturned({ kind: 'error', message: r.error.message })
      setReturned({ kind: r.data.status === 'paid' ? 'paid' : r.data.status === 'failed' ? 'failed' : 'pending' })
      onChanged()
    })
  }, [returnInfo, params, setParams, onChanged])

  const pay = async () => {
    setStarting(true)
    setStartError(null)
    const r = await services.payments.startCheckout(order.id)
    if (r.ok) {
      window.location.assign(r.data.authorizationUrl)
      return
    }
    setStarting(false)
    setStartError(r.error)
  }

  const fee = buyerDeliveryFee(order)
  const total = amountDue(order)
  const { status } = order.payment

  return (
    <Card>
      <CardHeader title="Payment" />
      <CardBody className="space-y-4 text-sm">
        {returned.kind === 'checking' && (
          <p className="flex items-center gap-2 text-muted" role="status">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Confirming your payment with Paystack…
          </p>
        )}
        {returned.kind === 'paid' && status === 'paid' && (
          <Alert tone="success" title="Payment confirmed">
            Thank you. HeyCileng will now arrange the next steps.
          </Alert>
        )}
        {returned.kind === 'pending' && (
          <Alert tone="info" title="Payment not confirmed yet">
            Paystack hasn’t confirmed this payment yet. If you completed it, this page will update shortly — you’ll also get a notification.
          </Alert>
        )}
        {returned.kind === 'failed' && (
          <Alert tone="error" title="Payment didn’t go through">
            No money was taken for this attempt. You can try again.
          </Alert>
        )}
        {returned.kind === 'cancelled' && <Alert tone="info" title="Payment cancelled">You left the Paystack checkout. You can pay whenever you’re ready.</Alert>}
        {returned.kind === 'error' && <Alert tone="error">{returned.message}</Alert>}

        <dl className="space-y-1.5">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Goods</dt>
            <dd className="tabular-nums">{formatCurrency(order.subtotal)}</dd>
          </div>
          {order.fulfilment === 'delivery' && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Delivery fee</dt>
              <dd className="tabular-nums">
                {order.delivery?.fee === undefined ? 'To be confirmed' : fee > 0 ? formatCurrency(fee) : 'Not charged to you'}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-t border-border pt-1.5 font-semibold">
            <dt>{status === 'paid' ? 'Paid' : 'Total to pay'}</dt>
            <dd className="tabular-nums">{formatCurrency(order.payment.amountPaid ?? total)}</dd>
          </div>
        </dl>

        {status === 'paid' && (
          <p className="flex gap-2 text-muted">
            <CircleCheckBig className="mt-0.5 size-4 shrink-0 text-action" aria-hidden="true" />
            Paid to HeyCileng through Paystack{order.payment.paidAt ? ` on ${formatDateTime(order.payment.paidAt)}` : ''}.
          </p>
        )}
        {status === 'refund_pending' && (
          <p className="flex gap-2 text-muted">
            <RotateCcw className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden="true" />
            This order was cancelled after payment. HeyCileng will refund you and notify you when it’s done.
          </p>
        )}
        {status === 'refunded' && (
          <p className="flex gap-2 text-muted">
            <RotateCcw className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden="true" />
            Your payment has been refunded.
          </p>
        )}

        {status === 'unpaid' && order.status === 'pending' && (
          <p className="flex gap-2 text-muted">
            <CreditCard className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden="true" />
            You’ll be able to pay once the seller accepts your request.
          </p>
        )}
        {awaitingDeliveryFee(order) && (
          <p className="flex gap-2 text-muted">
            <CreditCard className="mt-0.5 size-4 shrink-0 text-subtle" aria-hidden="true" />
            The seller has accepted. HeyCileng is arranging delivery and will confirm the delivery fee before you pay.
          </p>
        )}

        {isPayable(order) && (
          <div className="space-y-3">
            {startError && <Alert tone={startError.code === 'not_connected' ? 'warning' : 'error'}>{startError.message}</Alert>}
            <Button fullWidth size="lg" loading={starting} leftIcon={<CreditCard className="size-4" />} onClick={() => void pay()}>
              {starting ? 'Opening Paystack…' : `Pay ${formatCurrency(total)} with Paystack`}
            </Button>
            <p className="flex gap-2 text-xs text-subtle">
              <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              You’ll complete payment on Paystack’s secure page. HeyCileng arranges dispatch or collection after payment is confirmed and pays the seller once the order is complete.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
