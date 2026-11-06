import { env } from '@/config/env'
import { demoAdminInsightsService } from './demo/adminInsightsService'
import { demoAdminOrderService } from './demo/adminOrderService'
import {
  demoAdminListingService,
  demoAdminSupportService,
  demoAdminUserService,
  demoAnnouncementService,
  demoAuditService,
  demoDisputeService,
  demoPaymentService,
  demoPlatformConfigService,
  demoSettingsService,
} from './demo/adminServices'
import { demoAuthService } from './demo/authService'
import { demoContactService } from './demo/contactService'
import { demoLogisticsService } from './demo/logisticsService'
import { demoMarketplaceService } from './demo/marketplaceService'
import { demoMatchingService } from './demo/matchingService'
import { demoNotificationService } from './demo/notificationService'
import { demoOrderService } from './demo/orderService'
import { demoProfileService } from './demo/profileService'
import { demoRequirementService } from './demo/requirementService'
import { demoSellerListingService } from './demo/sellerListingService'
import { demoSellerOrderService } from './demo/sellerOrderService'
import { demoSupportService } from './demo/supportService'
import { unconnectedService } from './demo/shared'
import type {
  AdminInsightsService,
  AdminListingService,
  AdminOrderService,
  AdminSupportService,
  AdminUserService,
  AnnouncementService,
  AuditService,
  DisputeService,
  PaymentService,
  PlatformConfigService,
  SettingsService,
  AuthService,
  ContactService,
  LogisticsService,
  MarketplaceService,
  MatchingService,
  NotificationService,
  OrderService,
  ProfileService,
  RequirementService,
  SellerListingService,
  SellerOrderService,
  SupportService,
} from './types'

/**
 * Single access point for data services. Demo fixtures are served only in Demo Preview Mode;
 * otherwise data services report "not connected". Replace with Supabase-backed implementations
 * here once the backend exists — no page changes needed.
 */
const demo = env.demoMode

export const services: {
  auth: AuthService
  contact: ContactService
  marketplace: MarketplaceService
  requirements: RequirementService
  matching: MatchingService
  orders: OrderService
  notifications: NotificationService
  profile: ProfileService
  sellerListings: SellerListingService
  sellerOrders: SellerOrderService
  adminOrders: AdminOrderService
  logistics: LogisticsService
  support: SupportService
  adminUsers: AdminUserService
  adminListings: AdminListingService
  adminSupport: AdminSupportService
  disputes: DisputeService
  announcements: AnnouncementService
  settings: SettingsService
  audit: AuditService
  insights: AdminInsightsService
  payments: PaymentService
  platformConfig: PlatformConfigService
} = {
  auth: demoAuthService,
  contact: demoContactService,
  marketplace: demo ? demoMarketplaceService : unconnectedService('The marketplace'),
  requirements: demo ? demoRequirementService : unconnectedService('Requirements'),
  matching: demo ? demoMatchingService : unconnectedService('Matchmaking'),
  orders: demo ? demoOrderService : unconnectedService('Orders'),
  notifications: demo ? demoNotificationService : unconnectedService('Notifications'),
  profile: demo ? demoProfileService : unconnectedService('Your profile'),
  sellerListings: demo ? demoSellerListingService : unconnectedService('Your listings'),
  sellerOrders: demo ? demoSellerOrderService : unconnectedService('Incoming orders'),
  adminOrders: demo ? demoAdminOrderService : unconnectedService('Order management'),
  logistics: demo ? demoLogisticsService : unconnectedService('Logistics'),
  support: demo ? demoSupportService : unconnectedService('Support'),
  adminUsers: demo ? demoAdminUserService : unconnectedService('User management'),
  adminListings: demo ? demoAdminListingService : unconnectedService('Listing management'),
  adminSupport: demo ? demoAdminSupportService : unconnectedService('The support queue'),
  disputes: demo ? demoDisputeService : unconnectedService('Disputes'),
  announcements: demo ? demoAnnouncementService : unconnectedService('Announcements'),
  settings: demo ? demoSettingsService : unconnectedService('Platform settings'),
  audit: demo ? demoAuditService : unconnectedService('Audit logs'),
  insights: demo ? demoAdminInsightsService : unconnectedService('Reports'),
  // Paystack isn't integrated in any mode.
  payments: demoPaymentService,
  platformConfig: demo ? demoPlatformConfigService : unconnectedService('Platform configuration'),
}

export type {
  ListingMatch,
  OtpDispatch,
  OtpPurpose,
  AdminTicket,
  DisputeUpdate,
  PotentialBuyer,
  PublicPlatformConfig,
  RequirementMatches,
  ServiceError,
  ServiceResult,
} from './types'
