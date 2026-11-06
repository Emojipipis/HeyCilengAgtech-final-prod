import { DEFAULT_SETTINGS, DEMO_ACCOUNTS, DEMO_ANNOUNCEMENTS, DEMO_AUDIT_LOG, DEMO_DISPUTES } from '@/fixtures/demo/admin'
import { DEMO_LISTINGS } from '@/fixtures/demo/listings'
import { DEMO_LOGISTICS_PARTNERS } from '@/fixtures/demo/logistics'
import { DEMO_BUYER_NOTIFICATIONS, DEMO_SELLER_NOTIFICATIONS } from '@/fixtures/demo/notifications'
import { DEMO_ORDERS } from '@/fixtures/demo/orders'
import { DEMO_REQUIREMENTS } from '@/fixtures/demo/requirements'
import { DEMO_SELLERS } from '@/fixtures/demo/sellers'
import { DEMO_TICKETS } from '@/fixtures/demo/tickets'
import { DEMO_BUYER_PROFILE, DEMO_SELLER_PROFILE } from '@/fixtures/demo/users'
import { DEMO_USERS } from '@/fixtures/demo/users'
import type { AuditLogEntry } from '@/types/admin'
import type { AppNotification } from '@/types/notification'

/**
 * In-memory copy of the demo fixtures for Demo Preview Mode.
 * Changes live only in this browser tab and reset on reload — nothing reaches HeyCileng.
 */
export const demoDb = {
  listings: structuredClone(DEMO_LISTINGS),
  sellers: structuredClone(DEMO_SELLERS),
  requirements: structuredClone(DEMO_REQUIREMENTS),
  orders: structuredClone(DEMO_ORDERS),
  /** Notifications keyed by demo user id. */
  notifications: {
    'demo-buyer-1': structuredClone(DEMO_BUYER_NOTIFICATIONS),
    'demo-seller-1': structuredClone(DEMO_SELLER_NOTIFICATIONS),
  } as Record<string, AppNotification[]>,
  buyerProfile: structuredClone(DEMO_BUYER_PROFILE),
  sellerProfile: structuredClone(DEMO_SELLER_PROFILE),
  savedListingIds: new Set(['demo-listing-5', 'demo-listing-13', 'demo-listing-7']),
  partners: structuredClone(DEMO_LOGISTICS_PARTNERS),
  tickets: structuredClone(DEMO_TICKETS),
  accounts: structuredClone(DEMO_ACCOUNTS),
  disputes: structuredClone(DEMO_DISPUTES),
  announcements: structuredClone(DEMO_ANNOUNCEMENTS),
  auditLog: structuredClone(DEMO_AUDIT_LOG),
  settings: structuredClone(DEFAULT_SETTINGS),
}

let sequence = 100
export const nextId = (prefix: string) => `${prefix}-${++sequence}`
export const nowISO = () => new Date().toISOString()

/** Adds a platform notification for a demo user. Users with no inbox (other demo buyers) are skipped. */
export function notify(userId: string, notification: Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'isDemo'>) {
  const inbox = demoDb.notifications[userId]
  if (!inbox) return
  inbox.unshift({ ...notification, id: nextId('demo-ntf'), createdAt: nowISO(), read: false, isDemo: true })
}

/** Records an administrative action in the demo audit log. In production the backend writes this. */
export function audit(entry: Omit<AuditLogEntry, 'id' | 'at' | 'actor' | 'isDemo'>) {
  demoDb.auditLog.unshift({ ...entry, id: nextId('demo-audit'), at: nowISO(), actor: DEMO_USERS.admin.fullName, isDemo: true })
}

/** True when the account may appear on the marketplace and receive orders. */
export function accountIsActive(userId: string) {
  const account = demoDb.accounts.find((a) => a.id === userId)
  return !account || account.status !== 'suspended'
}
