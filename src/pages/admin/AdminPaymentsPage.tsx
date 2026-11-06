import { Banknote, CreditCard, ReceiptText, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { DataTable, type Column } from '@/components/ui/Table'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { sellerPayout } from '@/lib/payments'
import { services } from '@/services'
import type { PaymentRecord } from '@/types/admin'
import type { Order } from '@/types/order'

const STATUS: Record<PaymentRecord['status'], { label: string; tone: 'warning' | 'success' | 'danger' }> = {
  initialized: { label: 'Started', tone: 'warning' },
  successful: { label: 'Successful', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
}

const orderLink = (id: string, reference: string) => (
  <Link to={`/admin/orders/${id}`} className="font-semibold text-action hover:underline">
    {reference}
  </Link>
)

const paymentColumns: Column<PaymentRecord>[] = [
  { key: 'order', header: 'Order', render: (p) => orderLink(p.orderId, p.orderReference) },
  { key: 'buyer', header: 'Buyer', hideOnMobile: true, render: (p) => <span className="text-xs text-muted">{p.buyerName}</span> },
  { key: 'amount', header: 'Amount', align: 'right', render: (p) => <span className="tabular-nums">{formatCurrency(p.amount)}</span> },
  {
    key: 'status',
    header: 'Status',
    render: (p) => (
      <div>
        <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
        {p.note && <p className="mt-1 max-w-56 text-xs text-red-600 dark:text-red-400">{p.note}</p>}
      </div>
    ),
  },
  { key: 'ref', header: 'Reference', hideOnMobile: true, render: (p) => <span className="font-mono text-xs">{p.reference}</span> },
  { key: 'date', header: 'Date', hideOnMobile: true, render: (p) => <span className="text-xs">{formatDateTime(p.paidAt ?? p.createdAt)}</span> },
]

const payoutColumns: Column<Order>[] = [
  { key: 'order', header: 'Order', render: (o) => orderLink(o.id, o.reference) },
  { key: 'seller', header: 'Seller', render: (o) => <span className="text-xs text-muted">{o.listing.sellerBusinessName}</span> },
  { key: 'amount', header: 'Payout', align: 'right', render: (o) => <span className="font-semibold tabular-nums">{formatCurrency(sellerPayout(o).amount)}</span> },
]

const refundColumns: Column<Order>[] = [
  { key: 'order', header: 'Order', render: (o) => orderLink(o.id, o.reference) },
  { key: 'buyer', header: 'Buyer', render: (o) => <span className="text-xs text-muted">{o.buyerBusinessName}</span> },
  { key: 'amount', header: 'Refund', align: 'right', render: (o) => <span className="font-semibold tabular-nums">{formatCurrency(o.payment.amountPaid ?? 0)}</span> },
]

/** Paystack transactions (written only by the backend), plus payouts and refunds HeyCileng still has to make. */
export function AdminPaymentsPage() {
  const payments = useAsync(() => services.payments.listPayments(), 'payments')
  const orders = useAsync(() => services.adminOrders.listAll(), 'admin-orders-payments')

  if ((payments.loading && !payments.data) || (orders.loading && !orders.data)) return <Skeleton className="h-96 w-full rounded-xl" />
  if (payments.error?.code === 'not_connected') {
    return (
      <>
        <PageHeader title="Payments" description="Paystack transactions, seller payouts and refunds." />
        <Alert tone="warning" title="Payments aren’t available in this mode">
          Payments are processed only by the live backend. No payment records are simulated.
        </Alert>
      </>
    )
  }
  if (payments.error || orders.error) {
    return <ErrorState description={(payments.error ?? orders.error)?.message} onRetry={() => (payments.reload(), orders.reload())} />
  }

  const records = payments.data ?? []
  const all = orders.data ?? []
  const payoutsDue = all.filter((o) => o.payment.payoutStatus === 'due')
  const refundsDue = all.filter((o) => o.payment.status === 'refund_pending')
  const received = records.filter((p) => p.status === 'successful').reduce((sum, p) => sum + p.amount, 0)

  return (
    <>
      <PageHeader title="Payments" description="Paystack transactions, seller payouts and refunds. Payment status is set only after Paystack confirms a transaction." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Received through Paystack" value={formatCurrency(received)} icon={<CreditCard />} />
        <StatCard label="Seller payouts due" value={formatCurrency(payoutsDue.reduce((sum, o) => sum + sellerPayout(o).amount, 0))} icon={<Banknote />} />
        <StatCard label="Refunds owed" value={formatCurrency(refundsDue.reduce((sum, o) => sum + (o.payment.amountPaid ?? 0), 0))} icon={<RotateCcw />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr] *:min-w-0">
        <section aria-labelledby="txn-heading">
          <h2 id="txn-heading" className="mb-3 flex items-center gap-2 text-lg font-bold">
            <ReceiptText className="size-5 text-action" aria-hidden="true" />
            Transactions
          </h2>
          <DataTable
            caption="Paystack transactions"
            columns={paymentColumns}
            rows={records}
            rowKey={(p) => p.id}
            empty={<EmptyState compact icon={<CreditCard />} title="No transactions yet" description="Buyer payments will appear here once they start checkout." />}
          />
        </section>

        <div className="space-y-6">
          <section aria-labelledby="payouts-heading">
            <h2 id="payouts-heading" className="mb-1 text-lg font-bold">
              Payouts due
            </h2>
            <p className="mb-3 text-sm text-muted">Completed, paid orders. Transfer the payout, then record it on the order.</p>
            <DataTable
              caption="Seller payouts due"
              columns={payoutColumns}
              rows={payoutsDue}
              rowKey={(o) => o.id}
              empty={<EmptyState compact icon={<Banknote />} title="No payouts due" />}
            />
          </section>
          <section aria-labelledby="refunds-heading">
            <h2 id="refunds-heading" className="mb-1 text-lg font-bold">
              Refunds owed
            </h2>
            <p className="mb-3 text-sm text-muted">Paid orders that were cancelled. Refund in Paystack, then record it on the order.</p>
            <DataTable
              caption="Refunds owed"
              columns={refundColumns}
              rows={refundsDue}
              rowKey={(o) => o.id}
              empty={<EmptyState compact icon={<RotateCcw />} title="No refunds owed" />}
            />
          </section>
        </div>
      </div>
    </>
  )
}
