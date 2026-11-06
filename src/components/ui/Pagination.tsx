import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface PaginationProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  /** "Showing x–y of z" summary. */
  rangeStart?: number
  rangeEnd?: number
  total?: number
  className?: string
}

function pageList(page: number, count: number): (number | 'gap')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const pages = new Set([1, count, page - 1, page, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b)
  const result: (number | 'gap')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('gap')
    result.push(p)
  })
  return result
}

export function Pagination({ page, pageCount, onPageChange, rangeStart, rangeEnd, total, className }: PaginationProps) {
  const buttonBase =
    'inline-flex size-9 items-center justify-center rounded-md border text-sm transition-colors disabled:pointer-events-none disabled:opacity-40'
  const navButton = cn(buttonBase, 'border-border bg-surface text-muted hover:bg-surface-sunken hover:text-fg')
  const currentButton = cn(buttonBase, 'border-primary bg-primary font-semibold text-primary-fg')

  return (
    <nav aria-label="Pagination" className={cn('flex flex-col items-center justify-between gap-3 sm:flex-row', className)}>
      {total !== undefined && (
        <p className="text-sm text-muted">
          {total === 0 ? (
            'No results'
          ) : (
            <>
              Showing <span className="font-medium text-fg tabular-nums">{rangeStart}</span>–
              <span className="font-medium text-fg tabular-nums">{rangeEnd}</span> of{' '}
              <span className="font-medium text-fg tabular-nums">{total}</span>
            </>
          )}
        </p>
      )}
      <div className="flex items-center gap-1">
        <button type="button" className={navButton} onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </button>
        {pageList(page, pageCount).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="px-1 text-subtle" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Page ${p}`}
              className={cn(p === page ? currentButton : navButton, 'tabular-nums')}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={navButton}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  )
}
