import { Ellipsis, Pencil, Plus, Power, Truck } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { Dropdown } from '@/components/ui/Dropdown'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/ui/Table'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { stateName } from '@/config/locations'
import { PartnerFormModal } from '@/features/logistics/PartnerFormModal'
import { useAsync } from '@/hooks/useAsync'
import { useViewer } from '@/hooks/useSession'
import { useToast } from '@/hooks/useToast'
import { formatDate, formatQuantity } from '@/lib/format'
import { services } from '@/services'
import type { LogisticsPartner, LogisticsPartnerInput } from '@/types/logistics'
import type { Order } from '@/types/order'

type TabValue = 'deliveries' | 'partners'
const TAB_PREFIX = 'logistics'

interface Lane {
  key: string
  title: string
  hint: string
  tone: 'warning' | 'info' | 'danger' | 'success' | 'neutral'
  orders: Order[]
}

function laneFor(order: Order): Lane['key'] | null {
  if (['completed', 'cancelled', 'declined', 'pending'].includes(order.status)) return null
  if (order.status === 'delivery_failed') return 'failed'
  if (!order.delivery?.partnerId) return 'unassigned'
  if (order.delivery.status === 'in_transit') return 'in_transit'
  return 'scheduled'
}

function OrderRow({ order }: { order: Order }) {
  return (
    <li>
      <Link to={`/admin/orders/${order.id}`} className="block rounded-lg border border-border bg-surface p-3 transition-colors hover:border-border-strong">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{order.reference}</p>
          {order.delivery && <StatusBadge kind="delivery" status={order.delivery.status} />}
        </div>
        <p className="mt-1 truncate text-xs text-muted">
          {order.listing.name} · {formatQuantity(order.quantity, order.listing.unit)}
        </p>
        <p className="mt-0.5 truncate text-xs text-subtle">
          {order.listing.sellerLocation.area}, {stateName(order.listing.sellerLocation.state)} → {order.buyerBusinessName}
        </p>
        {order.delivery?.partnerName && (
          <p className="mt-1.5 truncate text-xs text-subtle">
            {order.delivery.partnerName}
            {order.delivery.estimatedDate && ` · ETA ${formatDate(order.delivery.estimatedDate)}`}
          </p>
        )}
      </Link>
    </li>
  )
}

