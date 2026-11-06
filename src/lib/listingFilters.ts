import type { Listing, ListingFilters } from '@/types/listing'
import { availableQuantity, convertQuantity, convertUnitPrice } from './inventory'

const perTonne = (l: Listing) => convertUnitPrice(l.pricePerUnit, l.unit, 'tonne')
const tonnesAvailable = (l: Listing) => convertQuantity(availableQuantity(l), l.unit, 'tonne')

/**
 * Applies marketplace search, filters and sort. Prices and quantities compare per tonne so listings in
 * kg, tonnes and bags rank fairly. Sold-out listings sink to the bottom.
 */
export function filterListings(listings: Listing[], filters: ListingFilters, sellerName: (sellerId: string) => string) {
  const query = filters.query?.trim().toLowerCase()
  const rows = listings.filter((listing) => {
    if (query && ![listing.name, listing.description, sellerName(listing.sellerId)].some((text) => text.toLowerCase().includes(query))) return false
    if (filters.categories?.length && !filters.categories.includes(listing.category)) return false
    if (filters.states?.length && !filters.states.includes(listing.location.state)) return false
    if (filters.minPricePerTonne !== undefined && perTonne(listing) < filters.minPricePerTonne) return false
    if (filters.maxPricePerTonne !== undefined && perTonne(listing) > filters.maxPricePerTonne) return false
    if (filters.minQuantityTonnes !== undefined && tonnesAvailable(listing) < filters.minQuantityTonnes) return false
    return true
  })
  const sorters: Record<NonNullable<ListingFilters['sort']>, (a: Listing, b: Listing) => number> = {
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    price_asc: (a, b) => perTonne(a) - perTonne(b),
    price_desc: (a, b) => perTonne(b) - perTonne(a),
    quantity_desc: (a, b) => tonnesAvailable(b) - tonnesAvailable(a),
  }
  return [...rows]
    .sort(sorters[filters.sort ?? 'newest'])
    .sort((a, b) => Number(availableQuantity(a) === 0) - Number(availableQuantity(b) === 0))
}
