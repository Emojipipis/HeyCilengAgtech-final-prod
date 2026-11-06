import type { CategoryId, Location, Unit } from './catalog'
import type { DeliveryStatus, OrderStatus } from './status'

export type FulfilmentMethod = 'delivery' | 'collection'

export type FeePayer = 'buyer' | 'seller' | 'heycileng'

export type OrderActor = 'buyer' | 'seller' | 'heycileng' | 'system'

export interface OrderEvent {
  id: string
  at: string
  /** Status the order moved to, when the event is a status change. */
  status?: OrderStatus
  title: string
  description?: string
  actor: OrderActor
}

export interface DeliveryUpdate {
  at: string
  status: DeliveryStatus
  note?: string
}

/** Logistics details. Managed manually by HeyCileng administrators. */
export interface Delivery {
  status: DeliveryStatus
  partnerId?: string
  partnerName?: string
  fee?: number
  feePayer?: FeePayer
  estimatedDate?: string
  trackingReference?: string
  history: DeliveryUpdate[]
}

/** Payment processing (Paystack) is not integrated yet. */
export type PaymentStatus = 'integration_pending'

export interface Order {
  id: string
  reference: string
  listingId: string
  /** Listing details captured when the request was made. */
  listing: {
    name: string
    category: CategoryId
    unit: Unit
    pricePerUnit: number
    sellerBusinessName: string
    sellerLocation: Location
  }
  buyerId: string
  buyerBusinessName: string
  sellerId: string
  quantity: number
  /** quantity × price per unit at request time. */
  subtotal: number
  fulfilment: FulfilmentMethod
  deliveryAddress?: string
  preferredDate?: string
  /** Note for HeyCileng — never shown directly to the other party. */
  buyerNote?: string
  status: OrderStatus
  delivery: Delivery | null
  payment: { status: PaymentStatus }
  timeline: OrderEvent[]
  createdAt: string
  updatedAt: string
  isDemo?: boolean
}

export interface OrderRequestInput {
  listingId: string
  quantity: number
  fulfilment: FulfilmentMethod
  deliveryAddress?: string
  preferredDate?: string
  buyerNote?: string
}
