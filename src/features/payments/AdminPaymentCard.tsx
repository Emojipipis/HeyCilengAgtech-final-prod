import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { amountDue, awaitingDeliveryFee, isPayable, sellerPayout } from '@/lib/payments'
import { services } from '@/services'
import type { Order } from '@/types/order'

const STATUS: Record<Order['payment']['status'], { label: string; tone: 'warning' | 'success' | 'danger' | 'neutral' }> = {
  unpaid: { label: 'Unpaid', tone: 'warning' },
  paid: { label: 'Paid', tone: 'success' },
  refund_pending: { label: 'Refund pending', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },
}

/**
 * Admin payment panel. Payments are confirmed by Paystack (backend only). Payouts and refunds are made
 * outside the app — in the bank or the Paystack dashboard — and recorded here with their reference.
 */
export function AdminPaymentCard({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const { toast } = useToast()
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { status, payoutStatus } = order.payment
  const payout = sellerPayout(order)
  const action: 'payout' | 'refund' | null = payoutStatus === 'due' ? 'payout' : status === 'refund_pending' ? 'refund' : null

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!action) return
    if (!value.trim()) return setError(action === 'payout' ? 'Enter the bank transfer reference.' : 'Enter the Paystack refund reference or a note.')
    setSaving(true)
    setError(null)
    const r = action === 'payout' ? await services.payments.markPayoutPaid(order.id, value.trim()) : await services.payments.markRefunded(order.id, value.trim())
    setSaving(false)
    if (!r.ok) return setError(r.error.message)
    setValue('')
    toast({ tone: 'success', title: action === 'payout' ? 'Payout recorded' : 'Refund recorded', description: 'The other party has been notified.' })
    onChanged()
  }

  return (
    <Card>
      <CardHeader title="Payment" action={<Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>} />
      <CardBody className="space-y-4 text-sm">
        <dl className="space-y-1.5">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{status === 'unpaid' ? 'Buyer owes' : 'Buyer paid'}</dt>
            <dd className="font-semibold tabular-nums">{formatCurrency(order.payment.amountPaid ?? amountDue(order))}</dd>
          </div>
          {order.payment.paidAt && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Paid at</dt>
              <dd>{formatDateTime(order.payment.paidAt)}</dd>
            </div>
          )}
          {status !== 'unpaid' && (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Commission ({payout.ratePercent}%)</dt>
                <dd className="tabular-nums">{formatCurrency(payout.commission)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Seller payout</dt>
                <dd className="tabular-nums">
                  {formatCurrency(payout.amount)}{' '}
                  <span className="text-xs text-subtle">
                    ({payoutStatus === 'paid' ? `paid · ${order.payment.payoutReference}` : payoutStatus === 'due' ? 'due now' : 'due on completion'})
                  </span>
                </dd>
              </div>
            </>
          )}
        </dl>

        {status === 'unpaid' && (isPayable(order) || awaitingDeliveryFee(order)) && (
          <p className="text-muted">
            {awaitingDeliveryFee(order)
              ? 'Assign a logistics partner and delivery fee — the buyer can pay once the fee is set.'
              : 'Waiting for the buyer to pay. Dispatch and collection are blocked until Paystack confirms payment.'}
          </p>
        )}

        {action && (
          <form onSubmit={submit} noValidate className="space-y-3 border-t border-border pt-4">
            <Alert tone={action === 'refund' ? 'warning' : 'info'}>
              {action === 'payout'
                ? `Transfer ${formatCurrency(payout.amount)} to the seller from HeyCileng’s bank account, then record the transfer reference here.`
                : `Refund ${formatCurrency(order.payment.amountPaid ?? 0)} to the buyer in the Paystack dashboard (Transactions → Refund), then record it here.`}
            </Alert>
            <Input
              label={action === 'payout' ? 'Bank transfer reference' : 'Paystack refund reference or note'}
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError(null)
              }}
              error={error ?? undefined}
            />
            <Button type="submit" size="sm" loading={saving}>
              {action === 'payout' ? 'Mark payout as paid' : 'Mark as refunded'}
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  )
}
