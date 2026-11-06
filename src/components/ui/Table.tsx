import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Skeleton } from './States'

export interface Column<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  /** Hide below the md breakpoint to keep small screens readable. */
  hideOnMobile?: boolean
  className?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  caption?: string
  loading?: boolean
  /** Rendered in place of the body when there are no rows. */
  empty?: ReactNode
  onRowClick?: (row: T) => void
  className?: string
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' }

/** Responsive data table — scrolls horizontally on narrow screens, optional low-priority columns hide on mobile. */
export function DataTable<T>({ columns, rows, rowKey, caption, loading, empty, onRowClick, className }: DataTableProps<T>) {
  const cell = (col: Column<T>) => cn(alignClass[col.align ?? 'left'], col.hideOnMobile && 'hidden md:table-cell', col.className)

  return (
    // `relative` makes the scroller the containing block for absolutely positioned content (e.g. sr-only labels),
    // so it's clipped instead of widening the page.
    <div className={cn('relative overflow-x-auto rounded-xl border border-border bg-surface', className)}>
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-border bg-surface-muted">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn('px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-subtle uppercase', cell(col))}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 4 }, (_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3.5', cell(col))}>
                    <Skeleton className="h-4 w-full max-w-32" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={
                  onRowClick
                    ? (event) => {
                        // Buttons, links and menus inside a row act on their own, not as a row click.
                        if ((event.target as HTMLElement).closest('button, a, input, select, textarea, [role="menu"]')) return
                        onRowClick(row)
                      }
                    : undefined
                }
                className={cn(
                  'border-b border-border transition-colors last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-surface-muted',
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3.5 align-middle', cell(col))}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
