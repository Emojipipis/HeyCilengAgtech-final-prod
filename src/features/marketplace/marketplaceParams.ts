import { useLocation, useSearchParams } from 'react-router-dom'
import { CATEGORY_BY_ID } from '@/config/catalog'
import type { CategoryId } from '@/types/catalog'

/**
 * Reads `?q=` and `?category=` for a marketplace page, plus a key that changes when a new search
 * is launched from elsewhere (top bar, category links) so the browser remounts with those values.
 */
export function useMarketplaceParams() {
  const location = useLocation()
  const [params] = useSearchParams()
  const nonce = (location.state as { search?: number } | null)?.search ?? 0
  const category = params.get('category')
  const initialCategories: CategoryId[] = category && category in CATEGORY_BY_ID ? [category as CategoryId] : []
  return { key: `${nonce}|${category ?? ''}`, initialQuery: params.get('q') ?? '', initialCategories }
}