function DeliveryBoard({ orders }: { orders: Order[] }) {
  const lanes: Lane[] = [
    { key: 'unassigned', title: 'Needs a partner', hint: 'Accepted delivery orders without logistics', tone: 'warning', orders: [] },
    { key: 'failed', title: 'Failed deliveries', hint: 'Reschedule or cancel', tone: 'danger', orders: [] },
    { key: 'scheduled', title: 'Assigned & scheduled', hint: 'Waiting for pickup', tone: 'info', orders: [] },
    { key: 'in_transit', title: 'In transit', hint: 'Confirm delivery on arrival', tone: 'info', orders: [] },
  ]
  orders.forEach((o) => {
    const key = laneFor(o)
    lanes.find((l) => l.key === key)?.orders.push(o)
  })

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {lanes.map((lane) => (
        <section key={lane.key} aria-labelledby={`lane-${lane.key}`} className="rounded-xl border border-border bg-surface-muted p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 id={`lane-${lane.key}`} className="font-sans text-sm font-semibold">
              {lane.title}
            </h2>
            <Badge tone={lane.orders.length ? lane.tone : 'neutral'}>{lane.orders.length}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-subtle">{lane.hint}</p>
          {lane.orders.length === 0 ? (
            <p className="mt-4 rounded-lg border border-dashed border-border-strong p-4 text-center text-xs text-subtle">Nothing here</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {lane.orders.map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}

export function AdminLogisticsPage() {
  const { isDemo } = useViewer()
  const { toast } = useToast()
  const [tab, setTab] = useState<TabValue>('deliveries')
  const orders = useAsync(() => services.adminOrders.listAll(), 'admin-orders')
  const partners = useAsync(() => services.logistics.listPartners(), 'partners')
  const [editing, setEditing] = useState<LogisticsPartner | undefined>()
  const [formOpen, setFormOpen] = useState(false)

  const activeDeliveries = (id: string) =>
    (orders.data ?? []).filter((o) => o.delivery?.partnerId === id && ['assigned', 'scheduled', 'in_transit', 'failed'].includes(o.delivery.status)).length

  const savePartner = async (input: LogisticsPartnerInput) => {
    const result = editing ? await services.logistics.updatePartner(editing.id, input) : await services.logistics.createPartner(input)
    if (!result.ok) return result
    partners.setData((list) => (editing ? (list ?? []).map((p) => (p.id === result.data.id ? result.data : p)) : [...(list ?? []), result.data]))
    toast({ tone: 'success', title: editing ? 'Partner updated' : 'Partner added' })
    return { ok: true as const }
  }

  const toggleStatus = async (partner: LogisticsPartner) => {
    const next = partner.status === 'active' ? 'inactive' : 'active'
    const result = await services.logistics.setPartnerStatus(partner.id, next)
    if (result.ok) {
      partners.setData((list) => (list ?? []).map((p) => (p.id === partner.id ? result.data : p)))
      toast({ tone: 'success', title: next === 'active' ? 'Partner activated' : 'Partner deactivated', description: next === 'inactive' ? 'Existing deliveries continue; no new assignments.' : undefined })
    } else {
      toast({ tone: 'error', title: 'Couldn’t update partner', description: result.error.message })
    }
  }

  const columns: Column<LogisticsPartner>[] = [
    {
      key: 'name',
      header: 'Partner',
      render: (p) => (
        <div>
          <p className="font-semibold text-fg">{p.name}</p>
          <p className="text-xs text-subtle">{p.vehicleTypes || '—'}</p>
        </div>
      ),
    },
    { key: 'coverage', header: 'Coverage', hideOnMobile: true, render: (p) => <span className="text-xs text-muted">{p.coverageStates.map(stateName).join(', ')}</span> },
    {
      key: 'contact',
      header: 'Contact (internal)',
      hideOnMobile: true,
      render: (p) => (
        <div className="text-xs">
          <p className="text-fg">{p.contactName || '—'}</p>
          <p className="text-subtle">{p.contactPhone}</p>
        </div>
      ),
    },
    { key: 'active', header: 'Open deliveries', align: 'right', render: (p) => <span className="tabular-nums">{activeDeliveries(p.id)}</span> },
    { key: 'status', header: 'Status', render: (p) => <Badge tone={p.status === 'active' ? 'success' : 'neutral'} dot>{p.status === 'active' ? 'Active' : 'Inactive'}</Badge> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      render: (p) => (
        <Dropdown
          items={[
            { key: 'edit', label: 'Edit partner', icon: <Pencil />, onSelect: () => { setEditing(p); setFormOpen(true) } },
            { key: 'status', label: p.status === 'active' ? 'Deactivate' : 'Activate', icon: <Power />, tone: p.status === 'active' ? 'danger' : 'default', onSelect: () => void toggleStatus(p) },
          ]}
          trigger={(props) => (
            <button {...props} type="button" aria-label={`Actions for ${p.name}`} className="inline-flex size-8 items-center justify-center rounded-md text-subtle hover:bg-surface-sunken hover:text-fg">
              <Ellipsis className="size-4.5" />
            </button>
          )}
        />
      ),
    },
  ]

  let content: ReactNode
  if (tab === 'deliveries') {
    content = orders.loading ? (
      <Skeleton className="h-96 w-full rounded-xl" />
    ) : orders.error ? (
      <ErrorState description={orders.error.message} onRetry={orders.reload} />
    ) : (
      <DeliveryBoard orders={orders.data ?? []} />
    )
  } else {
    content = partners.error ? (
      <ErrorState description={partners.error.message} onRetry={partners.reload} />
    ) : (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Only active partners can be assigned new deliveries.</p>
          <Button size="sm" leftIcon={<Plus className="size-4" />} onClick={() => { setEditing(undefined); setFormOpen(true) }}>
            Add partner
          </Button>
        </div>
        <DataTable caption="Logistics partners" columns={columns} rows={partners.data ?? []} rowKey={(p) => p.id} loading={partners.loading} />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={isDemo ? <DemoBadge label="Placeholder partners — not real logistics companies" /> : undefined}
        title="Logistics"
        description="HeyCileng assigns a logistics partner to every order and tracks it from pickup at the seller to delivery at the buyer. Buyers and sellers see the partner name, fee and status only."
      />
      <Tabs
        label="Logistics views"
        idPrefix={TAB_PREFIX}
        value={tab}
        onChange={setTab}
        className="mb-6"
        items={[
          { value: 'deliveries', label: 'Deliveries', icon: <Truck /> },
          { value: 'partners', label: 'Partners', count: partners.data?.length },
        ]}
      />
      <TabPanel idPrefix={TAB_PREFIX} value={tab} key={tab}>
        {content}
      </TabPanel>

      <PartnerFormModal open={formOpen} partner={editing} onClose={() => setFormOpen(false)} onSubmit={savePartner} />
    </>
  )
}
