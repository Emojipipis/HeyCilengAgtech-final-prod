import { formatQuantity } from '@/lib/format'
import type { LogisticsPartner } from '@/types/logistics'
import type { ListingImageInput } from '@/types/listing'
import type { Order } from '@/types/order'
import type { AdminOrderService, LogisticsService, OrderService, SellerListingService, SellerOrderService, ServiceResult } from '../types'
import { currentUserId, supabase } from './client'
import { fail, invalid, notFound, ok, signedOut } from './errors'
import { toListing, toOrder, type ListingRow, type OrderEventRow, type OrderRow } from './mappers'

/** Loads orders from a table or view and attaches their timelines. */
async function loadOrders(source: 'orders' | 'seller_orders', filter: { column: string; value: string } | null, id?: string): Promise<ServiceResult<Order[]>> {
  let query = supabase.from(source).select('*').order('created_at', { ascending: false })
  if (filter) query = query.eq(filter.column, filter.value)
  if (id) query = query.eq('id', id)
  const { data: rows, error } = await query.returns<OrderRow[]>()
  if (error) return fail(error)
  if (rows.length === 0) return ok([])
  const { data: events, error: eventError } = await supabase.from('order_events').select('*').in('order_id', rows.map((r) => r.id)).order('at').returns<OrderEventRow[]>()
  if (eventError) return fail(eventError)
  return ok(rows.map((r) => toOrder(r, events)))
}

async function one(source: 'orders' | 'seller_orders', id: string): Promise<ServiceResult<Order>> {
  const result = await loadOrders(source, null, id)
  if (!result.ok) return result
  return result.data[0] ? ok(result.data[0]) : notFound('This order')
}

/** Runs a database function, then returns the refreshed order. */
async function rpcThen(source: 'orders' | 'seller_orders', id: string, fn: string, args: Record<string, unknown>): Promise<ServiceResult<Order>> {
  const { error } = await supabase.rpc(fn, args)
  if (error) return fail(error)
  return one(source, id)
}

/* ------------------------------------------------------------------ Buyer */

export const supabaseOrderService: OrderService = {
  async listMine() {
    const uid = await currentUserId()
    if (!uid) return signedOut()
    return loadOrders('orders', { column: 'buyer_id', value: uid })
  },
  get(id) {
    return one('orders', id)
  },
  async requestOrder(input) {
    const { data, error } = await supabase.rpc('request_order', {
      p_listing: input.listingId,
      p_quantity: input.quantity,
      p_fulfilment: input.fulfilment,
      p_address: input.deliveryAddress ?? null,
      p_preferred: input.preferredDate ?? null,
      p_note: input.buyerNote ?? null,
    })
    if (error) return fail(error)
    return one('orders', data as string)
  },
  cancel(id, reason) {
    return rpcThen('orders', id, 'buyer_cancel_order', { p_order: id, p_reason: reason })
  },
}

/* ------------------------------------------------------------------ Seller orders (view without address / buyer note) */

export const supabaseSellerOrderService: SellerOrderService = {
  async listIncoming() {
    return loadOrders('seller_orders', null)
  },
  get(id) {
    return one('seller_orders', id)
  },
  accept(id) {
    return rpcThen('seller_orders', id, 'seller_respond', { p_order: id, p_action: 'accept' })
  },
  decline(id, reason) {
    return rpcThen('seller_orders', id, 'seller_respond', { p_order: id, p_action: 'decline', p_reason: reason })
  },
  startProcessing(id) {
    return rpcThen('seller_orders', id, 'seller_respond', { p_order: id, p_action: 'process' })
  },
}

/* ------------------------------------------------------------------ Seller listings */

