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

/** Buyer payment through Paystack. Set only by the backend after Paystack confirms the transaction. */
export type PaymentStatus = 'unpaid' | 'paid' | 'refund_pending' | 'refunded'

/** HeyCileng pays sellers manually after completion (order value minus commission and any seller-paid delivery fee). */
export type PayoutStatus = 'not_due' | 'due' | 'paid'

export interface OrderPayment {
  status: PaymentStatus
  paidAt?: string
  amountPaid?: number
  /** Commission rate (%) recorded when the buyer paid. */
  commissionRate?: number
  payoutStatus: PayoutStatus
  payoutReference?: string
  payoutPaidAt?: string
}

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
  payment: OrderPayment
  timeline: OrderEvent[]
  /** Reasons typed by the buyer or seller (cancel/decline). Visible to HeyCileng administrators only. */
  partyNotes?: { actor: 'buyer' | 'seller'; title: string; note: string; at: string }[]
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
