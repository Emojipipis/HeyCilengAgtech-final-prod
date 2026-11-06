import { CircleCheckBig, TriangleExclamationPoint } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { stateName } from '@/config/locations'
import { PLATFORM } from '@/config/platform'
import { todayISODate } from '@/lib/format'
import type { ServiceError } from '@/services'
import type { AssignDeliveryInput, LogisticsPartner } from '@/types/logistics'
import type { FeePayer, Order } from '@/types/order'

interface AssignDeliveryModalProps {
  open: boolean
  order: Order
  partners: LogisticsPartner[]
  onClose: () => void
  onSubmit: (input: AssignDeliveryInput) => Promise<{ ok: true } | { ok: false; error: ServiceError }>
}

const PAYERS: { value: FeePayer; label: string }[] = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'heycileng', label: 'HeyCileng' },
]

export function AssignDeliveryModal(props: AssignDeliveryModalProps) {
  return (
    <Modal open={props.open} onClose={props.onClose} size="lg" title={props.order.delivery?.partnerId ? 'Update logistics' : 'Assign logistics partner'} description={`${props.order.reference} · ${props.order.listing.name}`}>
      {props.open && <AssignDeliveryForm {...props} />}
    </Modal>
  )
}

function AssignDeliveryForm({ order, partners, onClose, onSubmit }: AssignDeliveryModalProps) {
  const current = order.delivery
  const active = partners.filter((p) => p.status === 'active')
  const [partnerId, setPartnerId] = useState(current?.partnerId && active.some((p) => p.id === current.partnerId) ? current.partnerId : '')
  const [fee, setFee] = useState(current?.fee !== undefined ? String(current.fee) : '')
  const [feePayer, setFeePayer] = useState<FeePayer>(current?.feePayer ?? 'buyer')
  const [estimatedDate, setEstimatedDate] = useState(current?.estimatedDate ?? order.preferredDate ?? '')
  const [trackingReference, setTrackingReference] = useState(current?.trackingReference ?? '')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<{ partnerId?: string; fee?: string; estimatedDate?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)

  const partner = active.find((p) => p.id === partnerId)
  const pickupState = order.listing.sellerLocation.state
  const coversPickup = partner ? partner.coverageStates.includes(pickupState) : undefined

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next = {
      partnerId: partnerId ? undefined : 'Choose a logistics partner.',
      fee: fee.trim() !== '' && Number(fee) >= 0 ? undefined : 'Enter the delivery fee (0 if free).',
      estimatedDate: !estimatedDate ? 'Choose an estimated delivery date.' : estimatedDate < todayISODate() ? 'The date can’t be in the past.' : undefined,
    }
    setErrors(next)
    if (next.partnerId || next.fee || next.estimatedDate) return
    setSubmitting(true)
    setError(null)
    const result = await onSubmit({
      partnerId,
      fee: Number(fee),
      feePayer,
      estimatedDate,
      trackingReference: trackingReference.trim() || undefined,
      note: note.trim() || undefined,
    })
    setSubmitting(false)
    if (result.ok) onClose()
    else setError(result.error)
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      <div className="rounded-lg bg-surface-muted p-3 text-sm">
        <p>
          <span className="text-muted">Pickup:</span> <span className="font-medium">{order.listing.sellerLocation.area}, {stateName(pickupState)}</span>
        </p>
        <p className="mt-1">
          <span className="text-muted">Deliver to:</span> <span className="font-medium">{order.deliveryAddress ?? 'Not provided'}</span>
        </p>
      </div>

      <div>
        <Select
          label="Logistics partner"
          required
          placeholder={active.length ? 'Select a partner' : 'No active partners'}
          options={active.map((p) => ({ value: p.id, label: p.name }))}
          value={partnerId}
          onChange={(e) => {
            setPartnerId(e.target.value)
            setErrors((x) => ({ ...x, partnerId: undefined }))
          }}
          error={errors.partnerId}
        />
        {partner && (
          <p className={`mt-1.5 flex items-center gap-1.5 text-xs ${coversPickup ? 'text-leaf-700 dark:text-leaf-300' : 'text-ochre-700 dark:text-ochre-300'}`}>
            {coversPickup ? <CircleCheckBig className="size-3.5" aria-hidden="true" /> : <TriangleExclamationPoint className="size-3.5" aria-hidden="true" />}
            {coversPickup ? `Covers ${stateName(pickupState)}` : `Coverage doesn’t list ${stateName(pickupState)} — confirm with the partner`} · {partner.vehicleTypes}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={`Delivery fee (${PLATFORM.currency})`}
          required
          inputMode="numeric"
          value={fee}
          onChange={(e) => {
            setFee(e.target.value.replace(/[^\d.]/g, ''))
            setErrors((x) => ({ ...x, fee: undefined }))
          }}
          error={errors.fee}
        />
        <Select label="Fee paid by" options={PAYERS} value={feePayer} onChange={(e) => setFeePayer(e.target.value as FeePayer)} />
        <Input
          label="Estimated delivery date"
          type="date"
          required
          min={todayISODate()}
          value={estimatedDate}
          onChange={(e) => {
            setEstimatedDate(e.target.value)
            setErrors((x) => ({ ...x, estimatedDate: undefined }))
          }}
          error={errors.estimatedDate}
          hint={order.preferredDate ? `Buyer prefers ${order.preferredDate}` : undefined}
        />
        <Input label="Tracking reference" value={trackingReference} onChange={(e) => setTrackingReference(e.target.value)} hint="Optional — from the partner’s waybill." />
      </div>

      <Textarea label="Internal note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} hint="Recorded in the delivery history." />

      <p className="text-xs text-subtle">The buyer and seller are notified of the partner name, fee, payer and estimated date — not of each other’s details.</p>
      {error && <Alert tone={error.code === 'not_connected' ? 'warning' : 'error'}>{error.message}</Alert>}

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {current?.partnerId ? 'Save logistics' : 'Assign partner'}
        </Button>
      </div>
    </form>
  )
}
