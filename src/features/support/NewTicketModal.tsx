import { ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { TICKET_CATEGORIES } from '@/config/support'
import { useAsync } from '@/hooks/useAsync'
import { useViewer } from '@/hooks/useSession'
import { services, type ServiceError } from '@/services'
import type { NewTicketInput, SupportTicket, TicketCategory } from '@/types/support'

interface NewTicketModalProps {
  open: boolean
  onClose: () => void
  onCreated: (ticket: SupportTicket) => void
  /** Prefill from an order page. */
  initialOrderId?: string
}

export function NewTicketModal(props: NewTicketModalProps) {
  return (
    <Modal open={props.open} onClose={props.onClose} size="lg" title="Contact HeyCileng support" description="We’ll reply here and notify you. Messages are seen by HeyCileng only.">
      {props.open && <NewTicketForm key={props.initialOrderId ?? 'new'} {...props} />}
    </Modal>
  )
}

function NewTicketForm({ onClose, onCreated, initialOrderId }: NewTicketModalProps) {
  const { user } = useViewer()
  // The user's own orders — as buyer or seller — for the "related order" picker.
  const orders = useAsync(() => (user.role === 'seller' ? services.sellerOrders.listIncoming() : services.orders.listMine()), `ticket-orders-${user.role}`)
  const [values, setValues] = useState<NewTicketInput>({ subject: '', category: 'order', orderId: initialOrderId ?? '', message: '' })
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)

  const set = <K extends keyof NewTicketInput>(key: K, value: NewTicketInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (key === 'subject' || key === 'message') setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next = {
      subject: values.subject.trim().length >= 5 ? undefined : 'Add a short subject (at least 5 characters).',
      message: values.message.trim().length >= 20 ? undefined : 'Describe the issue in at least 20 characters.',
    }
    setErrors(next)
    if (next.subject || next.message) return
    setSubmitting(true)
    setError(null)
    const result = await services.support.create({ ...values, orderId: values.orderId || undefined })
    setSubmitting(false)
    if (result.ok) onCreated(result.data)
    else setError(result.error)
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="What is it about?"
          options={Object.entries(TICKET_CATEGORIES).map(([value, label]) => ({ value, label }))}
          value={values.category}
          onChange={(e) => set('category', e.target.value as TicketCategory)}
        />
        <Select
          label="Related order"
          placeholder={orders.loading ? 'Loading orders…' : 'None'}
          options={(orders.data ?? []).map((o) => ({ value: o.id, label: `${o.reference} · ${o.listing.name}` }))}
          value={values.orderId}
          onChange={(e) => set('orderId', e.target.value)}
          hint="Optional"
        />
      </div>
      <Input label="Subject" required value={values.subject} onChange={(e) => set('subject', e.target.value)} error={errors.subject} placeholder="e.g. Change of delivery date" />
      <Textarea
        label="Message"
        required
        rows={5}
        value={values.message}
        onChange={(e) => set('message', e.target.value)}
        error={errors.message}
        hint="Don’t include bank or card details. HeyCileng will never ask for your password."
      />
      <p className="flex gap-2 rounded-lg bg-surface-muted p-3 text-xs text-muted">
        <ShieldCheck className="mt-px size-4 shrink-0 text-action" aria-hidden="true" />
        Your message goes to HeyCileng support only. If the other party needs to know something, HeyCileng will contact them for you.
      </p>
      {error && <Alert tone={error.code === 'not_connected' ? 'warning' : 'error'}>{error.message}</Alert>}
      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Send to support
        </Button>
      </div>
    </form>
  )
}