/** Uploads new image files to the seller's folder in Storage and returns the stored image list. */
async function storeImages(sellerId: string, images: ListingImageInput[]) {
  const stored = []
  for (const image of images) {
    if (!image.file) {
      stored.push({ id: image.id, url: image.url, alt: image.alt })
      continue
    }
    const ext = image.file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${sellerId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('listing-images').upload(path, image.file, { contentType: image.file.type, upsert: false })
    if (error) throw error
    stored.push({ id: image.id, url: supabase.storage.from('listing-images').getPublicUrl(path).data.publicUrl, alt: image.alt })
  }
  return stored
}

export const supabaseSellerListingService: SellerListingService = {
  async listMine() {
    const uid = await currentUserId()
    if (!uid) return signedOut()
    const { data, error } = await supabase.from('listings').select('*').eq('seller_id', uid).order('updated_at', { ascending: false }).returns<ListingRow[]>()
    return error ? fail(error) : ok(data.map(toListing))
  },

  async get(id) {
    const uid = await currentUserId()
    const { data, error } = await supabase.from('listings').select('*').eq('id', id).eq('seller_id', uid ?? '').maybeSingle<ListingRow>()
    if (error) return fail(error)
    return data ? ok(toListing(data)) : notFound('This listing')
  },

  async create(input) {
    const uid = await currentUserId()
    if (!uid) return signedOut()
    try {
      const images = await storeImages(uid, input.images)
      const { data, error } = await supabase
        .from('listings')
        .insert({
          name: input.name,
          category: input.category,
          description: input.description,
          unit: input.unit,
          listed_quantity: input.listedQuantity,
          min_order_quantity: input.minOrderQuantity,
          price_per_unit: input.pricePerUnit,
          state: input.location.state,
          area: input.location.area,
          quality_tags: input.qualityTags,
          quality_specifications: input.qualitySpecifications,
          applications: input.applications,
          images,
        })
        .select()
        .single<ListingRow>()
      return error ? fail(error) : ok(toListing(data))
    } catch (error) {
      return fail(error as { message?: string })
    }
  },

  async update(id, input) {
    const current = await this.get(id)
    if (!current.ok) return current
    const committed = current.data.reservedQuantity + current.data.soldQuantity
    if (input.listedQuantity < committed) {
      return invalid(`Listed quantity can’t be less than ${formatQuantity(committed, current.data.unit)} — the amount already reserved or sold.`)
    }
    try {
      const images = await storeImages(current.data.sellerId, input.images)
      const { data, error } = await supabase
        .from('listings')
        .update({
          name: input.name,
          category: input.category,
          description: input.description,
          unit: input.unit,
          listed_quantity: input.listedQuantity,
          min_order_quantity: input.minOrderQuantity,
          price_per_unit: input.pricePerUnit,
          state: input.location.state,
          area: input.location.area,
          quality_tags: input.qualityTags,
          quality_specifications: input.qualitySpecifications,
          applications: input.applications,
          images,
        })
        .eq('id', id)
        .select()
        .single<ListingRow>()
      return error ? fail(error) : ok(toListing(data))
    } catch (error) {
      return fail(error as { message?: string })
    }
  },

  async setPaused(id, paused) {
    const { data, error } = await supabase.from('listings').update({ status: paused ? 'paused' : 'active' }).eq('id', id).select().single<ListingRow>()
    return error ? fail(error) : ok(toListing(data))
  },

  async remove(id) {
    // RLS refuses deletes while stock is reserved or orders are open — that shows up as zero rows deleted.
    const { data, error } = await supabase.from('listings').delete().eq('id', id).select('id')
    if (error) return fail(error)
    if (!data || data.length === 0) return invalid('This listing has open orders or reserved stock. Pause it instead, or contact HeyCileng support.')
    return ok(null)
  },
}

/* ------------------------------------------------------------------ Admin orders & logistics */

/**
 * Buyers and sellers are anonymous to each other ("HeyCileng seller" in order snapshots). Administrators
 * read real seller names from profiles, plus the private reasons parties typed (RLS: admins only).
 */
async function forAdmin(orders: Order[], withNotes: boolean): Promise<ServiceResult<Order[]>> {
  if (orders.length === 0) return ok(orders)
  const sellerIds = [...new Set(orders.map((o) => o.sellerId))]
  const [{ data: sellers, error }, notes] = await Promise.all([
    supabase.from('profiles').select('id, business_name, full_name').in('id', sellerIds),
    withNotes
      ? supabase.from('order_private_notes').select('order_id, actor, title, note, at').in('order_id', orders.map((o) => o.id)).order('at')
      : Promise.resolve({ data: [] as { order_id: string; actor: 'buyer' | 'seller'; title: string; note: string; at: string }[], error: null }),
  ])
  if (error) return fail(error)
  if (notes.error) return fail(notes.error)
  const name = new Map((sellers ?? []).map((p) => [p.id as string, (p.business_name || p.full_name) as string]))
  return ok(
    orders.map((o) => ({
      ...o,
      listing: { ...o.listing, sellerBusinessName: name.get(o.sellerId) ?? o.listing.sellerBusinessName },
      partyNotes: withNotes ? (notes.data ?? []).filter((n) => n.order_id === o.id).map(({ actor, title, note, at }) => ({ actor, title, note, at })) : undefined,
    })),
  )
}

async function adminRpcThen(id: string, fn: string, args: Record<string, unknown>): Promise<ServiceResult<Order>> {
  const { error } = await supabase.rpc(fn, args)
  return error ? fail(error) : adminOne(id)
}

async function adminOne(id: string): Promise<ServiceResult<Order>> {
  const r = await one('orders', id)
  if (!r.ok) return r
  const enriched = await forAdmin([r.data], true)
  return enriched.ok ? ok(enriched.data[0]) : enriched
}

export const supabaseAdminOrderService: AdminOrderService = {
  async listAll() {
    const r = await loadOrders('orders', null)
    if (!r.ok) return r
    return forAdmin([...r.data].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), false)
  },
  get(id) {
    return adminOne(id)
  },
  assignDelivery(orderId, input) {
    return adminRpcThen(orderId, 'admin_assign_delivery', {
      p_order: orderId,
      p_partner: input.partnerId,
      p_fee: input.fee,
      p_fee_payer: input.feePayer,
      p_estimated: input.estimatedDate,
      p_tracking: input.trackingReference ?? null,
      p_note: input.note ?? null,
    })
  },
  updateDelivery(orderId, input) {
    return adminRpcThen(orderId, 'admin_update_delivery', {
      p_order: orderId,
      p_status: input.status,
      p_note: input.note ?? null,
      p_estimated: input.estimatedDate ?? null,
      p_tracking: input.trackingReference ?? null,
    })
  },
  markReadyForCollection(orderId, note) {
    return adminRpcThen(orderId, 'admin_collection', { p_order: orderId, p_action: 'ready', p_note: note ?? null })
  },
  markCollected(orderId) {
    return adminRpcThen(orderId, 'admin_collection', { p_order: orderId, p_action: 'collected' })
  },
  cancel(orderId, reason) {
    return adminRpcThen(orderId, 'admin_cancel_order', { p_order: orderId, p_reason: reason })
  },
}

