import { ArrowLeft, CircleCheckBig, LifeBuoy, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Textarea } from '@/components/ui/Textarea'
import { LogoMark } from '@/components/shared/Logo'
import { getStatusMeta } from '@/config/statuses'
import { TICKET_CATEGORIES } from '@/config/support'
import { useAsync } from '@/hooks/useAsync'
import { useViewer } from '@/hooks/useSession'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/format'
import { services, type ServiceError } from '@/services'
import type { TicketStatus } from '@/types/status'

const STATUS_NOTE: Record<TicketStatus, string> = {
  open: 'Waiting for a HeyCileng agent to respond. You’ll get a notification when they do.',
  in_progress: 'A HeyCileng agent is working on this.',
  awaiting_user: 'HeyCileng needs more information from you — reply below.',
  resolved: 'Marked as resolved. Reply if you still need help and we’ll reopen it.',
  closed: 'This ticket is closed. Open a new ticket if you need more help.',
}

export function SupportTicketPage() {
  const { ticketId = '' } = useParams()
  const { user } = useViewer()
  const { toast } = useToast()
  const base = `/${user.role}`
  const ticket = useAsync(() => services.support.get(ticketId), ticketId)
  const [reply, setReply] = useState('')
  const [replyError, setReplyError] = useState<string>()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)
  const [confirmResolve, setConfirmResolve] = useState(false)
  const [resolving, setResolving] = useState(false)

  const back = (
    <Link to={`${base}/support`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
      <ArrowLeft className="size-4" aria-hidden="true" />
      All tickets
    </Link>
  )

  if (ticket.loading && !ticket.data) return <LoadingState label="Loading ticket…" />
  if (ticket.error || !ticket.data) {
    return (
      <div className="space-y-6">
        {back}
        {ticket.error?.code === 'not_found' ? (
          <EmptyState icon={<LifeBuoy />} title="Ticket not found" action={<ButtonLink to={`${base}/support`}>Back to support</ButtonLink>} />
        ) : (
          <ErrorState description={ticket.error?.message} onRetry={ticket.reload} />
        )}
      </div>
    )
  }

  const t = ticket.data
  const closed = t.status === 'closed'

  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (reply.trim().length < 2) {
      setReplyError('Write a message first.')
      return
    }
    setSending(true)
    setError(null)
    const result = await services.support.reply(t.id, reply)
    setSending(false)
    if (result.ok) {
      ticket.setData(result.data)
      setReply('')
      toast({ tone: 'success', title: 'Reply sent to HeyCileng', duration: 2500 })
    } else {
      setError(result.error)
    }
  }

  const resolve = async () => {
    setResolving(true)
    const result = await services.support.markResolved(t.id)
    setResolving(false)
    setConfirmResolve(false)
    if (result.ok) {
      ticket.setData(result.data)
      toast({ tone: 'success', title: 'Ticket marked as resolved' })
    } else {
      toast({ tone: 'error', title: 'Couldn’t update ticket', description: result.error.message })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {back}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind="ticket" status={t.status} size="md" />
            {t.isDemo && <DemoBadge />}
          </div>
          <h1 className="mt-2 text-2xl font-bold">{t.subject}</h1>
          <p className="mt-1 text-sm text-muted">
            {t.reference} · {TICKET_CATEGORIES[t.category]} · opened {formatDateTime(t.createdAt)}
          </p>
          {t.order && (
            <Link to={`${base}/orders/${t.order.id}`} className="mt-1 inline-block text-sm font-semibold text-action hover:underline">
              Order {t.order.reference}
            </Link>
          )}
        </div>
        {!closed && t.status !== 'resolved' && (
          <Button variant="outline" leftIcon={<CircleCheckBig className="size-4" />} onClick={() => setConfirmResolve(true)}>
            Mark as resolved
          </Button>
        )}
      </div>

      <Alert tone={t.status === 'awaiting_user' ? 'warning' : t.status === 'resolved' || t.status === 'closed' ? 'success' : 'info'} title={getStatusMeta('ticket', t.status).label}>
        {STATUS_NOTE[t.status]}
      </Alert>

      <ol className="space-y-4" aria-label="Messages">
        {t.messages.map((m) => {
          const fromSupport = m.author === 'heycileng'
          return (
            <li key={m.id} className={cn('flex gap-3', !fromSupport && 'flex-row-reverse')}>
              {fromSupport ? <LogoMark tone="tile" className="size-9 rounded-full" /> : <Avatar name={user.fullName} size="sm" className="size-9" />}
              <div className={cn('max-w-[85%] rounded-xl border px-4 py-3', fromSupport ? 'border-border bg-surface' : 'border-leaf-200 bg-leaf-50 dark:border-leaf-500/25 dark:bg-leaf-500/10')}>
                <p className="text-xs font-semibold text-fg">
                  {fromSupport ? 'HeyCileng Support' : 'You'} <span className="font-normal text-subtle">· {formatDateTime(m.at)}</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-muted">{m.body}</p>
              </div>
            </li>
          )
        })}
      </ol>

      {closed ? (
        <Card padded className="text-center">
          <p className="text-sm text-muted">This ticket is closed.</p>
          <ButtonLink to={`${base}/support?new=1${t.order ? `&order=${t.order.id}` : ''}`} variant="outline" size="sm" className="mt-3">
            Open a new ticket
          </ButtonLink>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <form noValidate onSubmit={send} className="space-y-3">
              <Textarea
                label="Reply to HeyCileng"
                rows={4}
                value={reply}
                onChange={(e) => {
                  setReply(e.target.value)
                  setReplyError(undefined)
                }}
                error={replyError}
              />
              {error && <Alert tone={error.code === 'not_connected' ? 'warning' : 'error'}>{error.message}</Alert>}
              <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-1.5 text-xs text-subtle">
                  <ShieldCheck className="size-3.5 text-action" aria-hidden="true" />
                  Seen by HeyCileng support only.
                </p>
                <Button type="submit" loading={sending}>
                  Send reply
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <ConfirmDialog
        open={confirmResolve}
        onClose={() => setConfirmResolve(false)}
        onConfirm={() => void resolve()}
        title="Mark this ticket as resolved?"
        description="Let HeyCileng know your issue is sorted. You can still reply later to reopen it."
        confirmLabel="Mark as resolved"
        loading={resolving}
      />
    </div>
  )
}
