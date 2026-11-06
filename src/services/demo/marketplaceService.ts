import { availableQuantity, convertQuantity, convertUnitPrice } from '@/lib/inventory'
import type { Listing, MarketplaceListing } from '@/types/listing'
import type { MarketplaceService } from '../types'
import { accountIsActive, demoDb } from './db'
import { copy, delay, notFound, ok } from './shared'

/** Only active listings, or sold-out ones for context, are visible to buyers. */
const isPublic = (listing: Listing) => (listing.status === 'active' || listing.status === 'sold_out') && accountIsActive(listing.sellerId)

const perTonne = (l: Listing) => convertUnitPrice(l.pricePerUnit, l.unit, 'tonne')
const tonnesAvailable = (l: Listing) => convertQuantity(availableQuantity(l), l.unit, 'tonne')

export function withSeller(listing: Listing): MarketplaceListing {
  const seller = demoDb.sellers.find((s) => s.id === listing.sellerId)!
  return copy({ listing, seller })
}

export const demoMarketplaceService: MarketplaceService = {
  async listListings(filters) {
    await delay(350)
    const query = filters.query?.trim().toLowerCase()
    let rows = demoDb.listings.filter(isPublic).filter((listing) => {
      const seller = demoDb.sellers.find((s) => s.id === listing.sellerId)
      if (query && ![listing.name, listing.description, seller?.businessName ?? ''].some((text) => text.toLowerCase().includes(query))) return false
      if (filters.categories?.length && !filters.categories.includes(listing.category)) return false
      if (filters.states?.length && !filters.states.includes(listing.location.state)) return false
      if (filters.minPricePerTonne !== undefined && perTonne(listing) < filters.minPricePerTonne) return false
      if (filters.maxPricePerTonne !== undefined && perTonne(listing) > filters.maxPricePerTonne) return false
      if (filters.minQuantityTonnes !== undefined && tonnesAvailable(listing) < filters.minQuantityTonnes) return false
      return true
    })
    const sorters: Record<NonNullable<typeof filters.sort>, (a: Listing, b: Listing) => number> = {
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      price_asc: (a, b) => perTonne(a) - perTonne(b),
      price_desc: (a, b) => perTonne(b) - perTonne(a),
      quantity_desc: (a, b) => tonnesAvailable(b) - tonnesAvailable(a),
    }
    rows = [...rows].sort(sorters[filters.sort ?? 'newest'])
    // Sold-out listings sink to the bottom.
    rows.sort((a, b) => Number(availableQuantity(a) === 0) - Number(availableQuantity(b) === 0))
    return ok(rows.map(withSeller))
  },

  async getListing(id) {
    await delay(300)
    const listing = demoDb.listings.find((l) => l.id === id && isPublic(l))
    return listing ? ok(withSeller(listing)) : notFound('This listing')
  },

  async listSaved() {
    await delay(300)
    return ok(demoDb.listings.filter((l) => demoDb.savedListingIds.has(l.id) && isPublic(l)).map(withSeller))
  },

  async savedIds() {
    return ok([...demoDb.savedListingIds])
  },

  async setSaved(listingId, saved) {
    await delay(150)
    if (saved) demoDb.savedListingIds.add(listingId)
    else demoDb.savedListingIds.delete(listingId)
    return ok({ saved })
  },
}
