import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { getStatusMeta } from '@/config/statuses'
import { formatQuantity } from '@/lib/format'
import { DELIVERY_FLOW } from '@/lib/logistics'
import type { ServiceError } from '@/services'
import type { DeliveryUpdateStatus, UpdateDeliveryInput } from '@/types/logistics'
import type { Order } from '@/types/order'

interface UpdateDeliveryModalProps {
  open: boolean
  order: Order
  onClose: () => void
  onSubmit: (input: UpdateDeliveryInput) => Promise<{ ok: true } | { ok: false; error: ServiceError }>
}

function consequence(status: DeliveryUpdateStatus, order: Order, rescheduling: boolean) {
  const qty = formatQuantity(order.quantity, order.listing.unit)
  switch (status) {
    case 'in_transit':
      return 'The order moves to Dispatched. Buyer and seller are notified.'
    case 'delivered':
      return `The order is completed and ${qty} moves from reserved to sold stock. This can’t be undone.`
    case 'failed':
      return `The order moves to Delivery Failed. ${qty} stays reserved until it is rescheduled or cancelled.`
    case 'scheduled':
      return rescheduling ? 'The order returns to Processing with a new delivery date.' : 'The schedule is shared with buyer and seller.'
  }
}

export function UpdateDeliveryModal(props: UpdateDeliveryModalProps) {
  return (
    <Modal open={props.open} onClose={props.onClose} title="Update delivery" description={`${props.order.reference} · ${props.order.delivery?.partnerName ?? ''}`}>
      {props.open && <UpdateDeliveryForm {...props} />}
    </Modal>
  )
}

function UpdateDeliveryForm({ order, onClose, onSubmit }: UpdateDeliveryModalProps) {
  const delivery = order.delivery!
  const options = DELIVERY_FLOW[delivery.status] ?? []
  const [status, setStatus] = useState<DeliveryUpdateStatus>(options[0])
  const [note, setNote] = useState('')
  const [estimatedDate, setEstimatedDate] = useState('')
  const [trackingReference, setTrackingReference] = useState(delivery.trackingReference ?? '')
  const [noteError, setNoteError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)
  const rescheduling = delivery.status === 'failed'

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (status === 'failed' && !note.trim()) {
      setNoteError('Explain what went wrong so support can follow up.')
      return
    }
    setSubmitting(true)
    setError(null)
    const result = await onSubmit({
      status,
      note: note.trim() || undefined,
      estimatedDate: estimatedDate || undefined,
      trackingReference: trackingReference.trim() || undefined,
    })
    setSubmitting(false)
    if (result.ok) onClose()
    else setError(result.error)
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      <p className="text-sm text-muted">
        Current delivery status: <span className="font-semibold text-fg">{getStatusMeta('delivery', delivery.status).label}</span>
      </p>
      <Select
        label="New status"
        options={options.map((value) => ({ value, label: value === 'scheduled' && rescheduling ? 'Rescheduled' : getStatusMeta('delivery', value).label }))}
        value={status}
        onChange={(e) => {
          setStatus(e.target.value as DeliveryUpdateStatus)
          setNoteError(undefined)
        }}
      />
      <Alert tone={status === 'delivered' || status === 'failed' ? 'warning' : 'info'}>{consequence(status, order, rescheduling)}</Alert>
      {(status === 'scheduled' || status === 'in_transit') && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="New estimated date" type="date" value={estimatedDate} onChange={(e) => setEstimatedDate(e.target.value)} hint="Leave empty to keep the current date." />
          <Input label="Tracking reference" value={trackingReference} onChange={(e) => setTrackingReference(e.target.value)} />
        </div>
      )}
      <Textarea
        label={status === 'failed' ? 'What happened?' : 'Note'}
        required={status === 'failed'}
        rows={2}
        value={note}
        onChange={(e) => {
          setNote(e.target.value)
          setNoteError(undefined)
        }}
        error={noteError}
        hint="Recorded in the delivery history and shared with buyer and seller."
      />
      {error && <Alert tone="error">{error.message}</Alert>}
      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting} variant={status === 'failed' ? 'danger' : 'primary'}>
          Save update
        </Button>
      </div>
    </form>
  )
}
