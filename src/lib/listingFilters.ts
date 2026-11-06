import type { Listing, ListingFilters } from '@/types/listing'
import { availableQuantity, convertQuantity, convertUnitPrice } from './inventory'

const perKg = (l: Listing) => convertUnitPrice(l.pricePerUnit, l.unit, 'kg')
const kgAvailable = (l: Listing) => convertQuantity(availableQuantity(l), l.unit, 'kg')

/**
 * Applies marketplace search, filters and sort. Prices and quantities compare per kg so listings in
 * kg, tonnes and bags rank fairly. Sold-out listings sink to the bottom.
 */
export function filterListings(listings: Listing[], filters: ListingFilters, sellerName: (sellerId: string) => string) {
  const query = filters.query?.trim().toLowerCase()
  const rows = listings.filter((listing) => {
    if (query && ![listing.name, listing.description, sellerName(listing.sellerId)].some((text) => text.toLowerCase().includes(query))) return false
    if (filters.categories?.length && !filters.categories.includes(listing.category)) return false
    if (filters.states?.length && !filters.states.includes(listing.location.state)) return false
    if (filters.minPricePerKg !== undefined && perKg(listing) < filters.minPricePerKg) return false
    if (filters.maxPricePerKg !== undefined && perKg(listing) > filters.maxPricePerKg) return false
    if (filters.minQuantityKg !== undefined && kgAvailable(listing) < filters.minQuantityKg) return false
    return true
  })
  const sorters: Record<NonNullable<ListingFilters['sort']>, (a: Listing, b: Listing) => number> = {
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    price_asc: (a, b) => perKg(a) - perKg(b),
    price_desc: (a, b) => perKg(b) - perKg(a),
    quantity_desc: (a, b) => kgAvailable(b) - kgAvailable(a),
  }
  return [...rows]
    .sort(sorters[filters.sort ?? 'newest'])
    .sort((a, b) => Number(availableQuantity(a) === 0) - Number(availableQuantity(b) === 0))
}