interface PartnerRow {
  id: string
  name: string
  coverage_states: string[]
  vehicle_types: string
  contact_name: string
  contact_phone: string
  status: 'active' | 'inactive'
  notes: string
  created_at: string
}

const toPartner = (r: PartnerRow): LogisticsPartner => ({
  id: r.id,
  name: r.name,
  coverageStates: r.coverage_states,
  vehicleTypes: r.vehicle_types,
  contactName: r.contact_name,
  contactPhone: r.contact_phone,
  status: r.status,
  notes: r.notes,
  createdAt: r.created_at,
})

export const supabaseLogisticsService: LogisticsService = {
  async listPartners() {
    const { data, error } = await supabase.from('logistics_partners').select('*').order('name').returns<PartnerRow[]>()
    return error ? fail(error) : ok(data.map(toPartner))
  },
  async createPartner(input) {
    const { data, error } = await supabase
      .from('logistics_partners')
      .insert({ name: input.name, coverage_states: input.coverageStates, vehicle_types: input.vehicleTypes, contact_name: input.contactName, contact_phone: input.contactPhone, notes: input.notes })
      .select()
      .single<PartnerRow>()
    return error ? fail(error) : ok(toPartner(data))
  },
  async updatePartner(id, input) {
    const { data, error } = await supabase
      .from('logistics_partners')
      .update({ name: input.name, coverage_states: input.coverageStates, vehicle_types: input.vehicleTypes, contact_name: input.contactName, contact_phone: input.contactPhone, notes: input.notes })
      .eq('id', id)
      .select()
      .single<PartnerRow>()
    if (error) return fail(error)
    return ok(toPartner(data))
  },
  async setPartnerStatus(id, status) {
    const { data, error } = await supabase.from('logistics_partners').update({ status }).eq('id', id).select().single<PartnerRow>()
    return error ? fail(error) : ok(toPartner(data))
  },
}
