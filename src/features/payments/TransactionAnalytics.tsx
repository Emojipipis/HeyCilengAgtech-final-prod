import { CircleCheckBig, CircleX, Clock, CreditCard } from 'lucide-react'
import { EmptyState } from '@/components/ui/States'
import { Donut, type Slice } from '@/features/admin/charts'
import { formatCurrency } from '@/lib/format'
import type { PaymentRecord } from '@/types/admin'

const CHANNEL_LABEL: Record<string, string> = {
  card: 'Card',
  bank: 'Bank account',
  bank_transfer: 'Bank transfer',
  ussd: 'USSD',
  mobile_money: 'Mobile money',
  qr: 'QR',
  apple_pay: 'Apple Pay',
  eft: 'EFT',
}

// Keeps large totals inside the donut hole (e.g. ₦12.3M); the legend shows full amounts.
const compactNaira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 })

// Categorical slots validated all-pairs for part-to-whole charts; past three, fold into "Other".
const CATEGORY_COLORS = ['var(--c-chart-1)', 'var(--c-chart-2)', 'var(--c-chart-3)']

/** Outcome of every checkout attempt. Status colours always come with an icon and a label. */
function outcomeSlices(records: PaymentRecord[]): Slice[] {
  const count = (s: PaymentRecord['status']) => records.filter((r) => r.status === s).length
  return [
    { key: 'successful', label: 'Successful', value: count('successful'), color: 'var(--c-status-good)', icon: <CircleCheckBig /> },
    { key: 'initialized', label: 'Started, not completed', value: count('initialized'), color: 'var(--c-status-warning)', icon: <Clock /> },
    { key: 'failed', label: 'Failed', value: count('failed'), color: 'var(--c-status-critical)', icon: <CircleX /> },
  ]
}

/** Money received, by Paystack payment channel: top three channels, the rest as "Other". */
function channelSlices(records: PaymentRecord[]): Slice[] {
  const totals = new Map<string, number>()
  for (const r of records) {
    if (r.status !== 'successful') continue
    const channel = r.channel ?? 'unknown'
    totals.set(channel, (totals.get(channel) ?? 0) + r.amount)
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1])
  const slices: Slice[] = ranked.slice(0, 3).map(([channel, value], i) => ({
    key: channel,
    label: CHANNEL_LABEL[channel] ?? (channel === 'unknown' ? 'Not reported' : channel.replace(/_/g, ' ')),
    value,
    color: CATEGORY_COLORS[i],
  }))
  const other = ranked.slice(3).reduce((sum, [, v]) => sum + v, 0)
  if (other > 0) slices.push({ key: 'other', label: 'Other methods', value: other, color: 'var(--c-chart-other)' })
  return slices
}

/** Two donuts: checkout outcomes (count) and money received by payment method (₦). */
export function TransactionAnalytics({ records, className }: { records: PaymentRecord[]; className?: string }) {
  const outcomes = outcomeSlices(records)
  const channels = channelSlices(records)
  const received = channels.reduce((sum, s) => sum + s.value, 0)
  const successful = outcomes[0].value

  return (
    <div className={className ?? 'grid gap-6 lg:grid-cols-2 *:min-w-0'}>
      <Donut
        title="Transaction outcomes"
        description="Every Paystack checkout buyers started."
        slices={outcomes}
        centerValue={String(records.length)}
        centerLabel={records.length === 1 ? 'transaction' : 'transactions'}
        valueHeader="Transactions"
        empty={<EmptyState compact icon={<CreditCard />} title="No transactions yet" description="Checkouts appear here once buyers start paying." />}
      />
      <Donut
        title="Received by payment method"
        description="Successful payments only."
        slices={channels}
        format={formatCurrency}
        centerValue={received >= 1_000_000 ? compactNaira.format(received) : formatCurrency(received)}
        centerLabel={`from ${successful} payment${successful === 1 ? '' : 's'}`}
        valueHeader="Amount received"
        empty={<EmptyState compact icon={<CreditCard />} title="No payments received yet" />}
      />
    </div>
  )
}
