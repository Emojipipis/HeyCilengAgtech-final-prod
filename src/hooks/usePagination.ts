import { useCallback, useMemo, useState } from 'react'

/**
 * Client-side pagination over an in-memory list.
 * The page clamps when the list shrinks, and returns to page 1 whenever `resetKey` changes (e.g. new filters).
 */
export function usePagination<T>(items: T[], pageSize = 10, resetKey = '') {
  const [state, setState] = useState({ key: resetKey, page: 1 })
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const requested = state.key === resetKey ? state.page : 1
  const page = Math.min(requested, pageCount)

  const pageItems = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize])
  const setPage = useCallback((next: number) => setState({ key: resetKey, page: next }), [resetKey])

  return {
    page,
    pageCount,
    pageSize,
    pageItems,
    total: items.length,
    setPage,
    rangeStart: items.length === 0 ? 0 : (page - 1) * pageSize + 1,
    rangeEnd: Math.min(page * pageSize, items.length),
  }
}
