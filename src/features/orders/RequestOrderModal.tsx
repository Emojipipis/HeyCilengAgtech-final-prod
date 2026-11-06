import { CircleCheckBig, Info, Truck, Warehouse } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { UNITS } from '@/config/catalog'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'
import { formatCurrency, formatQuantity, formatUnitPrice, todayISODate } from '@/lib/format'
import { availableQuantity } from '@/lib/inventory'
import { services, type ServiceError } from '@/services'
import type { MarketplaceListing } from '@/types/listing'
import type { FulfilmentMethod, Order } from '@/types/order'

interface RequestOrderModalProps {
  item: MarketplaceListing | null
  onClose: () => void
  /** Route prefix for order details, e.g. "/buyer/orders". */
  ordersPath: string
  defaultQuantity?: number
}

export function RequestOrderModal({ item, onClose, ordersPath, defaultQuantity }: RequestOrderModalProps) {
  return (
    <Modal open={item !== null} onClose={onClose} size="lg" title="Request an order" description={item ? item.listing.name : undefined}>
      {item && <RequestOrderForm key={item.listing.id} item={item} onClose={onClose} ordersPath={ordersPath} defaultQuantity={defaultQuantity} />}
    </Modal>
  )
}

function RequestOrderForm({ item, onClose, ordersPath, defaultQuantity }: Omit<RequestOrderModalProps, 'item'> & { item: MarketplaceListing }) {
  const { toast } = useToast()
  const { listing, seller } = item
  const available = availableQuantity(listing)
  const unit = UNITS[listing.unit]
  const initial = Math.min(available, Math.max(listing.minOrderQuantity, defaultQuantity ?? listing.minOrderQuantity))

  const [quantity, setQuantity] = useState(String(initial))
  const [fulfilment, setFulfilment] = useState<FulfilmentMethod>('delivery')
  const [address, setAddress] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<{ quantity?: string; address?: string; preferredDate?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)
  const [created, setCreated] = useState<Order | null>(null)
  const config = useAsync(() => services.platformConfig.get(), 'platform-config')
  // Collection is offered unless HeyCileng has switched it off.
  const allowCollection = config.data?.allowCollection ?? true

  const qty = Number(quantity)
  const subtotal = Number.isFinite(qty) && qty > 0 ? qty * listing.pricePerUnit : 0

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const next = {
      quantity: !quantity
        ? 'Enter a quantity.'
        : !Number.isFinite(qty) || qty <= 0
          ? 'Enter a valid quantity.'
          : qty < listing.minOrderQuantity
            ? `The minimum order is ${formatQuantity(listing.minOrderQuantity, listing.unit)}.`
            : qty > available
              ? `Only ${formatQuantity(available, listing.unit)} is available.`
              : undefined,
      address: fulfilment === 'delivery' && address.trim().length < 10 ? 'Enter the full delivery address.' : undefined,
      preferredDate: preferredDate && preferredDate < todayISODate() ? 'Choose a date from today onwards.' : undefined,
    }
    setErrors(next)
    if (next.quantity || next.address || next.preferredDate) return

    setSubmitting(true)
    setError(null)
    const result = await services.orders.requestOrder({
      listingId: listing.id,
      quantity: qty,
      fulfilment: allowCollection ? fulfilment : 'delivery',
      deliveryAddress: fulfilment === 'delivery' || !allowCollection ? address.trim() : undefined,
      preferredDate: preferredDate || undefined,
      buyerNote: note.trim() || undefined,
    })
    setSubmitting(false)
    if (result.ok) {
      setCreated(result.data)
      toast({ tone: 'success', title: 'Order request sent', description: `${result.data.reference} is awaiting the seller’s response.` })
    } else {
      setError(result.error)
    }
  }

  if (created) {
    return (
      <div className="space-y-5 py-2 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-leaf-100 text-leaf-700 dark:bg-leaf-500/15 dark:text-leaf-300">
          <CircleCheckBig className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-xl font-bold">Order request sent</h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
            {created.reference} is <span className="font-semibold text-fg">pending</span>. The seller will accept or decline it, and you’ll
            get a notification either way. Stock isn’t reserved until the seller accepts.
          </p>
        </div>
        <div className="flex flex-col-reverse justify-center gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <ButtonLink to={`${ordersPath}/${created.id}`} onClick={onClose}>
            View order
          </ButtonLink>
        </div>
      </div>
    )
  }

  const methodOption = (value: FulfilmentMethod, title: string, description: string, Icon: typeof Truck) => (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-lg border-2 p-3.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
        fulfilment === value ? 'border-action bg-leaf-50 dark:bg-leaf-500/10' : 'border-border hover:border-border-strong',
      )}
    >
      <input type="radio" name="fulfilment" value={value} checked={fulfilment === value} onChange={() => setFulfilment(value)} className="sr-only" />
      <Icon className={cn('mt-0.5 size-5 shrink-0', fulfilment === value ? 'text-action' : 'text-subtle')} aria-hidden="true" />
      <span>
        <span className="block text-sm font-semibold text-fg">{title}</span>
        <span className="block text-xs text-muted">{description}</span>
      </span>
    </label>
  )

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-muted p-3 text-sm">
        <span className="text-muted">{seller.businessName}</span>
        <span className="font-semibold tabular-nums">
          {formatUnitPrice(listing.pricePerUnit, listing.unit)} · {formatQuantity(available, listing.unit)} available
        </span>
      </div>

      <Input
        label={`Quantity (${unit.plural})`}
        inputMode="decimal"
        required
        value={quantity}
        onChange={(e) => {
          setQuantity(e.target.value.replace(/[^\d.]/g, ''))
          setErrors((x) => ({ ...x, quantity: undefined }))
        }}
        error={errors.quantity}
        hint={`Minimum order ${formatQuantity(listing.minOrderQuantity, listing.unit)} · maximum ${formatQuantity(available, listing.unit)}`}
      />

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Fulfilment</legend>
        <div className={cn('grid gap-3', allowCollection && 'sm:grid-cols-2')}>
          {methodOption('delivery', 'Delivery', 'HeyCileng assigns a logistics partner.', Truck)}
          {allowCollection && methodOption('collection', 'Collection', 'You collect from the seller’s site.', Warehouse)}
        </div>
      </fieldset>

      {fulfilment === 'delivery' && (
        <Textarea
          label="Delivery address"
          required
          rows={2}
          value={address}
          onChange={(e) => {
            setAddress(e.target.value)
            setErrors((x) => ({ ...x, address: undefined }))
          }}
          error={errors.address}
          hint="Shared with the assigned logistics partner only."
        />
      )}

      <Input
        label="Preferred date"
        type="date"
        min={todayISODate()}
        value={preferredDate}
        onChange={(e) => {
          setPreferredDate(e.target.value)
          setErrors((x) => ({ ...x, preferredDate: undefined }))
        }}
        error={errors.preferredDate}
        hint="Optional. Final dates are confirmed by HeyCileng."
      />

      <Textarea
        label="Note for HeyCileng"
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        hint="Optional. Read by the HeyCileng team — not sent directly to the seller."
      />

      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Estimated material value</span>
          <span className="font-display text-xl font-bold tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-subtle">
          {fulfilment === 'delivery' ? 'Delivery fee and who pays it are confirmed by HeyCileng after the seller accepts. ' : ''}
          No payment is taken now — online payments aren’t available yet.
        </p>
      </div>

      <div className="flex gap-2.5 rounded-lg bg-sky-50 p-3.5 text-sm text-muted dark:bg-sky-500/10">
        <Info className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
        <p>
          <span className="font-semibold text-fg">This is a request, not a confirmed order.</span> It does not reserve stock — the quantity
          is reserved only if the seller accepts.
        </p>
      </div>

      {error && <Alert tone={error.code === 'not_connected' ? 'warning' : 'error'}>{error.message}</Alert>}

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitting ? 'Sending request…' : 'Send order request'}
        </Button>
      </div>
    </form>
  )
}
