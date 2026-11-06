import type { Listing } from '@/types/listing'
import { availableQuantity, convertQuantity } from './inventory'

export interface StockTotals {
  listed: number
  reserved: number
  sold: number
  available: number
}

/** Sums stock across listings in kg, so kg, tonne and bag listings add up fairly. */
export function stockTotalsInKg(listings: Listing[]): StockTotals {
  const t = (value: number, listing: Listing) => convertQuantity(value, listing.unit, 'kg')
  return listings.reduce<StockTotals>(
    (acc, l) => ({
      listed: acc.listed + t(l.listedQuantity, l),
      reserved: acc.reserved + t(l.reservedQuantity, l),
      sold: acc.sold + t(l.soldQuantity, l),
      available: acc.available + t(availableQuantity(l), l),
    }),
    { listed: 0, reserved: 0, sold: 0, available: 0 },
  )
}

export const formatKg = (value: number) => `${Math.round(value).toLocaleString('en-NG')} kg`
