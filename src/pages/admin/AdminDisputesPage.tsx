import { Scale } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'
import { Textarea } from '@/components/ui/Textarea'
import { STATUS_META } from '@/config/statuses'
import { useAsync } from '@/hooks/useAsync'
import { useViewer } from '@/hooks/useSession'
import { useToast } from '@/hooks/useToast'
import { formatDateTime, formatRelative } from '@/lib/format'
import { services, type ServiceError } from '@/services'
import type { Dispute, DisputeReason } from '@/types/admin'
import type { DisputeStatus } from '@/types/status'

const REASONS: Record<DisputeReason, string> = {
  quality: 'Quality not as described',
  quantity: 'Quantity short',
  delivery: 'Delivery problem',
  damaged: 'Damaged on arrival',
  other: 'Other',
}

const isOpen = (d: Dispute) => d.status === 'open' || d.status === 'under_review'

function DisputeModal({ dispute, onClose, onSaved }: { dispute: Dispute | null; onClose: () => void; onSaved: (d: Dispute) => void }) {
  return (
    <Modal open={dispute !== null} onClose={onClose} size="lg" title={dispute?.reference} description={dispute ? `${REASONS[dispute.reason]} · raised by ${dispute.raisedByName}` : undefined}>
      {dispute && <DisputeForm key={dispute.id + dispute.updatedAt} dispute={dispute} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  )
}

function DisputeForm({ dispute, onClose, onSaved }: { dispute: Dispute; onClose: () => void; onSaved: (d: Dispute) => void }) {
  const [status, setStatus] = useState<DisputeStatus>(dispute.status)
  const [resolution, setResolution] = useState(dispute.resolution ?? '')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)
  const closing = status === 'resolved' || status === 'rejected'

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const result = await services.disputes.update(dispute.id, {
      status: status !== dispute.status ? status : undefined,
      resolution: closing ? resolution : undefined,
      note,
    })
    setSaving(false)
    if (result.ok) onSaved(result.data)
    else setError(result.error)
  }

  return (
    <form noValidate onSubmit={save} className="space-y-5">
      <div className="rounded-lg bg-surface-muted p-4 text-sm">
        <p className="text-muted">{dispute.description}</p>
        <Link to={`/admin/orders/${dispute.order.id}`} className="mt-2 inline-block text-sm font-semibold text-action hover:underline">
          Order {dispute.order.reference} · {dispute.order.material}
        </Link>
      </div>

      {dispute.notes.length > 0 && (
        <div>
          <h3 className="font-sans text-sm font-semibold">Internal notes</h3>
          <ul className="mt-2 space-y-2">
            {dispute.notes.map((n) => (
              <li key={n.at} className="rounded-lg border border-border px-3 py-2 text-sm">
                <p className="text-muted">{n.body}</p>
                <p className="mt-0.5 text-xs text-subtle">{formatDateTime(n.at)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Select
        label="Status"
        options={(Object.keys(STATUS_META.dispute) as DisputeStatus[]).map((s) => ({ value: s, label: STATUS_META.dispute[s].label }))}
        value={status}
        onChange={(e) => setStatus(e.target.value as DisputeStatus)}
      />
      {closing && (
        <Textarea label={status === 'resolved' ? 'Resolution' : 'Why it was rejected'} required rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} hint="Shared with buyer and seller through HeyCileng support." />
      )}
      <Textarea label="Add internal note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} hint="Visible to HeyCileng staff only." />
      <p className="text-xs text-subtle">Refunds and compensation can’t be processed on the platform until payments are integrated.</p>
      {error && <Alert tone="error">{error.message}</Alert>}
      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} disabled={status === dispute.status && !note.trim() && resolution === (dispute.resolution ?? '')}>
          Save
        </Button>
      </div>
    </form>
  )
}

export function AdminDisputesPage() {
  const { isDemo } = useViewer()
  const { toast } = useToast()
  const { data, loading, error, reload, setData } = useAsync(() => services.disputes.list(), 'disputes')
  const [view, setView] = useState<'open' | 'closed' | 'all'>('open')
  const [selected, setSelected] = useState<Dispute | null>(null)

  const all = data ?? []
  const visible = all.filter((d) => view === 'all' || (view === 'open' ? isOpen(d) : !isOpen(d)))

  return (
    <>
      <PageHeader eyebrow={isDemo ? <DemoBadge /> : undefined} title="Disputes" description="Problems with completed or delivered orders, raised through HeyCileng support and resolved by our team." />
      <Tabs
        label="Filter disputes"
        variant="pill"
        value={view}
        onChange={setView}
        className="mb-5"
        items={[
          { value: 'open', label: 'Open', count: all.filter(isOpen).length },
          { value: 'closed', label: 'Closed', count: all.filter((d) => !isOpen(d)).length },
          { value: 'all', label: 'All', count: all.length },
        ]}
      />
      {loading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : error ? (
        <ErrorState description={error.message} onRetry={reload} />
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState icon={<Scale />} title={view === 'open' ? 'No open disputes' : 'Nothing here'} />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {visible.map((d) => (
              <li key={d.id}>
                <button type="button" onClick={() => setSelected(d)} className="flex w-full flex-col gap-2 px-5 py-4 text-left transition-colors hover:bg-surface-muted sm:flex-row sm:items-center sm:gap-4 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-fg">
                      {REASONS[d.reason]} <span className="font-normal text-subtle">· {d.reference}</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-subtle">
                      Order {d.order.reference} · {d.order.material} · raised by {d.raisedByName}
                    </p>
                    <p className="mt-1 line-clamp-1 text-sm text-muted">{d.resolution ?? d.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                    <StatusBadge kind="dispute" status={d.status} />
                    <span className="text-xs text-subtle">{formatRelative(d.updatedAt)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <DisputeModal
        dispute={selected}
        onClose={() => setSelected(null)}
        onSaved={(d) => {
          setData((list) => (list ?? []).map((x) => (x.id === d.id ? d : x)))
          setSelected(null)
          toast({ tone: 'success', title: 'Dispute updated' })
        }}
      />
    </>
  )
}
