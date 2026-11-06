import { LifeBuoy, MessageSquareText, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Tabs } from '@/components/ui/Tabs'
import { TICKET_CATEGORIES } from '@/config/support'
import { NewTicketModal } from '@/features/support/NewTicketModal'
import { useAsync } from '@/hooks/useAsync'
import { useViewer } from '@/hooks/useSession'
import { useToast } from '@/hooks/useToast'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/cn'
import { services } from '@/services'
import type { SupportTicket } from '@/types/support'

type View = 'active' | 'resolved' | 'all'
const isActive = (t: SupportTicket) => ['open', 'in_progress', 'awaiting_user'].includes(t.status)

/** Support tickets with HeyCileng for buyers and sellers. */
export function SupportPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useViewer()
  const base = `/${user.role}/support`
  const [params, setParams] = useSearchParams()
  // Keyed by account: buyer and seller areas share this page component.
  const { data, loading, error, reload } = useAsync(() => services.support.listMine(), `support-${user.id}`)
  const [view, setView] = useState<View>('active')
  const [formOpen, setFormOpen] = useState(params.get('new') === '1')
  const initialOrderId = params.get('order') ?? undefined

  const tickets = useMemo(() => data ?? [], [data])
  const visible = tickets.filter((t) => view === 'all' || (view === 'active' ? isActive(t) : !isActive(t)))
  const awaiting = tickets.filter((t) => t.status === 'awaiting_user').length

  const closeForm = () => {
    setFormOpen(false)
    if (params.has('new')) setParams({}, { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Support"
        description="Questions about an order, a delivery or your account go to the HeyCileng support team. We reply here and notify you."
        actions={
          <Button leftIcon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
            New ticket
          </Button>
        }
      />

      {awaiting > 0 && (
        <p className="mb-5 rounded-lg border border-ochre-200 bg-ochre-50 px-4 py-3 text-sm text-ochre-900 dark:border-ochre-400/25 dark:bg-ochre-400/10 dark:text-ochre-100">
          <span className="font-semibold">{awaiting} ticket{awaiting === 1 ? ' is' : 's are'} waiting for your reply.</span> HeyCileng needs more information to help.
        </p>
      )}

      <Tabs
        label="Filter tickets"
        variant="pill"
        value={view}
        onChange={setView}
        className="mb-5"
        items={[
          { value: 'active', label: 'Open', count: tickets.filter(isActive).length },
          { value: 'resolved', label: 'Resolved & closed', count: tickets.filter((t) => !isActive(t)).length },
          { value: 'all', label: 'All', count: tickets.length },
        ]}
      />

      {loading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : error ? (
        <ErrorState description={error.message} onRetry={reload} />
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={<LifeBuoy />}
            title={tickets.length === 0 ? 'No support tickets yet' : view === 'active' ? 'No open tickets' : 'Nothing here'}
            description="Need help with an order, delivery or your account? Our team is here."
            action={<Button onClick={() => setFormOpen(true)}>Contact support</Button>}
          />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {visible.map((t) => {
              const last = t.messages[t.messages.length - 1]
              return (
                <li key={t.id}>
                  <Link to={`${base}/${t.id}`} className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-surface-muted sm:flex-row sm:items-center sm:gap-4 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn('truncate font-semibold', t.status === 'awaiting_user' && 'text-ochre-800 dark:text-ochre-200')}>{t.subject}</p>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-subtle">
                        {t.reference} · {TICKET_CATEGORIES[t.category]}
                        {t.order && ` · Order ${t.order.reference}`}
                      </p>
                      <p className="mt-1 line-clamp-1 text-sm text-muted">
                        <span className="font-medium text-fg">{last.author === 'heycileng' ? 'HeyCileng: ' : 'You: '}</span>
                        {last.body}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                      <StatusBadge kind="ticket" status={t.status} />
                      <span className="flex items-center gap-1 text-xs text-subtle">
                        <MessageSquareText className="size-3.5" aria-hidden="true" />
                        {t.messages.length} · {formatRelative(t.updatedAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <NewTicketModal
        open={formOpen}
        onClose={closeForm}
        initialOrderId={initialOrderId}
        onCreated={(ticket) => {
          toast({ tone: 'success', title: `Ticket ${ticket.reference} sent`, description: 'HeyCileng support will reply here. You’ll get a notification.' })
          navigate(`${base}/${ticket.id}`, { replace: params.has('new') })
        }}
      />
    </>
  )
}
