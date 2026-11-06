import { applyMatchingSettings } from '@/config/matching'
import type { AppNotification } from '@/types/notification'
import type { SupportTicket, TicketMessage } from '@/types/support'
import type { BuyerProfile, SellerProfile } from '@/types/user'
import type { ContactService, NotificationService, PlatformConfigService, ProfileService, ServiceResult, SupportService } from '../types'
import { currentUserId, supabase } from './client'
import { fail, notFound, ok, signedOut } from './errors'
import type { ProfileRow } from './mappers'

/* ------------------------------------------------------------------ Notifications */

interface NotificationRow {
  id: string
  category: AppNotification['category']
  title: string
  body: string
  href: string | null
  read: boolean
  created_at: string
}

export const supabaseNotificationService: NotificationService = {
  async list() {
    const uid = await currentUserId()
    if (!uid) return ok([])
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(200).returns<NotificationRow[]>()
    if (error) return fail(error)
    return ok(data.map((n) => ({ id: n.id, category: n.category, title: n.title, body: n.body, href: n.href ?? undefined, read: n.read, createdAt: n.created_at })))
  },
  async markRead(id) {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
    return error ? fail(error) : ok(null)
  },
  async markAllRead() {
    const uid = await currentUserId()
    if (!uid) return signedOut()
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', uid).eq('read', false)
    return error ? fail(error) : ok(null)
  },
  subscribe(onNew) {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let closed = false
    void supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id
      if (!uid || closed) return
      // After a page reload the socket can connect before the restored session reaches it; without the
      // user's token, RLS filters out every row. Hand it over explicitly before joining.
      await supabase.realtime.setAuth(data.session!.access_token)
      if (closed) return
      // RLS limits the stream to this user's rows; the filter just avoids needless events.
      channel = supabase
        // Unique per subscriber: several views may listen at once, and channel names must not clash.
        .channel(`notifications:${uid}:${crypto.randomUUID()}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` }, () => onNew())
        .subscribe()
    })
    return () => {
      closed = true
      if (channel) void supabase.removeChannel(channel)
    }
  },
}

/* ------------------------------------------------------------------ Profiles */

async function myProfile(): Promise<ServiceResult<ProfileRow>> {
  const uid = await currentUserId()
  if (!uid) return signedOut()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single<ProfileRow>()
  return error ? fail(error) : ok(data)
}

const toBuyerProfile = (p: ProfileRow): BuyerProfile => ({
  userId: p.id,
  fullName: p.full_name,
  email: p.email,
  phone: p.phone,
  businessName: p.business_name,
  industry: p.industry,
  location: { state: p.state, area: p.area },
  about: p.description,
  updatedAt: p.updated_at,
})

const toSellerProfile = (p: ProfileRow): SellerProfile => ({
  userId: p.id,
  fullName: p.full_name,
  email: p.email,
  phone: p.phone,
  businessName: p.business_name,
  location: { state: p.state, area: p.area },
  description: p.description,
  updatedAt: p.updated_at,
})

async function updateMine(fields: Partial<ProfileRow>) {
  const uid = await currentUserId()
  if (!uid) return signedOut<ProfileRow>()
  const { data, error } = await supabase.from('profiles').update(fields).eq('id', uid).select().single<ProfileRow>()
  return error ? fail<ProfileRow>(error) : ok(data)
}

export const supabaseProfileService: ProfileService = {
  async getBuyerProfile() {
    const r = await myProfile()
    return r.ok ? ok(toBuyerProfile(r.data)) : r
  },
  async updateBuyerProfile(input) {
    const r = await updateMine({ full_name: input.fullName, phone: input.phone, business_name: input.businessName, industry: input.industry, description: input.about, state: input.location.state, area: input.location.area })
    return r.ok ? ok(toBuyerProfile(r.data)) : r
  },
  async getSellerProfile() {
    const r = await myProfile()
    return r.ok ? ok(toSellerProfile(r.data)) : r
  },
  async updateSellerProfile(input) {
    const r = await updateMine({ full_name: input.fullName, phone: input.phone, business_name: input.businessName, description: input.description, state: input.location.state, area: input.location.area })
    return r.ok ? ok(toSellerProfile(r.data)) : r
  },
}

