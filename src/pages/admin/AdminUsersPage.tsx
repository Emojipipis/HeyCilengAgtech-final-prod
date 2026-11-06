import { Ellipsis, Eye, Power, UserX, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { Dropdown } from '@/components/ui/Dropdown'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { Select } from '@/components/ui/Select'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/ui/Table'
import { Textarea } from '@/components/ui/Textarea'
import { stateName } from '@/config/locations'
import { useAsync } from '@/hooks/useAsync'
import { usePagination } from '@/hooks/usePagination'
import { useViewer } from '@/hooks/useSession'
import { useToast } from '@/hooks/useToast'
import { formatDate, formatRelative } from '@/lib/format'
import { services, type ServiceError } from '@/services'
import type { AdminUserRecord } from '@/types/admin'
import type { AccountStatus } from '@/types/status'

const TITLES = {
  all: { title: 'Users', description: 'Every account on HeyCileng. Contact details are visible to HeyCileng staff only.' },
  seller: { title: 'Sellers', description: 'Farms, cooperatives and agro-processors selling by-products.' },
  buyer: { title: 'Buyers', description: 'Businesses sourcing agricultural by-products.' },
}

const ROLE_TONE = { buyer: 'accent', seller: 'brand', admin: 'neutral' } as const

/** User management. `role` narrows to sellers or buyers for those nav entries. */
export function AdminUsersPage({ role = 'all' }: { role?: 'all' | 'buyer' | 'seller' }) {
  const { isDemo } = useViewer()
  const { toast } = useToast()
  const { data, loading, error, reload, setData } = useAsync(() => services.adminUsers.list(), 'admin-users')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'buyer' | 'seller' | 'admin'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all')
  const [viewing, setViewing] = useState<AdminUserRecord | null>(null)
  const [changing, setChanging] = useState<AdminUserRecord | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<ServiceError | null>(null)

  const effectiveRole = role === 'all' ? roleFilter : role
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data ?? []).filter(
      (u) =>
        (effectiveRole === 'all' || u.role === effectiveRole) &&
        (statusFilter === 'all' || u.status === statusFilter) &&
        (!q || [u.fullName, u.businessName, u.email, u.phone].some((t) => t.toLowerCase().includes(q))),
    )
  }, [data, effectiveRole, statusFilter, query])
  const pagination = usePagination(rows, 10, `${effectiveRole}|${statusFilter}|${query}`)

  const openChange = (u: AdminUserRecord) => {
    setReason('')
    setActionError(null)
    setChanging(u)
  }

  const applyChange = async () => {
    if (!changing) return
    const next = changing.status === 'suspended' ? 'active' : 'suspended'
    setBusy(true)
    const result = await services.adminUsers.setStatus(changing.id, next, reason)
    setBusy(false)
    if (!result.ok) {
      setActionError(result.error)
      return
    }
    setData((list) => (list ?? []).map((u) => (u.id === result.data.id ? result.data : u)))
    toast({ tone: 'success', title: next === 'suspended' ? 'Account suspended' : 'Account reactivated', description: `${result.data.businessName} has been notified.` })
    setChanging(null)
  }

  const columns: Column<AdminUserRecord>[] = [
    {
      key: 'name',
      header: 'Account',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.fullName} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-fg">{u.businessName}</p>
            <p className="truncate text-xs text-subtle">{u.fullName}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Type', render: (u) => <Badge tone={ROLE_TONE[u.role]}>{u.role === 'admin' ? 'Admin' : u.role === 'seller' ? 'Seller' : 'Buyer'}</Badge> },
    { key: 'location', header: 'Location', hideOnMobile: true, render: (u) => <span className="text-xs text-muted">{u.location.area}, {stateName(u.location.state)}</span> },
    { key: 'joined', header: 'Joined', hideOnMobile: true, render: (u) => <span className="text-xs text-muted">{formatDate(u.createdAt)}</span> },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge kind="account" status={u.status} /> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      render: (u) => (
        <Dropdown
          items={[
            { key: 'view', label: 'View details', icon: <Eye />, onSelect: () => setViewing(u) },
            ...(u.role === 'admin'
              ? []
              : [
                  u.status === 'suspended'
                    ? { key: 'reactivate', label: 'Reactivate account', icon: <Power />, onSelect: () => openChange(u) }
                    : { key: 'suspend', label: 'Suspend account', icon: <UserX />, tone: 'danger' as const, onSelect: () => openChange(u) },
                ]),
          ]}
          trigger={(props) => (
            <button {...props} type="button" aria-label={`Actions for ${u.businessName}`} className="inline-flex size-8 items-center justify-center rounded-md text-subtle hover:bg-surface-sunken hover:text-fg">
              <Ellipsis className="size-4.5" />
            </button>
          )}
        />
      ),
    },
  ]

  const suspending = changing?.status !== 'suspended'

  return (
    <>
      <PageHeader eyebrow={isDemo ? <DemoBadge /> : undefined} title={TITLES[role].title} description={TITLES[role].description} />

      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <SearchBar value={query} onChange={setQuery} placeholder="Search name, business, email or phone" className="md:max-w-md md:flex-1" label="Search users" />
        {role === 'all' && (
          <Select
            aria-label="Account type"
            options={[
              { value: 'all', label: 'All account types' },
              { value: 'seller', label: 'Sellers' },
              { value: 'buyer', label: 'Buyers' },
              { value: 'admin', label: 'Administrators' },
            ]}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            containerClassName="md:w-52"
          />
        )}
        <Select
          aria-label="Status"
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'pending_verification', label: 'Pending verification' },
            { value: 'suspended', label: 'Suspended' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          containerClassName="md:w-52"
        />
      </div>

      {error ? (
        <ErrorState description={error.message} onRetry={reload} />
      ) : (
        <>
          <DataTable
            caption={TITLES[role].title}
            columns={columns}
            rows={pagination.pageItems}
            rowKey={(u) => u.id}
            loading={loading}
            onRowClick={setViewing}
            empty={<EmptyState compact icon={<Users />} title="No accounts match" />}
          />
          {pagination.pageCount > 1 && (
            <Pagination className="mt-4" page={pagination.page} pageCount={pagination.pageCount} onPageChange={pagination.setPage} rangeStart={pagination.rangeStart} rangeEnd={pagination.rangeEnd} total={pagination.total} />
          )}
        </>
      )}

      <Modal open={viewing !== null} onClose={() => setViewing(null)} title={viewing?.businessName} description="Account details — internal to HeyCileng.">
        {viewing && (
          <div className="space-y-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                ['Account holder', viewing.fullName],
                ['Type', viewing.role === 'admin' ? 'Administrator' : viewing.role === 'seller' ? 'Seller' : 'Buyer'],
                ['Email', viewing.email],
                ['Phone', viewing.phone],
                ['Location', `${viewing.location.area}, ${stateName(viewing.location.state)}`],
                ['Email verified', viewing.emailVerified ? 'Yes' : 'No'],
                ['Joined', formatDate(viewing.createdAt)],
                ['Last active', formatRelative(viewing.lastActiveAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-subtle">{label}</dt>
                  <dd className="mt-0.5 text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <StatusBadge kind="account" status={viewing.status} size="md" />
            {viewing.suspensionReason && <Alert tone="warning" title="Suspension reason">{viewing.suspensionReason}</Alert>}
            <p className="text-xs text-subtle">Never share these contact details with other buyers or sellers.</p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={changing !== null}
        onClose={() => setChanging(null)}
        onConfirm={() => void applyChange()}
        tone={suspending ? 'danger' : 'default'}
        title={suspending ? `Suspend ${changing?.businessName}?` : `Reactivate ${changing?.businessName}?`}
        description={
          suspending
            ? changing?.role === 'seller'
              ? 'They can’t sign in to trade and their listings are hidden from the marketplace. Existing orders stay visible to HeyCileng.'
              : 'They can’t sign in to trade. Existing orders stay visible to HeyCileng.'
            : 'They can use HeyCileng again and any listings return to the marketplace.'
        }
        confirmLabel={suspending ? 'Suspend account' : 'Reactivate'}
        loading={busy}
      >
        <Textarea label={suspending ? 'Reason (shared with the user)' : 'Note (optional)'} required={suspending} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        {actionError && <Alert tone="error" className="mt-3">{actionError.message}</Alert>}
      </ConfirmDialog>
    </>
  )
}
