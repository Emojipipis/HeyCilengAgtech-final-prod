import type { ApplicationId, CategoryId, Location, QualityTag, Unit } from './catalog'
import type { ListingStatus } from './status'
import type { SellerPublicProfile } from './user'

export interface ListingImage {
  id: string
  /** Absent for demo listings — a generated illustration is shown instead. */
  url?: string
  alt: string
}

export interface Listing {
  id: string
  sellerId: string
  name: string
  category: CategoryId
  description: string
  unit: Unit
  /** Total quantity the seller listed. */
  listedQuantity: number
  /** Committed to accepted orders that aren't completed yet. */
  reservedQuantity: number
  soldQuantity: number
  minOrderQuantity: number
  /** Price per unit in the platform currency. */
  pricePerUnit: number
  location: Location
  qualityTags: QualityTag[]
  qualitySpecifications: string
  applications: ApplicationId[]
  images: ListingImage[]
  status: ListingStatus
  /** Reason shared with the seller when HeyCileng rejects or suspends the listing. */
  reviewNote?: string
  createdAt: string
  updatedAt: string
  isDemo?: boolean
}

export interface ListingFilters {
  query?: string
  categories?: CategoryId[]
  states?: string[]
  /** Price bounds per tonne, so listings sold by kg, tonne or bag compare fairly. */
  minPricePerTonne?: number
  maxPricePerTonne?: number
  /** Minimum available quantity, in tonnes. */
  minQuantityTonnes?: number
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'quantity_desc'
}

/** A listing with the seller's public business profile (never private contact details). */
export interface MarketplaceListing {
  listing: Listing
  seller: SellerPublicProfile
}

/** An image in the listing form: an existing image (url) or a newly chosen file awaiting upload. */
export interface ListingImageInput {
  id: string
  url?: string
  file?: File
  alt: string
}

export type ListingInput = Pick<
  Listing,
  | 'name'
  | 'category'
  | 'description'
  | 'unit'
  | 'listedQuantity'
  | 'minOrderQuantity'
  | 'pricePerUnit'
  | 'location'
  | 'qualityTags'
  | 'qualitySpecifications'
  | 'applications'
> & { images: ListingImageInput[] }
