import type {
  AdminMatchmaking,
  AdminOverview,
  AdminReports,
  AdminUserRecord,
  Announcement,
  AnnouncementAudience,
  AuditLogEntry,
  CommissionEstimate,
  Dispute,
  PaymentRecord,
  PlatformSettings,
} from '@/types/admin'
import type { ContactMessageInput } from '@/types/contact'
import type { Listing, ListingFilters, ListingInput, MarketplaceListing } from '@/types/listing'
import type { MatchResult } from '@/types/match'
import type { AssignDeliveryInput, LogisticsPartner, LogisticsPartnerInput, UpdateDeliveryInput } from '@/types/logistics'
import type { AppNotification } from '@/types/notification'
import type { Order, OrderRequestInput } from '@/types/order'
import type { Requirement, RequirementInput } from '@/types/requirement'
import type { DisputeStatus, RequirementStatus, TicketStatus } from '@/types/status'
import type { NewTicketInput, SupportTicket } from '@/types/support'
import type { BuyerProfile, SellerProfile, Session, SignInInput, SignupInput } from '@/types/user'

/**
 * Service contracts. Pages and components depend on these interfaces only.
 * `services/demo` implements them today; a Supabase implementation replaces it later.
 */

export type ServiceErrorCode =
  | 'not_connected'
  | 'validation'
  | 'unauthorised'
  | 'not_found'
  | 'network'
  | 'rate_limited'
  | 'invalid_credentials'
  | 'email_not_verified'
  | 'email_in_use'
  | 'invalid_otp'
  | 'expired_otp'
  | 'unknown'

export interface ServiceError {
  code: ServiceErrorCode
  message: string
}

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: ServiceError }

export interface ContactService {
  /** Sends a public contact-form message to the HeyCileng team. */
  submitMessage(input: ContactMessageInput): Promise<ServiceResult<{ reference: string }>>
}

export interface OtpDispatch {
  email: string
  /** Seconds before another code may be requested. */
  resendCooldownSeconds: number
}

export type OtpPurpose = 'signup' | 'password_reset'

/**
 * Authentication contract, shaped around Supabase Auth email OTP:
 * signUp → verifyOtp(type 'signup'); resetPasswordForEmail-style OTP → verifyOtp(type 'recovery') → updateUser.
 * Role assignment and every security check happen on the backend.
 */
export interface AuthService {
  /** Creates the account and emails a 6-digit verification code. */
  signUp(input: SignupInput): Promise<ServiceResult<OtpDispatch>>
  /** Signs in with email and password. Fails with `email_not_verified` until the email OTP is confirmed. */
  signIn(input: SignInInput): Promise<ServiceResult<Session>>
  /** Sends a fresh code for the given purpose. */
  resendOtp(email: string, purpose: OtpPurpose): Promise<ServiceResult<OtpDispatch>>
  /** Confirms a signup code. Errors: `invalid_otp`, `expired_otp`. */
  verifySignupOtp(email: string, code: string): Promise<ServiceResult<{ verified: true }>>
  /** Emails a password-reset code to a registered address. */
  requestPasswordReset(email: string): Promise<ServiceResult<OtpDispatch>>
  /** Confirms a password-reset code, authorising a single password update. */
  verifyPasswordResetOtp(email: string, code: string): Promise<ServiceResult<{ verified: true }>>
  /** Sets the new password after a successful reset verification. */
  updatePassword(newPassword: string): Promise<ServiceResult<{ updated: true }>>
  signOut(): Promise<ServiceResult<null>>
  /** The current session (restored from storage), or null when signed out. */
  getSession(): Promise<Session | null>
  /** Notifies sign-in, sign-out and token refresh. Returns an unsubscribe function. */
  onSessionChange(callback: (session: Session | null) => void): () => void
}

/*
 * Marketplace contracts below act on behalf of the signed-in user. The backend derives the user from the
 * session and enforces access rules (RLS); the frontend never passes or trusts user ids for authorisation.
 */

export interface MarketplaceService {
  /** Active, publicly visible listings matching the filters. */
  listListings(filters: ListingFilters): Promise<ServiceResult<MarketplaceListing[]>>
  getListing(id: string): Promise<ServiceResult<MarketplaceListing>>
  listSaved(): Promise<ServiceResult<MarketplaceListing[]>>
  savedIds(): Promise<ServiceResult<string[]>>
  setSaved(listingId: string, saved: boolean): Promise<ServiceResult<{ saved: boolean }>>
}

export interface RequirementService {
  list(): Promise<ServiceResult<Requirement[]>>
  get(id: string): Promise<ServiceResult<Requirement>>
  create(input: RequirementInput): Promise<ServiceResult<Requirement>>
  update(id: string, input: RequirementInput): Promise<ServiceResult<Requirement>>
  /** Pause, resume (active) or mark fulfilled. `expired` is derived from the expiry date, not set. */
  setStatus(id: string, status: Exclude<RequirementStatus, 'expired'>): Promise<ServiceResult<Requirement>>
  remove(id: string): Promise<ServiceResult<null>>
}

