import type { AdminUserRecord } from '@/types/admin'
import type { ApplicationId, CategoryId, QualityTag, Unit } from '@/types/catalog'
import type { Listing, ListingImage } from '@/types/listing'
import type { Delivery, Order, OrderEvent } from '@/types/order'
import type { Requirement } from '@/types/requirement'
import type { AccountStatus, ListingStatus, OrderStatus, RequirementStatus } from '@/types/status'
import type { SellerPublicProfile, User } from '@/types/user'

/** Database row shapes (snake_case) and their mappings to the app's domain types. */

export interface ProfileRow {
  id: string
  role: User['role']
  email: string
  full_name: string
  phone: string
  business_name: string
  state: string
  area: string
  industry: string
  description: string
  status: AccountStatus
  suspension_reason: string | null
  verified: boolean
  created_at: string
  updated_at: string
  last_active_at: string
}

export interface ListingRow {
  id: string
  seller_id: string
  name: string
  category: CategoryId
  description: string
  unit: Unit
  listed_quantity: number
  reserved_quantity: number
  sold_quantity: number
  min_order_quantity: number
  price_per_unit: number
  state: string
  area: string
  quality_tags: QualityTag[]
  quality_specifications: string
  applications: ApplicationId[]
  images: ListingImage[]
  status: ListingStatus
  review_note: string | null
  created_at: string
  updated_at: string
}

export interface SellerPublicRow {
  id: string
  business_name: string
  state: string
  area: string
  description: string
  member_since: string
  verified: boolean
}

export interface RequirementRow {
  id: string
  buyer_id?: string
  title: string
  category: CategoryId
  quantity: number
  unit: Unit
  budget_min: number | null
  budget_max: number
  preferred_location: string
  max_delivery_distance_km: number
  intended_application: ApplicationId
  quality_requirements: QualityTag[]
  quality_specifications: string
  additional_specifications: string
  expires_at: string
  status: RequirementStatus
  created_at: string
}

export interface OrderRow {
  id: string
  reference: string
  listing_id: string
  listing: Order['listing']
  buyer_id: string
  buyer_business_name: string
  seller_id: string
  quantity: number
  subtotal: number
  fulfilment: Order['fulfilment']
  delivery_address?: string | null
  preferred_date: string | null
  buyer_note?: string | null
  status: OrderStatus
  delivery: Delivery | null
  created_at: string
  updated_at: string
  payment_status: Order['payment']['status']
  paid_at: string | null
  amount_paid?: number | null
  commission_rate: number | null
  payout_status: Order['payment']['payoutStatus']
  payout_reference: string | null
  payout_paid_at: string | null
}

export interface OrderEventRow {
  id: string
  order_id: string
  at: string
  status: OrderStatus | null
  title: string
  description: string | null
  actor: OrderEvent['actor']
}

const num = (v: number | string) => Number(v)

export function toUser(p: ProfileRow): User {
  return {
    id: p.id,
    role: p.role,
    fullName: p.full_name || p.email,
    email: p.email,
    phone: p.phone,
    status: p.status,
    emailVerified: true,
    createdAt: p.created_at,
  }
}