/* ------------------------------------------------------------------ Support */

interface TicketRow {
  id: string
  reference: string
  requester_id: string
  subject: string
  category: SupportTicket['category']
  order_id: string | null
  order_reference: string | null
  status: SupportTicket['status']
  created_at: string
  updated_at: string
}

interface MessageRow {
  id: string
  ticket_id: string
  author: TicketMessage['author']
  body: string
  at: string
}

/** Loads tickets (RLS limits users to their own; admins see all) with their messages. */
export async function loadTickets(id?: string): Promise<ServiceResult<SupportTicket[]>> {
  let query = supabase.from('support_tickets').select('*').order('updated_at', { ascending: false })
  if (id) query = query.eq('id', id)
  const { data: rows, error } = await query.returns<TicketRow[]>()
  if (error) return fail(error)
  if (rows.length === 0) return ok([])
  const { data: messages, error: messageError } = await supabase.from('ticket_messages').select('*').in('ticket_id', rows.map((r) => r.id)).order('at').returns<MessageRow[]>()
  if (messageError) return fail(messageError)
  return ok(
    rows.map((t) => ({
      id: t.id,
      reference: t.reference,
      requesterId: t.requester_id,
      subject: t.subject,
      category: t.category,
      order: t.order_id ? { id: t.order_id, reference: t.order_reference ?? '' } : undefined,
      status: t.status,
      messages: messages.filter((m) => m.ticket_id === t.id).map((m) => ({ id: m.id, author: m.author, body: m.body, at: m.at })),
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    })),
  )
}

async function oneTicket(id: string): Promise<ServiceResult<SupportTicket>> {
  const r = await loadTickets(id)
  if (!r.ok) return r
  return r.data[0] ? ok(r.data[0]) : notFound('This ticket')
}

export const supabaseSupportService: SupportService = {
  async listMine() {
    const uid = await currentUserId()
    if (!uid) return signedOut()
    const r = await loadTickets()
    return r.ok ? ok(r.data.filter((t) => t.requesterId === uid)) : r
  },
  get(id) {
    return oneTicket(id)
  },
  async create(input) {
    const { data, error } = await supabase.rpc('create_ticket', { p_subject: input.subject, p_category: input.category, p_order: input.orderId ?? null, p_message: input.message })
    if (error) return fail(error)
    return oneTicket(data as string)
  },
  async reply(id, message) {
    const { error } = await supabase.rpc('user_ticket_action', { p_ticket: id, p_action: 'reply', p_message: message })
    return error ? fail(error) : oneTicket(id)
  },
  async markResolved(id) {
    const { error } = await supabase.rpc('user_ticket_action', { p_ticket: id, p_action: 'resolve' })
    return error ? fail(error) : oneTicket(id)
  },
}

/* ------------------------------------------------------------------ Contact & public config */

export const supabaseContactService: ContactService = {
  async submitMessage(input) {
    // Visitors may insert but not read messages back, so don't request the inserted row.
    const { error } = await supabase
      .from('contact_messages')
      .insert({ name: input.name, email: input.email, organisation: input.organisation || null, topic: input.topic, message: input.message })
    if (error) return fail(error)
    return ok({ reference: `HC-MSG-${crypto.randomUUID().slice(0, 8).toUpperCase()}` })
  },
}

interface PublicConfig {
  maxImagesPerListing: number
  commissionRatePercent: number
  matching: { weights: Record<'material' | 'quantity' | 'location' | 'price' | 'application' | 'quality', number>; minRecommendedScore: number }
}

export const supabasePlatformConfigService: PlatformConfigService = {
  async get() {
    const { data, error } = await supabase.rpc('get_public_config')
    if (error) return fail(error)
    const config = data as PublicConfig
    // Keep matching in step with the weights HeyCileng has configured.
    applyMatchingSettings(config.matching.weights, config.matching.minRecommendedScore)
    return ok({ maxImagesPerListing: config.maxImagesPerListing, commissionRatePercent: config.commissionRatePercent })
  },
}
