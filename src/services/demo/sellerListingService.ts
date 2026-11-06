import { formatQuantity } from '@/lib/format'
import type { Listing, ListingImageInput, ListingInput } from '@/types/listing'
import type { SellerListingService } from '../types'
import { demoActor } from './actor'
import { demoDb, nextId, nowISO } from './db'
import { copy, delay, invalid, notFound, ok } from './shared'

const mine = () => demoDb.listings.filter((l) => l.sellerId === demoActor.id)
const find = (id: string) => mine().find((l) => l.id === id)

/**
 * In demo mode a chosen file is shown through a temporary object URL in this tab only.
 * A real implementation uploads the file to storage and stores the returned public URL.
 */
function storeImages(images: ListingImageInput[]) {
  return images.map((image) => ({
    id: image.id,
    alt: image.alt,
    url: image.file ? URL.createObjectURL(image.file) : image.url,
  }))
}

function fromInput(input: ListingInput): Omit<Listing, 'id' | 'sellerId' | 'reservedQuantity' | 'soldQuantity' | 'status' | 'createdAt' | 'updatedAt'> {
  const { images, ...rest } = input
  return { ...rest, images: storeImages(images) }
}

export const demoSellerListingService: SellerListingService = {
  async listMine() {
    await delay(350)
    return ok(copy(mine().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))))
  },

  async get(id) {
    await delay(250)
    const listing = find(id)
    return listing ? ok(copy(listing)) : notFound('This listing')
  },

  async create(input) {
    await delay(700)
    const at = nowISO()
    const listing: Listing = {
      ...fromInput(input),
      id: nextId('demo-listing'),
      sellerId: demoActor.id,
      reservedQuantity: 0,
      soldQuantity: 0,
      // Goes live immediately only when HeyCileng has switched off listing review.
      status: demoDb.settings.marketplace.requireListingReview ? 'pending_review' : 'active',
      createdAt: at,
      updatedAt: at,
      isDemo: true,
    }
    demoDb.listings.push(listing)
    return ok(copy(listing))
  },

  async update(id, input) {
    await delay(700)
    const listing = find(id)
    if (!listing) return notFound('This listing')
    const committed = listing.reservedQuantity + listing.soldQuantity
    if (input.listedQuantity < committed) {
      return invalid(
        `Listed quantity can’t be less than ${formatQuantity(committed, listing.unit)} — the amount already reserved or sold.`,
      )
    }
    if (input.unit !== listing.unit && committed > 0) {
      return invalid('The unit can’t change once stock has been reserved or sold.')
    }
    Object.assign(listing, fromInput(input), { updatedAt: nowISO() })
    return ok(copy(listing))
  },

  async setPaused(id, paused) {
    await delay(350)
    const listing = find(id)
    if (!listing) return notFound('This listing')
    if (paused && listing.status !== 'active') return invalid('Only active listings can be paused.')
    if (!paused && listing.status !== 'paused') return invalid('Only paused listings can be resumed.')
    listing.status = paused ? 'paused' : 'active'
    listing.updatedAt = nowISO()
    return ok(copy(listing))
  },

  async remove(id) {
    await delay(450)
    const listing = find(id)
    if (!listing) return notFound('This listing')
    const openOrders = demoDb.orders.filter((o) => o.listingId === id && ['pending', 'accepted', 'processing', 'dispatched', 'ready_for_collection'].includes(o.status))
    if (listing.reservedQuantity > 0 || openOrders.length > 0) {
      return invalid(`This listing has ${openOrders.length} open order${openOrders.length === 1 ? '' : 's'}. Pause it instead, or contact HeyCileng support.`)
    }
    demoDb.listings = demoDb.listings.filter((l) => l.id !== id)
    demoDb.savedListingIds.delete(id)
    return ok(null)
  },
}
