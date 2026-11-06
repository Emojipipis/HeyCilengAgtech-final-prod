import type { CategoryId } from '@/types/catalog'
import type { ListingFilters } from '@/types/listing'

export interface FilterState {
  categories: CategoryId[]
  states: string[]
  minPrice: string
  maxPrice: string
  minQuantity: string
}

export const EMPTY_FILTERS: FilterState = { categories: [], states: [], minPrice: '', maxPrice: '', minQuantity: '' }

export function activeFilterCount(filters: FilterState) {
  return (
    filters.categories.length +
    filters.states.length +
    Number(Boolean(filters.minPrice)) +
    Number(Boolean(filters.maxPrice)) +
    Number(Boolean(filters.minQuantity))
  )
}

/** Converts the filter form into service filters, ignoring blank or invalid numbers. */
export function toListingFilters(filters: FilterState, query: string, sort: ListingFilters['sort']): ListingFilters {
  const num = (raw: string) => (raw.trim() === '' || Number.isNaN(Number(raw)) ? undefined : Number(raw))
  return {
    query: query.trim() || undefined,
    categories: filters.categories,
    states: filters.states,
    minPricePerKg: num(filters.minPrice),
    maxPricePerKg: num(filters.maxPrice),
    minQuantityKg: num(filters.minQuantity),
    sort,
  }
}