export interface ListingMatch {
  listing: MarketplaceListing
  match: MatchResult
}

export interface RequirementMatches {
  requirement: Requirement
  matches: ListingMatch[]
}

/** Advisory recommendations only — never creates orders, reserves stock or notifies the other party. */
export interface MatchingService {
  matchesForRequirement(requirementId: string): Promise<ServiceResult<RequirementMatches>>
  /** Best matches across all of the buyer's active requirements. */
  topMatches(limit: number): Promise<ServiceResult<(ListingMatch & { requirement: Requirement })[]>>
  /** Seller view: active buyer requirements that match the seller's active listings. */
  potentialBuyers(): Promise<ServiceResult<PotentialBuyer[]>>
  /** Buyer view: how this listing scores against each of the buyer's active requirements. */
  matchesForListing(listingId: string): Promise<ServiceResult<{ requirement: Requirement; match: MatchResult }[]>>
  /** Buyer view: number of recommended listings (and full matches) per requirement id. */
  requirementMatchCounts(): Promise<ServiceResult<Record<string, { total: number; full: number }>>>
}

export interface OrderService {
  listMine(): Promise<ServiceResult<Order[]>>
  get(id: string): Promise<ServiceResult<Order>>
  /** Creates a pending request. Does NOT reserve stock — reservation happens when the seller accepts. */
  requestOrder(input: OrderRequestInput): Promise<ServiceResult<Order>>
  /** Buyers may cancel while an order is pending or accepted. */
  cancel(id: string, reason: string): Promise<ServiceResult<Order>>
}

export interface NotificationService {
  list(): Promise<ServiceResult<AppNotification[]>>
  markRead(id: string): Promise<ServiceResult<null>>
  markAllRead(): Promise<ServiceResult<null>>
}

export interface ProfileService {
  getBuyerProfile(): Promise<ServiceResult<BuyerProfile>>
  updateBuyerProfile(input: Pick<BuyerProfile, 'fullName' | 'phone' | 'businessName' | 'industry' | 'location' | 'about'>): Promise<ServiceResult<BuyerProfile>>
  getSellerProfile(): Promise<ServiceResult<SellerProfile>>
  updateSellerProfile(input: Pick<SellerProfile, 'fullName' | 'phone' | 'businessName' | 'location' | 'description'>): Promise<ServiceResult<SellerProfile>>
}

/** The signed-in seller's own listings, including drafts, paused and pending-review listings. */
export interface SellerListingService {
  listMine(): Promise<ServiceResult<Listing[]>>
  get(id: string): Promise<ServiceResult<Listing>>
  /** New listings start as `pending_review` until HeyCileng approves them. Image files are uploaded by the service. */
  create(input: ListingInput): Promise<ServiceResult<Listing>>
  /** Listed quantity can't drop below reserved + sold. */
  update(id: string, input: ListingInput): Promise<ServiceResult<Listing>>
  setPaused(id: string, paused: boolean): Promise<ServiceResult<Listing>>
  /** Refused while the listing has reserved stock or open order requests. */
  remove(id: string): Promise<ServiceResult<null>>
}

/** Orders received by the signed-in seller. Buyer contact details and addresses are never included. */
export interface SellerOrderService {
  listIncoming(): Promise<ServiceResult<Order[]>>
  get(id: string): Promise<ServiceResult<Order>>
  /** Reserves the ordered quantity. Fails if available stock is insufficient. */
  accept(id: string): Promise<ServiceResult<Order>>
  decline(id: string, reason: string): Promise<ServiceResult<Order>>
  startProcessing(id: string): Promise<ServiceResult<Order>>
}

/** An anonymised buyer requirement shown to sellers. No buyer identity or contact details. */
export interface PotentialBuyer {
  requirement: Requirement
  /** Generic description, e.g. "Buyer in Lagos". */
  buyerLabel: string
  listing: Listing
  match: MatchResult
}

/**
 * Administrator order management. Every action here must be re-authorised on the backend (admin role, RLS)
 * and is recorded in the order timeline and audit log.
 */
export interface AdminOrderService {
  listAll(): Promise<ServiceResult<Order[]>>
  get(id: string): Promise<ServiceResult<Order>>
  /** Delivery orders that are accepted or processing. Sets the partner, fee, payer and estimated date. */
  assignDelivery(orderId: string, input: AssignDeliveryInput): Promise<ServiceResult<Order>>
  /**
   * Moves an assigned delivery forward. Keeps the order in step:
   * in transit → dispatched · delivered → completed (reserved stock becomes sold) · failed → delivery failed (stock stays reserved).
   */
  updateDelivery(orderId: string, input: UpdateDeliveryInput): Promise<ServiceResult<Order>>
  /** Collection orders only. */
  markReadyForCollection(orderId: string, note?: string): Promise<ServiceResult<Order>>
  /** Collection orders only. Completes the order; reserved stock becomes sold. */
  markCollected(orderId: string): Promise<ServiceResult<Order>>
  /** Cancels an open order and releases any reserved stock. */
  cancel(orderId: string, reason: string): Promise<ServiceResult<Order>>
}

