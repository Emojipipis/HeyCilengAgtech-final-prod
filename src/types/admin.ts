import type { AccountStatus, DisputeStatus } from './status'
import type { Role } from './user'

/** Administrator view of an account. Contact details are visible to HeyCileng staff only. */
export interface AdminUserRecord {
  id: string
  role: Role
  fullName: string
  email: string
  phone: string
  businessName: string
  location: { state: string; area: string }
  status: AccountStatus
  emailVerified: boolean
  createdAt: string
  lastActiveAt: string
  /** Reason recorded when the account was last suspended. */
  suspensionReason?: string
  isDemo?: boolean
}

export type AuditTargetType = 'order' | 'listing' | 'user' | 'partner' | 'ticket' | 'dispute' | 'announcement' | 'settings'

/** An administrative action. Written by the backend in production — never editable from the UI. */
export interface AuditLogEntry {
  id: string
  at: string
  actor: string
  action: string
  targetType: AuditTargetType
  targetLabel: string
  detail?: string
  isDemo?: boolean
}

export type DisputeReason = 'quality' | 'quantity' | 'delivery' | 'damaged' | 'other'

export interface Dispute {
  id: string
  reference: string
  order: { id: string; reference: string; material: string }
  raisedBy: 'buyer' | 'seller'
  raisedByName: string
  reason: DisputeReason
  description: string
  status: DisputeStatus
  resolution?: string
  /** Internal HeyCileng notes, newest last. */
  notes: { at: string; body: string }[]
  createdAt: string
  updatedAt: string
  isDemo?: boolean
}

export type AnnouncementAudience = 'all' | 'buyers' | 'sellers'

export interface Announcement {
  id: string
  title: string
  body: string
  audience: AnnouncementAudience
  publishedAt: string
  publishedBy: string
  isDemo?: boolean
}

export interface PlatformSettings {
  commission: {
    /** Percentage of completed order value. */
    ratePercent: number
    /** Who the commission is deducted from. */
    chargedTo: 'seller' | 'buyer'
  }
  marketplace: {
    /** New listings need admin approval before going live. */
    requireListingReview: boolean
    maxImagesPerListing: number
  }
  matching: {
    /** Percent weights; must add up to 100. */
    weights: { material: number; quantity: number; location: number; price: number; application: number; quality: number }
    minRecommendedScore: number
  }
  notifications: {
    emailOrderUpdates: boolean
    emailMatchAlerts: boolean
    emailAnnouncements: boolean
  }
  platform: {
    name: string
    supportEmail: string
    tagline: string
  }
}

/** A Paystack transaction attempt for an order. Written only by the backend. */
export interface PaymentRecord {
  id: string
  orderId: string
  orderReference: string
  buyerName: string
  amount: number
  /** initialized = checkout started, not completed (yet). */
  status: 'initialized' | 'successful' | 'failed'
  provider: 'paystack'
  /** Our reference, also used by Paystack. */
  reference: string
  channel?: string
  paidAt?: string
  /** Backend note, e.g. an amount mismatch or a refund that's needed. */
  note?: string
  createdAt: string
}

/** Commission on a completed order: collected through the buyer's Paystack payment, or an estimate if unpaid. */
export interface CommissionEstimate {
  orderId: string
  orderReference: string
  completedAt: string
  sellerBusinessName: string
  orderValue: number
  ratePercent: number
  amount: number
  status: 'collected' | 'not_collected'
}

export interface AdminOverview {
  users: { buyers: number; sellers: number; suspended: number }
  listings: { active: number; pendingReview: number }
  orders: { open: number; needsAction: number; completed: number; completedValue: number }
  support: { openTickets: number; openDisputes: number }
  /** Orders created per ISO week, oldest first. */
  ordersByWeek: { week: string; orders: number }[]
}

export interface AdminReports {
  ordersByStatus: { status: string; count: number }[]
  completedValueByMonth: { month: string; value: number }[]
  supplyDemandByCategory: { category: string; listings: number; requirements: number }[]
  stockKg: { listed: number; reserved: number; sold: number; available: number }
}

export interface AdminMatchmaking {
  activeRequirements: number
  activeListings: number
  fullMatches: number
  partialMatches: number
  requirements: { id: string; title: string; buyerLabel: string; category: string; status: string; matches: number; full: number; bestScore: number | null }[]
  unmatchedListings: { id: string; name: string; sellerBusinessName: string; category: string }[]
}
