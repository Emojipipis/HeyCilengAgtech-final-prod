import { LifeBuoy } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { Select } from '@/components/ui/Select'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Textarea } from '@/components/ui/Textarea'
import { LogoMark } from '@/components/shared/Logo'
import { TICKET_CATEGORIES } from '@/config/support'
import { BackLink } from '@/features/marketplace/ListingDetailView'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/format'
import { services, type ServiceError } from '@/services'

type ReplyStatus = 'in_progress' | 'awaiting_user' | 'resolved'

const BACK = { to: '/admin/support', label: 'Support tickets' }

export function AdminTicketPage() {
  const { ticketId = '' } = useParams()
  const { toast } = useToast()
  const ticket = useAsync(() => services.adminSupport.get(ticketId), ticketId)
  const [reply, setReply] = useState('')
  const [replyStatus, setReplyStatus] = useState<ReplyStatus>('awaiting_user')
  const [replyError, setReplyError] = useState<string>()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)

  if (ticket.loading && !ticket.data) return <LoadingState label="Loading ticket…" />
  if (ticket.error || !ticket.data) {
    return (
      <div className="space-y-6">
        <BackLink {...BACK} />
        {ticket.error?.code === 'not_found' ? (
          <EmptyState icon={<LifeBuoy />} title="Ticket not found" action={<ButtonLink to="/admin/support">Back to tickets</ButtonLink>} />
        ) : (
          <ErrorState description={ticket.error?.message} onRetry={ticket.reload} />
        )}
      </div>
    )
  }

  const t = ticket.data

  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (reply.trim().length < 2) {
      setReplyError('Write a reply first.')
      return
    }
    setSending(true)
    setError(null)
    const result = await services.adminSupport.reply(t.id, reply, replyStatus)
    setSending(false)
    if (result.ok) {
      ticket.setData(result.data)
      setReply('')
      toast({ tone: 'success', title: 'Reply sent', description: `${t.requesterName} has been notified.` })
    } else {
      setError(result.error)
    }
  }

  const close = async () => {
    const result = await services.adminSupport.setStatus(t.id, 'closed')
    if (result.ok) {
      ticket.setData(result.data)
      toast({ tone: 'success', title: 'Ticket closed' })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink {...BACK} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind="ticket" status={t.status} size="md" />
            <Badge tone={t.requesterRole === 'seller' ? 'brand' : 'accent'}>{t.requesterRole === 'seller' ? 'Seller' : 'Buyer'}</Badge>
            {t.isDemo && <DemoBadge />}
          </div>
          <h1 className="mt-2 text-2xl font-bold">{t.subject}</h1>
          <p className="mt-1 text-sm text-muted">
            {t.reference} · {TICKET_CATEGORIES[t.category]} · from {t.requesterName}
          </p>
          {t.order && (
            <Link to={`/admin/orders/${t.order.id}`} className="mt-1 inline-block text-sm font-semibold text-action hover:underline">
              Order {t.order.reference}
            </Link>
          )}
        </div>
        {t.status !== 'closed' && (
          <Button variant="outline" onClick={() => void close()}>
            Close ticket
          </Button>
        )}
      </div>

      <ol className="space-y-4" aria-label="Messages">
        {t.messages.map((m) => {
          const fromSupport = m.author === 'heycileng'
          return (
            <li key={m.id} className={cn('flex gap-3', fromSupport && 'flex-row-reverse')}>
              {fromSupport ? <LogoMark tone="tile" className="size-9" /> : <Avatar name={t.requesterName} size="sm" className="size-9" />}
              <div className={cn('max-w-[85%] rounded-xl border px-4 py-3', fromSupport ? 'border-leaf-200 bg-leaf-50 dark:border-leaf-500/25 dark:bg-leaf-500/10' : 'border-border bg-surface')}>
                <p className="text-xs font-semibold text-fg">
                  {fromSupport ? 'HeyCileng Support' : t.requesterName} <span className="font-normal text-subtle">· {formatDateTime(m.at)}</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-muted">{m.body}</p>
              </div>
            </li>
          )
        })}
      </ol>

      {t.status === 'closed' ? (
        <p className="text-center text-sm text-muted">This ticket is closed.</p>
      ) : (
        <Card>
          <CardBody>
            <form noValidate onSubmit={send} className="space-y-4">
              <Textarea
                label="Reply as HeyCileng Support"
                rows={4}
                value={reply}
                onChange={(e) => {
                  setReply(e.target.value)
                  setReplyError(undefined)
                }}
                error={replyError}
                hint="Never share the other party’s contact details. Relay information yourself."
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <Select
                  label="After replying, set status to"
                  options={[
                    { value: 'awaiting_user', label: 'Awaiting user' },
                    { value: 'in_progress', label: 'In progress' },
                    { value: 'resolved', label: 'Resolved' },
                  ]}
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value as ReplyStatus)}
                  containerClassName="sm:w-60"
                />
                <Button type="submit" loading={sending}>
                  Send reply
                </Button>
              </div>
              {error && <Alert tone="error">{error.message}</Alert>}
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
