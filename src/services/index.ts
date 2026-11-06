import { env, isBackendConfigured } from '@/config/env'
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

import {
  supabaseAdminListingService,
  supabaseAdminSupportService,
  supabaseAdminUserService,
  supabaseAnnouncementService,
  supabaseAuditService,
  supabaseDisputeService,
  supabaseInsightsService,
  supabaseSettingsService,
} from './supabase/admin'
import {
  supabaseContactService,
  supabaseNotificationService,
  supabasePlatformConfigService,
  supabaseProfileService,
  supabaseSupportService,
} from './supabase/account'
import { supabaseAuthService } from './supabase/authService'
import { supabaseMarketplaceService, supabaseMatchingService, supabaseRequirementService } from './supabase/marketplace'
import {
  supabaseAdminOrderService,
  supabaseLogisticsService,
  supabaseOrderService,
  supabaseSellerListingService,
  supabaseSellerOrderService,
} from './supabase/orders'

/**
 * Single access point for data services. Three modes:
 * - Demo Preview Mode (VITE_DEMO_MODE=true): labelled in-memory fixtures.
 * - Supabase configured: live database, with RLS and database functions enforcing the rules.
 * - Neither: data services report "not connected".
 */
const mode: 'demo' | 'supabase' | 'none' = env.demoMode ? 'demo' : isBackendConfigured ? 'supabase' : 'none'

function pick<T extends object>(demo: T, live: T, label: string): T {
  if (mode === 'demo') return demo
  if (mode === 'supabase') return live
  return unconnectedService(label) as T
}

export const backendMode = mode

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
  auth: mode === 'supabase' ? supabaseAuthService : demoAuthService,
  contact: mode === 'supabase' ? supabaseContactService : demoContactService,
  marketplace: pick(demoMarketplaceService, supabaseMarketplaceService, 'The marketplace'),
  requirements: pick(demoRequirementService, supabaseRequirementService, 'Requirements'),
  matching: pick(demoMatchingService, supabaseMatchingService, 'Matchmaking'),
  orders: pick(demoOrderService, supabaseOrderService, 'Orders'),
  notifications: pick(demoNotificationService, supabaseNotificationService, 'Notifications'),
  profile: pick(demoProfileService, supabaseProfileService, 'Your profile'),
  sellerListings: pick(demoSellerListingService, supabaseSellerListingService, 'Your listings'),
  sellerOrders: pick(demoSellerOrderService, supabaseSellerOrderService, 'Incoming orders'),
  adminOrders: pick(demoAdminOrderService, supabaseAdminOrderService, 'Order management'),
  logistics: pick(demoLogisticsService, supabaseLogisticsService, 'Logistics'),
  support: pick(demoSupportService, supabaseSupportService, 'Support'),
  adminUsers: pick(demoAdminUserService, supabaseAdminUserService, 'User management'),
  adminListings: pick(demoAdminListingService, supabaseAdminListingService, 'Listing management'),
  adminSupport: pick(demoAdminSupportService, supabaseAdminSupportService, 'The support queue'),
  disputes: pick(demoDisputeService, supabaseDisputeService, 'Disputes'),
  announcements: pick(demoAnnouncementService, supabaseAnnouncementService, 'Announcements'),
  settings: pick(demoSettingsService, supabaseSettingsService, 'Platform settings'),
  audit: pick(demoAuditService, supabaseAuditService, 'Audit logs'),
  insights: pick(demoAdminInsightsService, supabaseInsightsService, 'Reports'),
  // Paystack isn't integrated in any mode.
  payments: demoPaymentService,
  platformConfig: pick(demoPlatformConfigService, supabasePlatformConfigService, 'Platform configuration'),
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

// Load the matching weights HeyCileng has configured before any matches are ranked.
if (mode === 'supabase') void supabasePlatformConfigService.get()
