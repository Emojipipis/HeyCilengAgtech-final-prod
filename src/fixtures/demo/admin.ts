import { DEFAULT_MATCH_WEIGHTS, DEFAULT_MIN_RECOMMENDED_SCORE } from '@/config/matching'
import type { AdminUserRecord, Announcement, AuditLogEntry, Dispute, PlatformSettings } from '@/types/admin'
import { DEMO_SELLERS } from './sellers'
import { DEMO_BUYER_NAMES, DEMO_USERS } from './users'

/** ⚠ Illustrative demo accounts, disputes, audit entries and announcements for the admin area. */

const SELLER_CONTACTS: Record<string, { fullName: string; created: string; active: string }> = {
  'demo-seller-1': { fullName: 'Tunde Adebayo', created: '2026-02-02', active: '2026-11-05' },
  'demo-seller-2': { fullName: 'Hauwa Sani', created: '2026-04-18', active: '2026-11-04' },
  'demo-seller-3': { fullName: 'Terver Iorliam', created: '2026-05-07', active: '2026-11-03' },
  'demo-seller-4': { fullName: 'Bola Akinola', created: '2026-06-21', active: '2026-10-28' },
  'demo-seller-5': { fullName: 'Ngozi Eze', created: '2026-03-30', active: '2026-11-02' },
  'demo-seller-6': { fullName: 'Musa Danjuma', created: '2026-07-12', active: '2026-11-01' },
}

const BUYERS: { id: string; fullName: string; state: string; area: string; created: string; active: string; status?: AdminUserRecord['status']; reason?: string }[] = [
  { id: 'demo-buyer-1', fullName: 'Amina Yusuf', state: 'oyo', area: 'Ibadan', created: '2026-03-14', active: '2026-11-05' },
  { id: 'demo-buyer-2', fullName: 'Chidi Okafor', state: 'lagos', area: 'Ikorodu', created: '2026-05-02', active: '2026-11-04' },
  { id: 'demo-buyer-3', fullName: 'Ibrahim Bello', state: 'kano', area: 'Nassarawa', created: '2026-06-11', active: '2026-11-05' },
  { id: 'demo-buyer-4', fullName: 'Funke Ojo', state: 'ogun', area: 'Abeokuta', created: '2026-07-19', active: '2026-11-02' },
  {
    id: 'demo-buyer-5', fullName: 'Kelechi Nwosu', state: 'rivers', area: 'Port Harcourt', created: '2026-08-03', active: '2026-09-14',
    status: 'suspended', reason: 'Repeatedly asked sellers for direct phone contact, against platform rules.',
  },
]

const BUYER_EXTRA_NAMES: Record<string, string> = { 'demo-buyer-5': 'Coastal Pellets (Demo)' }

export const DEMO_ACCOUNTS: AdminUserRecord[] = [
  ...BUYERS.map((b, i) => ({
    id: b.id,
    role: 'buyer' as const,
    fullName: b.fullName,
    email: `buyer${i + 1}.demo@example.com`,
    phone: `+234 800 000 01${String(i + 1).padStart(2, '0')}`,
    businessName: DEMO_BUYER_NAMES[b.id] ?? BUYER_EXTRA_NAMES[b.id],
    location: { state: b.state, area: b.area },
    status: b.status ?? 'active',
    emailVerified: true,
    createdAt: `${b.created}T09:00:00Z`,
    lastActiveAt: `${b.active}T12:00:00Z`,
    suspensionReason: b.reason,
  })),
  ...DEMO_SELLERS.map((s, i) => ({
    id: s.id,
    role: 'seller' as const,
    fullName: SELLER_CONTACTS[s.id].fullName,
    email: `seller${i + 1}.demo@example.com`,
    phone: `+234 800 000 02${String(i + 1).padStart(2, '0')}`,
    businessName: s.businessName,
    location: s.location,
    status: s.verified ? ('active' as const) : ('pending_verification' as const),
    emailVerified: s.verified,
    createdAt: `${SELLER_CONTACTS[s.id].created}T09:00:00Z`,
    lastActiveAt: `${SELLER_CONTACTS[s.id].active}T12:00:00Z`,
  })),
  {
    ...DEMO_USERS.admin,
    businessName: 'HeyCileng',
    location: { state: 'lagos', area: 'Head office' },
    lastActiveAt: '2026-11-05T12:00:00Z',
  },
].map((a) => ({ ...a, isDemo: true }))

