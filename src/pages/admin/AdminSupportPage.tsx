import { LifeBuoy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { SearchBar } from '@/components/ui/SearchBar'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/ui/Table'
import { Tabs } from '@/components/ui/Tabs'
import { STATUS_META } from '@/config/statuses'
import { TICKET_CATEGORIES } from '@/config/support'
import { useAsync } from '@/hooks/useAsync'
import { useViewer } from '@/hooks/useSession'
import { formatRelative } from '@/lib/format'
import { services, type AdminTicket } from '@/services'
import type { TicketStatus } from '@/types/status'

type View = 'queue' | TicketStatus | 'all'

/** Tickets waiting on HeyCileng (open or in progress). */
const inQueue = (t: AdminTicket) => t.status === 'open' || t.status === 'in_progress'

export function AdminSupportPage() {
  const navigate = useNavigate()
  const { isDemo } = useViewer()
  const { data, loading, error, reload } = useAsync(() => services.adminSupport.list(), 'admin-support')
  const [view, setView] = useState<View>('queue')
  const [query, setQuery] = useState('')

  const all = useMemo(() => data ?? [], [data])
  const rows = all.filter((t) => {
    const q = query.trim().toLowerCase()
    return (view === 'all' || (view === 'queue' ? inQueue(t) : t.status === view)) && (!q || [t.subject, t.reference, t.requesterName].some((x) => x.toLowerCase().includes(q)))
  })

  const columns: Column<AdminTicket>[] = [
    {
      key: 'subject',
      header: 'Ticket',
      render: (t) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-fg">{t.subject}</p>
          <p className="truncate text-xs text-subtle">
            {t.reference} · {TICKET_CATEGORIES[t.category]}
            {t.order && ` · ${t.order.reference}`}
          </p>
        </div>
      ),
    },
    {
      key: 'from',
      header: 'From',
      hideOnMobile: true,
      render: (t) => (
        <span className="flex items-center gap-2 text-xs">
          <Badge tone={t.requesterRole === 'seller' ? 'brand' : 'accent'}>{t.requesterRole === 'seller' ? 'Seller' : 'Buyer'}</Badge>
          <span className="truncate text-muted">{t.requesterName}</span>
        </span>
      ),
    },
    { key: 'updated', header: 'Updated', hideOnMobile: true, render: (t) => <span className="text-xs text-muted">{formatRelative(t.updatedAt)}</span> },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge kind="ticket" status={t.status} /> },
  ]

  return (
    <>
      <PageHeader eyebrow={isDemo ? <DemoBadge /> : undefined} title="Support tickets" description="Every buyer and seller question comes here. HeyCileng is the only point of contact between the two sides." />
      <Tabs
        label="Filter tickets"
        value={view}
        onChange={setView}
        className="mb-4"
        items={[
          { value: 'queue', label: 'Needs a reply', count: all.filter(inQueue).length },
          ...(['awaiting_user', 'resolved', 'closed'] as TicketStatus[]).map((s) => ({ value: s, label: STATUS_META.ticket[s].label, count: all.filter((t) => t.status === s).length })),
          { value: 'all' as const, label: 'All', count: all.length },
        ]}
      />
      <SearchBar value={query} onChange={setQuery} placeholder="Search subject, reference or account" className="mb-4 max-w-md" label="Search tickets" />
      {error ? (
        <ErrorState description={error.message} onRetry={reload} />
      ) : (
        <DataTable
          caption="Support tickets"
          columns={columns}
          rows={rows}
          rowKey={(t) => t.id}
          loading={loading}
          onRowClick={(t) => navigate(`/admin/support/${t.id}`)}
          empty={<EmptyState compact icon={<LifeBuoy />} title={view === 'queue' ? 'Queue is clear' : 'No tickets here'} />}
        />
      )}
    </>
  )
}
