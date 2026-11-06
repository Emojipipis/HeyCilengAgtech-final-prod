import { KG_PER_UNIT } from '@/config/catalog'
import type { Unit } from '@/types/catalog'
import type { Listing } from '@/types/listing'

/** Available = Listed − Reserved − Sold. Never negative. */
export function availableQuantity(listing: Pick<Listing, 'listedQuantity' | 'reservedQuantity' | 'soldQuantity'>) {
  return Math.max(0, listing.listedQuantity - listing.reservedQuantity - listing.soldQuantity)
}

export function convertQuantity(value: number, from: Unit, to: Unit) {
  return (value * KG_PER_UNIT[from]) / KG_PER_UNIT[to]
}

/** Price per `to` unit, given a price per `from` unit. */
export function convertUnitPrice(price: number, from: Unit, to: Unit) {
  return (price / KG_PER_UNIT[from]) * KG_PER_UNIT[to]
}
