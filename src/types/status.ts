/** Status unions shared across the marketplace. Kept in one place so badges, filters and services agree. */

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'processing'
  | 'dispatched'
  | 'ready_for_collection'
  | 'completed'
  | 'cancelled'
  | 'delivery_failed'

export type ListingStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'sold_out' | 'rejected' | 'suspended'

export type RequirementStatus = 'active' | 'paused' | 'expired' | 'fulfilled'

export type DeliveryStatus =
  | 'not_assigned'
  | 'assigned'
  | 'scheduled'
  | 'in_transit'
  | 'delivered'
  | 'ready_for_collection'
  | 'collected'
  | 'failed'

export type TicketStatus = 'open' | 'in_progress' | 'awaiting_user' | 'resolved' | 'closed'

export type AccountStatus = 'active' | 'pending_verification' | 'suspended'

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'rejected'

export interface StatusKinds {
  order: OrderStatus
  listing: ListingStatus
  requirement: RequirementStatus
  delivery: DeliveryStatus
  ticket: TicketStatus
  account: AccountStatus
  dispute: DisputeStatus
}

export type StatusKind = keyof StatusKinds
