import { applyMatchingSettings } from '@/config/matching'
import { computeCommissions, computeMatchmaking, computeOverview, computeReports, type InsightsData } from '@/lib/insights'
import type { Announcement, AuditLogEntry, Dispute, PlatformSettings } from '@/types/admin'
import type { Listing, MarketplaceListing } from '@/types/listing'
import type {
  AdminInsightsService,
  AdminListingService,
  AdminSupportService,
  AdminTicket,
  AdminUserService,
  AnnouncementService,
  AuditService,
  DisputeService,
  ServiceResult,
  SettingsService,
} from '../types'
import { loadTickets } from './account'
import { supabase } from './client'
import { fail, notFound, ok } from './errors'
import { guard } from './marketplace'
import { profileToSellerPublic, toAdminUser, toListing, toOrder, toRequirement, type ListingRow, type OrderEventRow, type OrderRow, type ProfileRow, type RequirementRow } from './mappers'

async function profiles(): Promise<ProfileRow[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).returns<ProfileRow[]>()
  if (error) throw error
  return data
}

/* ------------------------------------------------------------------ Users */

export const supabaseAdminUserService: AdminUserService = {
  list() {
    return guard(async () => (await profiles()).map(toAdminUser))
  },
  async setStatus(id, status, reason) {
    const { error } = await supabase.rpc('admin_set_account_status', { p_user: id, p_status: status, p_reason: reason })
    if (error) return fail(error)
    const { data, error: readError } = await supabase.from('profiles').select('*').eq('id', id).single<ProfileRow>()
    return readError ? fail(readError) : ok(toAdminUser(data))
  },
}

/* ------------------------------------------------------------------ Listings (every status, with full seller profiles) */

async function allListings(id?: string): Promise<MarketplaceListing[]> {
  let query = supabase.from('listings').select('*').order('updated_at', { ascending: false })
  if (id) query = query.eq('id', id)
  const { data, error } = await query.returns<ListingRow[]>()
  if (error) throw error
  const sellers = new Map((await profiles()).map((p) => [p.id, profileToSellerPublic(p)]))
  return data.filter((r) => sellers.has(r.seller_id)).map((r) => ({ listing: toListing(r), seller: sellers.get(r.seller_id)! }))
}

async function review(id: string, action: string, reason?: string): Promise<ServiceResult<Listing>> {
  const { error } = await supabase.rpc('admin_review_listing', { p_listing: id, p_action: action, p_reason: reason ?? null })
  if (error) return fail(error)
  const { data, error: readError } = await supabase.from('listings').select('*').eq('id', id).single<ListingRow>()
  return readError ? fail(readError) : ok(toListing(data))
}

export const supabaseAdminListingService: AdminListingService = {
  list() {
    return guard(() => allListings())
  },
  async get(id) {
    const r = await guard(() => allListings(id))
    if (!r.ok) return r
    return r.data[0] ? ok(r.data[0]) : notFound('This listing')
  },
  approve: (id) => review(id, 'approve'),
  reject: (id, reason) => review(id, 'reject', reason),
  suspend: (id, reason) => review(id, 'suspend', reason),
  reinstate: (id) => review(id, 'reinstate'),
}

/* ------------------------------------------------------------------ Support queue */

async function adminTickets(id?: string): Promise<ServiceResult<AdminTicket[]>> {
  const tickets = await loadTickets(id)
  if (!tickets.ok) return tickets
  const people = new Map((await profiles()).map((p) => [p.id, p]))
  return ok(
    tickets.data.map((t) => {
      const p = people.get(t.requesterId)
      return { ...t, requesterName: p ? p.business_name || p.full_name || p.email : 'Unknown account', requesterRole: p?.role === 'seller' ? 'seller' : 'buyer' }
    }),
  )
}

async function oneAdminTicket(id: string): Promise<ServiceResult<AdminTicket>> {
  const r = await adminTickets(id)
  if (!r.ok) return r
  return r.data[0] ? ok(r.data[0]) : notFound('This ticket')
}

export const supabaseAdminSupportService: AdminSupportService = {
  list: () => adminTickets(),
  get: (id) => oneAdminTicket(id),
  async reply(id, message, status) {
    const { error } = await supabase.rpc('admin_ticket_action', { p_ticket: id, p_status: status, p_message: message })
    return error ? fail(error) : oneAdminTicket(id)
  },
  async setStatus(id, status) {
    const { error } = await supabase.rpc('admin_ticket_action', { p_ticket: id, p_status: status, p_message: null })
    return error ? fail(error) : oneAdminTicket(id)
  },
}

/* ------------------------------------------------------------------ Disputes */

interface DisputeRow {
  id: string
  reference: string
  order_id: string
  raised_by: Dispute['raisedBy']
  reason: Dispute['reason']
  description: string
  status: Dispute['status']
  resolution: string | null
  notes: Dispute['notes']
  created_at: string
  updated_at: string
}

