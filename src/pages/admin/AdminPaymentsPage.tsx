import { CreditCard, Info, ReceiptText } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { DataTable, type Column } from '@/components/ui/Table'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { services } from '@/services'
import type { PaymentRecord } from '@/types/admin'

const STATUS_GUIDE: { status: PaymentRecord['status']; tone: 'warning' | 'success' | 'danger' | 'neutral'; meaning: string }[] = [
  { status: 'pending', tone: 'warning', meaning: 'Payment started with Paystack, not yet confirmed.' },
  { status: 'successful', tone: 'success', meaning: 'Paystack confirmed the payment (verified by webhook on the backend).' },
  { status: 'failed', tone: 'danger', meaning: 'The payment didn’t go through.' },
  { status: 'refunded', tone: 'neutral', meaning: 'Money returned to the payer.' },
]

const columns: Column<PaymentRecord>[] = [
  { key: 'order', header: 'Order', render: (p) => p.orderReference },
  { key: 'amount', header: 'Amount', align: 'right', render: (p) => formatCurrency(p.amount) },
  { key: 'ref', header: 'Paystack reference', render: (p) => p.providerReference },
  { key: 'status', header: 'Status', render: (p) => p.status },
  { key: 'date', header: 'Date', render: (p) => formatDateTime(p.createdAt) },
]

/** Payment records — the interface is ready; there is no payment processing until Paystack is integrated. */
export function AdminPaymentsPage() {
  const { data, loading, error } = useAsync(() => services.payments.listPayments(), 'payments')

  return (
    <>
      <PageHeader title="Payments" description="Payment records and transaction history for orders paid through the platform." />

      <Alert tone="warning" title="Payment processing isn’t active" className="mb-6">
        Paystack integration is planned for after the core platform is complete and tested. No payments are taken on HeyCileng today, so there are no
        payment or transaction records — none are shown or simulated here. Funds are not held in escrow.
      </Alert>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr] *:min-w-0">
        <section aria-labelledby="txn-heading">
          <h2 id="txn-heading" className="mb-3 flex items-center gap-2 text-lg font-bold">
            <ReceiptText className="size-5 text-action" aria-hidden="true" />
            Transaction history
          </h2>
          {loading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : error && error.code !== 'not_connected' ? (
            <ErrorState description={error.message} />
          ) : (
            <DataTable
              caption="Payment records"
              columns={columns}
              rows={data ?? []}
              rowKey={(p) => p.id}
              empty={<EmptyState compact icon={<CreditCard />} title="No payment records" description="Records will appear here once Paystack payments are live." />}
            />
          )}
        </section>

        <Card>
          <CardHeader title="Payment statuses" description="How records will be labelled once payments are live." />
          <CardBody>
            <ul className="space-y-3">
              {STATUS_GUIDE.map((s) => (
                <li key={s.status} className="flex gap-3 text-sm">
                  <Badge tone={s.tone} className="shrink-0 capitalize">
                    {s.status}
                  </Badge>
                  <span className="text-muted">{s.meaning}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex gap-2 text-xs text-subtle">
              <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              Payment status will be set only by the backend after verifying Paystack webhooks — never by the browser.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
