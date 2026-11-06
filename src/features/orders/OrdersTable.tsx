import { CreditCard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ButtonLink } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/ui/Table'
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format'
import { isPayable } from '@/lib/payments'
import type { Order } from '@/types/order'
import type { ReactNode } from 'react'

interface OrdersTableProps {
  orders: Order[]
  basePath: string
  loading?: boolean
  empty?: ReactNode
  /** Which counterparty column to show. Buyers see the seller's business; sellers see the buyer's. */
  counterparty: 'seller' | 'buyer'
}

export function OrdersTable({ orders, basePath, loading, empty, counterparty }: OrdersTableProps) {
  const navigate = useNavigate()
  const columns: Column<Order>[] = [
    {
      key: 'reference',
      header: 'Order',
      render: (o) => (
        <div>
          <p className="font-semibold text-fg">{o.reference}</p>
          <p className="text-xs text-subtle">{formatDate(o.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'material',
      header: 'Material',
      render: (o) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">{o.listing.name}</p>
          <p className="truncate text-xs text-subtle">{counterparty === 'seller' ? o.listing.sellerBusinessName : o.buyerBusinessName}</p>
        </div>
      ),
    },
    { key: 'qty', header: 'Quantity', render: (o) => <span className="tabular-nums">{formatQuantity(o.quantity, o.listing.unit)}</span>, hideOnMobile: true },
    { key: 'value', header: 'Value', align: 'right', render: (o) => <span className="font-medium tabular-nums">{formatCurrency(o.subtotal)}</span>, hideOnMobile: true },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge kind="order" status={o.status} /> },
    // Buyers: a direct way into checkout for orders that are ready to pay.
    ...(counterparty === 'seller'
      ? [
          {
            key: 'pay',
            header: <span className="sr-only">Payment</span>,
            render: (o: Order) =>
              isPayable(o) ? (
                <ButtonLink to={`${basePath}/${o.id}`} size="sm" leftIcon={<CreditCard className="size-3.5" />}>
                  Pay now
                </ButtonLink>
              ) : null,
          } satisfies Column<Order>,
        ]
      : []),
  ]

  return (
    <DataTable
      caption="Orders"
      columns={columns}
      rows={orders}
      rowKey={(o) => o.id}
      loading={loading}
      empty={empty}
      onRowClick={(o) => navigate(`${basePath}/${o.id}`)}
    />
  )
}