export const DEMO_DISPUTES: Dispute[] = [
  {
    id: 'demo-dispute-1', reference: 'HC-DSP-DEMO-11', order: { id: 'demo-order-6', reference: 'HC-DEMO-1045', material: 'Composted poultry litter' },
    raisedBy: 'buyer', raisedByName: 'Greenmill Feeds (Demo)', reason: 'quantity',
    description: 'We counted 188 bags on delivery instead of the 200 ordered.',
    status: 'under_review', createdAt: '2026-09-26T09:00:00Z', updatedAt: '2026-09-27T11:00:00Z',
    notes: [{ at: '2026-09-27T11:00:00Z', body: 'Asked the logistics partner for the loading tally and the seller for the dispatch count.' }],
  },
  {
    id: 'demo-dispute-2', reference: 'HC-DSP-DEMO-09', order: { id: 'demo-order-14', reference: 'HC-DEMO-1053', material: 'Sun-dried cassava peels' },
    raisedBy: 'buyer', raisedByName: 'Northern Feeds Co-op (Demo)', reason: 'quality',
    description: 'Part of the load was damp on arrival.', status: 'resolved',
    resolution: 'Seller agreed to replace 0.5 t on the next order. Buyer accepted.',
    createdAt: '2026-10-10T09:00:00Z', updatedAt: '2026-10-13T15:00:00Z',
    notes: [{ at: '2026-10-11T10:00:00Z', body: 'Photos received from buyer; moisture visible on top bags.' }],
  },
].map((d) => ({ ...d, isDemo: true }) as Dispute)

export const DEMO_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'demo-ann-1', title: 'Online payments coming soon', audience: 'all', publishedAt: '2026-10-25T09:00:00Z', publishedBy: 'Demo Administrator',
    body: 'Paystack payments will be added in a future release. No payments are processed on the platform yet.', isDemo: true,
  },
]

export const DEMO_AUDIT_LOG: AuditLogEntry[] = [
  { id: 'demo-audit-1', at: '2026-11-04T16:05:00Z', actor: 'Demo Administrator', action: 'Viewed listing submitted for review', targetType: 'listing', targetLabel: 'Wet cassava starch residue' },
  { id: 'demo-audit-2', at: '2026-11-03T07:30:00Z', actor: 'Demo Administrator', action: 'Marked delivery in transit', targetType: 'order', targetLabel: 'HC-DEMO-1043' },
  { id: 'demo-audit-3', at: '2026-10-29T10:30:00Z', actor: 'Demo Administrator', action: 'Assigned logistics partner', targetType: 'order', targetLabel: 'HC-DEMO-1042', detail: 'Demo Logistics Partner A' },
  { id: 'demo-audit-4', at: '2026-10-25T09:00:00Z', actor: 'Demo Administrator', action: 'Published announcement', targetType: 'announcement', targetLabel: 'Online payments coming soon' },
  { id: 'demo-audit-5', at: '2026-09-14T13:00:00Z', actor: 'Demo Administrator', action: 'Suspended account', targetType: 'user', targetLabel: 'Coastal Pellets (Demo)', detail: 'Repeatedly asked sellers for direct phone contact.' },
].map((e) => ({ ...e, isDemo: true }) as AuditLogEntry)

export const DEFAULT_SETTINGS: PlatformSettings = {
  commission: { ratePercent: 5, chargedTo: 'seller' },
  marketplace: { requireListingReview: true, maxImagesPerListing: 6 },
  matching: {
    weights: Object.fromEntries(Object.entries(DEFAULT_MATCH_WEIGHTS).map(([k, v]) => [k, Math.round(v * 100)])) as PlatformSettings['matching']['weights'],
    minRecommendedScore: DEFAULT_MIN_RECOMMENDED_SCORE,
  },
  notifications: { emailOrderUpdates: true, emailMatchAlerts: true, emailAnnouncements: false },
  platform: { name: 'HeyCileng Agtech', supportEmail: '', tagline: 'Turning agricultural waste into valuable opportunities.' },
}