export function toListing(r: ListingRow): Listing {
  return {
    id: r.id,
    sellerId: r.seller_id,
    name: r.name,
    category: r.category,
    description: r.description,
    unit: r.unit,
    listedQuantity: num(r.listed_quantity),
    reservedQuantity: num(r.reserved_quantity),
    soldQuantity: num(r.sold_quantity),
    minOrderQuantity: num(r.min_order_quantity),
    pricePerUnit: num(r.price_per_unit),
    location: { state: r.state, area: r.area },
    qualityTags: r.quality_tags ?? [],
    qualitySpecifications: r.quality_specifications,
    applications: r.applications ?? [],
    images: r.images ?? [],
    status: r.status,
    reviewNote: r.review_note ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function toSellerPublic(r: SellerPublicRow): SellerPublicProfile {
  return {
    id: r.id,
    businessName: r.business_name,
    location: { state: r.state, area: r.area },
    description: r.description,
    memberSince: r.member_since,
    verified: r.verified,
  }
}

/** Admin view of a seller from their full profile (also covers suspended sellers). */
export function profileToSellerPublic(p: ProfileRow): SellerPublicProfile {
  return {
    id: p.id,
    businessName: p.business_name || p.full_name,
    location: { state: p.state, area: p.area },
    description: p.description,
    memberSince: p.created_at.slice(0, 10),
    verified: p.verified,
  }
}

export function toRequirement(r: RequirementRow): Requirement {
  return {
    id: r.id,
    buyerId: r.buyer_id ?? 'hidden',
    title: r.title,
    category: r.category,
    quantity: num(r.quantity),
    unit: r.unit,
    budgetMin: r.budget_min === null ? undefined : num(r.budget_min),
    budgetMax: num(r.budget_max),
    preferredLocation: r.preferred_location,
    maxDeliveryDistanceKm: r.max_delivery_distance_km,
    intendedApplication: r.intended_application,
    qualityRequirements: r.quality_requirements ?? [],
    qualitySpecifications: r.quality_specifications,
    additionalSpecifications: r.additional_specifications,
    expiresAt: r.expires_at,
    status: r.status,
    createdAt: r.created_at,
  }
}

export function toRequirementRow(input: Omit<Requirement, 'id' | 'buyerId' | 'status' | 'createdAt' | 'isDemo'>) {
  return {
    title: input.title,
    category: input.category,
    quantity: input.quantity,
    unit: input.unit,
    budget_min: input.budgetMin ?? null,
    budget_max: input.budgetMax,
    preferred_location: input.preferredLocation,
    max_delivery_distance_km: input.maxDeliveryDistanceKm,
    intended_application: input.intendedApplication,
    quality_requirements: input.qualityRequirements,
    quality_specifications: input.qualitySpecifications,
    additional_specifications: input.additionalSpecifications,
    expires_at: input.expiresAt,
  }
}

export function toOrder(r: OrderRow, events: OrderEventRow[]): Order {
  return {
    id: r.id,
    reference: r.reference,
    listingId: r.listing_id,
    listing: { ...r.listing, pricePerUnit: num(r.listing.pricePerUnit) },
    buyerId: r.buyer_id,
    buyerBusinessName: r.buyer_business_name,
    sellerId: r.seller_id,
    quantity: num(r.quantity),
    subtotal: num(r.subtotal),
    fulfilment: r.fulfilment,
    deliveryAddress: r.delivery_address ?? undefined,
    preferredDate: r.preferred_date ?? undefined,
    buyerNote: r.buyer_note ?? undefined,
    status: r.status,
    delivery: r.delivery ? { ...r.delivery, fee: r.delivery.fee === undefined || r.delivery.fee === null ? undefined : num(r.delivery.fee), history: r.delivery.history ?? [] } : null,
    payment: {
      status: r.payment_status,
      paidAt: r.paid_at ?? undefined,
      amountPaid: r.amount_paid ?? undefined,
      commissionRate: r.commission_rate ?? undefined,
      payoutStatus: r.payout_status,
      payoutReference: r.payout_reference ?? undefined,
      payoutPaidAt: r.payout_paid_at ?? undefined,
    },
    timeline: events
      .filter((e) => e.order_id === r.id)
      .map((e) => ({ id: e.id, at: e.at, status: e.status ?? undefined, title: e.title, description: e.description ?? undefined, actor: e.actor })),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function toAdminUser(p: ProfileRow): AdminUserRecord {
  return {
    id: p.id,
    role: p.role,
    fullName: p.full_name,
    email: p.email,
    phone: p.phone,
    businessName: p.business_name || p.full_name || p.email,
    location: { state: p.state, area: p.area },
    status: p.status,
    emailVerified: p.status !== 'pending_verification',
    createdAt: p.created_at,
    lastActiveAt: p.last_active_at,
    suspensionReason: p.suspension_reason ?? undefined,
  }
}