async function disputes(): Promise<Dispute[]> {
  const { data, error } = await supabase.from('disputes').select('*').order('updated_at', { ascending: false }).returns<DisputeRow[]>()
  if (error) throw error
  if (data.length === 0) return []
  const { data: orders, error: orderError } = await supabase.from('orders').select('*').in('id', data.map((d) => d.order_id)).returns<OrderRow[]>()
  if (orderError) throw orderError
  const byId = new Map(orders.map((o) => [o.id, o]))
  // Order snapshots name the seller "HeyCileng seller"; admins see the real business name.
  const sellerNames = new Map((await profiles()).map((p) => [p.id, p.business_name || p.full_name]))
  return data.map((d) => {
    const o = byId.get(d.order_id)
    return {
      id: d.id,
      reference: d.reference,
      order: { id: d.order_id, reference: o?.reference ?? '', material: o?.listing.name ?? '' },
      raisedBy: d.raised_by,
      raisedByName: d.raised_by === 'buyer' ? (o?.buyer_business_name ?? 'Buyer') : ((o && sellerNames.get(o.seller_id)) ?? 'Seller'),
      reason: d.reason,
      description: d.description,
      status: d.status,
      resolution: d.resolution ?? undefined,
      notes: d.notes ?? [],
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }
  })
}

export const supabaseDisputeService: DisputeService = {
  list: () => guard(disputes),
  async update(id, update) {
    const { error } = await supabase.rpc('admin_update_dispute', { p_dispute: id, p_status: update.status ?? null, p_resolution: update.resolution ?? null, p_note: update.note ?? null })
    if (error) return fail(error)
    const r = await guard(disputes)
    if (!r.ok) return r
    const found = r.data.find((d) => d.id === id)
    return found ? ok(found) : notFound('This dispute')
  },
}

/* ------------------------------------------------------------------ Announcements, settings, audit */

interface AnnouncementRow {
  id: string
  title: string
  body: string
  audience: Announcement['audience']
  published_at: string
  published_by: string
}
const toAnnouncement = (a: AnnouncementRow): Announcement => ({ id: a.id, title: a.title, body: a.body, audience: a.audience, publishedAt: a.published_at, publishedBy: a.published_by })

export const supabaseAnnouncementService: AnnouncementService = {
  async list() {
    const { data, error } = await supabase.from('announcements').select('*').order('published_at', { ascending: false }).returns<AnnouncementRow[]>()
    return error ? fail(error) : ok(data.map(toAnnouncement))
  },
  async publish(input) {
    const { data, error } = await supabase.rpc('admin_publish_announcement', { p_title: input.title, p_body: input.body, p_audience: input.audience })
    if (error) return fail(error)
    const { data: row, error: readError } = await supabase.from('announcements').select('*').eq('id', data as string).single<AnnouncementRow>()
    return readError ? fail(readError) : ok(toAnnouncement(row))
  },
}

async function readSettings(): Promise<PlatformSettings> {
  const { data, error } = await supabase.from('platform_settings').select('data').eq('id', 1).single<{ data: PlatformSettings }>()
  if (error) throw error
  return data.data
}

export const supabaseSettingsService: SettingsService = {
  get: () => guard(readSettings),
  async update(settings) {
    const { error } = await supabase.rpc('admin_update_settings', { p_data: settings })
    if (error) return fail(error)
    applyMatchingSettings(settings.matching.weights, settings.matching.minRecommendedScore)
    return guard(readSettings)
  },
}

interface AuditRow {
  id: string
  at: string
  actor: string
  action: string
  target_type: AuditLogEntry['targetType']
  target_label: string
  detail: string | null
}

export const supabaseAuditService: AuditService = {
  async list() {
    const { data, error } = await supabase.from('audit_log').select('*').order('at', { ascending: false }).limit(500).returns<AuditRow[]>()
    if (error) return fail(error)
    return ok(data.map((e) => ({ id: e.id, at: e.at, actor: e.actor, action: e.action, targetType: e.target_type, targetLabel: e.target_label, detail: e.detail ?? undefined })))
  },
}

/* ------------------------------------------------------------------ Insights (shared calculations over live rows) */

async function insightsData(): Promise<InsightsData> {
  const [people, listingRows, requirementRows, orderRows, eventRows, ticketRows, disputeRows, settings] = await Promise.all([
    profiles(),
    supabase.from('listings').select('*').returns<ListingRow[]>(),
    supabase.from('requirements').select('*').returns<RequirementRow[]>(),
    supabase.from('orders').select('*').returns<OrderRow[]>(),
    supabase.from('order_events').select('*').order('at').returns<OrderEventRow[]>(),
    supabase.from('support_tickets').select('status'),
    supabase.from('disputes').select('status'),
    readSettings(),
  ])
  for (const r of [listingRows, requirementRows, orderRows, eventRows, ticketRows, disputeRows]) if (r.error) throw r.error
  return {
    accounts: people.map(toAdminUser),
    sellers: people.filter((p) => p.role === 'seller').map((p) => ({ id: p.id, businessName: p.business_name || p.full_name })),
    listings: listingRows.data!.map(toListing),
    requirements: requirementRows.data!.map(toRequirement),
    // Order snapshots are anonymised; reports use the real seller names.
    orders: orderRows.data!.map((o) => {
      const order = toOrder(o, eventRows.data!)
      const seller = people.find((p) => p.id === order.sellerId)
      return seller ? { ...order, listing: { ...order.listing, sellerBusinessName: seller.business_name || seller.full_name } } : order
    }),
    tickets: (ticketRows.data ?? []) as InsightsData['tickets'],
    disputes: (disputeRows.data ?? []) as InsightsData['disputes'],
    settings,
  }
}

export const supabaseInsightsService: AdminInsightsService = {
  overview: () => guard(async () => computeOverview(await insightsData())),
  reports: () => guard(async () => computeReports(await insightsData())),
  matchmaking: () => guard(async () => computeMatchmaking(await insightsData())),
  commissions: () => guard(async () => computeCommissions(await insightsData())),
}
