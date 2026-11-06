import { History } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { Select } from '@/components/ui/Select'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { DataTable, type Column } from '@/components/ui/Table'
import { useAsync } from '@/hooks/useAsync'
import { usePagination } from '@/hooks/usePagination'
import { useViewer } from '@/hooks/useSession'
import { formatDateTime } from '@/lib/format'
import { services } from '@/services'
import type { AuditLogEntry, AuditTargetType } from '@/types/admin'

const TYPES: Record<AuditTargetType, string> = {
  order: 'Order',
  listing: 'Listing',
  user: 'User',
  partner: 'Logistics partner',
  ticket: 'Support ticket',
  dispute: 'Dispute',
  announcement: 'Announcement',
  settings: 'Settings',
}

const columns: Column<AuditLogEntry>[] = [
  { key: 'at', header: 'When', render: (e) => <span className="text-xs whitespace-nowrap text-muted">{formatDateTime(e.at)}</span> },
  {
    key: 'action',
    header: 'Action',
    render: (e) => (
      <div className="min-w-0">
        <p className="font-medium text-fg">{e.action}</p>
        <p className="truncate text-xs text-subtle">{e.targetLabel}</p>
        {e.detail && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{e.detail}</p>}
      </div>
    ),
  },
  { key: 'type', header: 'Area', hideOnMobile: true, render: (e) => <Badge tone="neutral">{TYPES[e.targetType]}</Badge> },
  { key: 'actor', header: 'By', hideOnMobile: true, render: (e) => <span className="text-xs text-muted">{e.actor}</span> },
]

/** Read-only record of administrative actions. Entries can’t be edited or deleted. */
export function AdminAuditPage() {
  const { isDemo } = useViewer()
  const { data, loading, error, reload } = useAsync(() => services.audit.list(), 'audit')
  const [type, setType] = useState<'all' | AuditTargetType>('all')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data ?? []).filter((e) => (type === 'all' || e.targetType === type) && (!q || [e.action, e.targetLabel, e.detail ?? '', e.actor].some((t) => t.toLowerCase().includes(q))))
  }, [data, type, query])
  const pagination = usePagination(rows, 15, `${type}|${query}`)

  return (
    <>
      <PageHeader eyebrow={isDemo ? <DemoBadge /> : undefined} title="Audit logs" description="Every administrative action, newest first. Entries are written by the system and can’t be changed." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchBar value={query} onChange={setQuery} placeholder="Search actions, targets or people" className="sm:max-w-md sm:flex-1" label="Search audit log" />
        <Select
          aria-label="Area"
          options={[{ value: 'all', label: 'All areas' }, ...Object.entries(TYPES).map(([value, label]) => ({ value, label }))]}
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          containerClassName="sm:w-56"
        />
      </div>
      {error ? (
        <ErrorState description={error.message} onRetry={reload} />
      ) : (
        <>
          <DataTable caption="Audit log" columns={columns} rows={pagination.pageItems} rowKey={(e) => e.id} loading={loading} empty={<EmptyState compact icon={<History />} title="No matching entries" />} />
          {pagination.pageCount > 1 && (
            <Pagination className="mt-4" page={pagination.page} pageCount={pagination.pageCount} onPageChange={pagination.setPage} rangeStart={pagination.rangeStart} rangeEnd={pagination.rangeEnd} total={pagination.total} />
          )}
        </>
      )}
    </>
  )
}
