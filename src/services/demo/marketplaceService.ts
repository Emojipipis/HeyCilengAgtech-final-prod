import { filterListings } from '@/lib/listingFilters'
import type { Listing, MarketplaceListing } from '@/types/listing'
import type { MarketplaceService } from '../types'
import { accountIsActive, demoDb } from './db'
import { copy, delay, notFound, ok } from './shared'

/** Only active listings, or sold-out ones for context, are visible to buyers. */
const isPublic = (listing: Listing) => (listing.status === 'active' || listing.status === 'sold_out') && accountIsActive(listing.sellerId)

export function withSeller(listing: Listing): MarketplaceListing {
  const seller = demoDb.sellers.find((s) => s.id === listing.sellerId)!
  return copy({ listing, seller })
}

export const demoMarketplaceService: MarketplaceService = {
  async listListings(filters) {
    await delay(350)
    const name = (id: string) => demoDb.sellers.find((s) => s.id === id)?.businessName ?? ''
    return ok(filterListings(demoDb.listings.filter(isPublic), filters, name).map(withSeller))
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