export interface LogisticsService {
  listPartners(): Promise<ServiceResult<LogisticsPartner[]>>
  createPartner(input: LogisticsPartnerInput): Promise<ServiceResult<LogisticsPartner>>
  updatePartner(id: string, input: LogisticsPartnerInput): Promise<ServiceResult<LogisticsPartner>>
  setPartnerStatus(id: string, status: LogisticsPartner['status']): Promise<ServiceResult<LogisticsPartner>>
}

/** The signed-in user's support tickets with HeyCileng. Replies from agents come from the admin side. */
export interface SupportService {
  listMine(): Promise<ServiceResult<SupportTicket[]>>
  get(id: string): Promise<ServiceResult<SupportTicket>>
  create(input: NewTicketInput): Promise<ServiceResult<SupportTicket>>
  /** Adds the user's message. A resolved or awaiting-you ticket goes back to the support queue. */
  reply(id: string, message: string): Promise<ServiceResult<SupportTicket>>
  /** The user confirms their issue is resolved. */
  markResolved(id: string): Promise<ServiceResult<SupportTicket>>
}

/*
 * Administrator services. The UI hides these areas from non-admins, but only the backend can
 * authorise them: every call must check the admin role server-side and write an audit log entry.
 */

export interface AdminUserService {
  list(): Promise<ServiceResult<AdminUserRecord[]>>
  /** Suspend (reason required) or reactivate an account. Admin accounts can't be suspended here. */
  setStatus(id: string, status: 'active' | 'suspended', reason: string): Promise<ServiceResult<AdminUserRecord>>
}

export interface AdminListingService {
  /** Every listing in any status, with the seller's public profile. */
  list(): Promise<ServiceResult<MarketplaceListing[]>>
  get(id: string): Promise<ServiceResult<MarketplaceListing>>
  approve(id: string): Promise<ServiceResult<Listing>>
  reject(id: string, reason: string): Promise<ServiceResult<Listing>>
  suspend(id: string, reason: string): Promise<ServiceResult<Listing>>
  /** Restores a suspended or rejected listing to active. */
  reinstate(id: string): Promise<ServiceResult<Listing>>
}

export interface AdminTicket extends SupportTicket {
  requesterName: string
  requesterRole: 'buyer' | 'seller'
}

export interface AdminSupportService {
  list(): Promise<ServiceResult<AdminTicket[]>>
  get(id: string): Promise<ServiceResult<AdminTicket>>
  /** Replies as HeyCileng Support and sets the resulting status. The user is notified. */
  reply(id: string, message: string, status: Extract<TicketStatus, 'in_progress' | 'awaiting_user' | 'resolved'>): Promise<ServiceResult<AdminTicket>>
  setStatus(id: string, status: TicketStatus): Promise<ServiceResult<AdminTicket>>
}

export interface DisputeUpdate {
  status?: DisputeStatus
  resolution?: string
  note?: string
}

export interface DisputeService {
  list(): Promise<ServiceResult<Dispute[]>>
  update(id: string, update: DisputeUpdate): Promise<ServiceResult<Dispute>>
}

export interface AnnouncementService {
  list(): Promise<ServiceResult<Announcement[]>>
  /** Sends a platform announcement notification to the chosen audience. */
  publish(input: { title: string; body: string; audience: AnnouncementAudience }): Promise<ServiceResult<Announcement>>
}

export interface SettingsService {
  get(): Promise<ServiceResult<PlatformSettings>>
  update(settings: PlatformSettings): Promise<ServiceResult<PlatformSettings>>
}

export interface AuditService {
  list(): Promise<ServiceResult<AuditLogEntry[]>>
}

/** Read-only aggregates for the admin overview, reports, matchmaking and commissions pages. */
export interface AdminInsightsService {
  overview(): Promise<ServiceResult<AdminOverview>>
  reports(): Promise<ServiceResult<AdminReports>>
  matchmaking(): Promise<ServiceResult<AdminMatchmaking>>
  commissions(): Promise<ServiceResult<{ ratePercent: number; records: CommissionEstimate[] }>>
}

/** Paystack payments — not integrated yet. */
export interface PaymentService {
  listPayments(): Promise<ServiceResult<PaymentRecord[]>>
}

/** Settings that ordinary users may read (a safe subset of PlatformSettings). */
export interface PublicPlatformConfig {
  allowCollection: boolean
  maxImagesPerListing: number
  commissionRatePercent: number
}

export interface PlatformConfigService {
  get(): Promise<ServiceResult<PublicPlatformConfig>>
}
