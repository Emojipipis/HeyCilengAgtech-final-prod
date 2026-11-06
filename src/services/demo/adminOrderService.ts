import { getStatusMeta } from '@/config/statuses'
import { formatCurrency, formatDate, formatQuantity } from '@/lib/format'
import { DELIVERY_FLOW } from '@/lib/logistics'
import type { Order, OrderEvent } from '@/types/order'
import type { OrderStatus } from '@/types/status'
import type { AdminOrderService } from '../types'
import { audit, demoDb, nextId, notify, nowISO } from './db'
import { copy, delay, invalid, notFound, ok } from './shared'

/** Order statuses in which the seller's stock is reserved for the order. */
const HOLDS_STOCK: OrderStatus[] = ['accepted', 'processing', 'dispatched', 'ready_for_collection', 'delivery_failed']

const PAYER = { buyer: 'the buyer', seller: 'the seller', heycileng: 'HeyCileng' } as const

function find(id: string) {
  return demoDb.orders.find((o) => o.id === id)
}

function listingFor(order: Order) {
  return demoDb.listings.find((l) => l.id === order.listingId)
}

/** Reserved stock becomes sold. */
function settleStock(order: Order) {
  const listing = listingFor(order)
  if (!listing) return
  listing.reservedQuantity = Math.max(0, listing.reservedQuantity - order.quantity)
  listing.soldQuantity += order.quantity
}

function releaseStock(order: Order) {
  const listing = listingFor(order)
  if (listing && HOLDS_STOCK.includes(order.status)) listing.reservedQuantity = Math.max(0, listing.reservedQuantity - order.quantity)
}

function record(order: Order, event: Omit<OrderEvent, 'id' | 'at' | 'actor'>) {
  const at = nowISO()
  if (event.status) order.status = event.status
  order.updatedAt = at
  order.timeline.push({ ...event, id: nextId('demo-evt'), at, actor: 'heycileng' })
}

/** Platform notification to both parties. Neither sees the other's contact details. */
function notifyBoth(order: Order, title: string, body: string, category: 'order' | 'delivery' = 'delivery') {
  notify(order.buyerId, { category, title, body, href: `/buyer/orders/${order.id}` })
  notify(order.sellerId, { category, title, body, href: `/seller/orders/${order.id}` })
}

export const demoAdminOrderService: AdminOrderService = {
  async listAll() {
    await delay(400)
    return ok(copy([...demoDb.orders].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))))
  },

  async get(id) {
    await delay(300)
    const order = find(id)
    return order ? ok(copy(order)) : notFound('This order')
  },

  async assignDelivery(orderId, input) {
    await delay(600)
    const order = find(orderId)
    if (!order) return notFound('This order')
    if (order.fulfilment !== 'delivery') return invalid('This is a collection order — it doesn’t need a logistics partner.')
    if (!['accepted', 'processing', 'delivery_failed'].includes(order.status)) {
      return invalid(`Logistics can be assigned once the seller has accepted the order (current status: ${getStatusMeta('order', order.status).label}).`)
    }
    const partner = demoDb.partners.find((p) => p.id === input.partnerId)
    if (!partner) return notFound('That logistics partner')
    if (partner.status !== 'active') return invalid(`${partner.name} is inactive and can’t take new deliveries.`)
    if (!(input.fee >= 0)) return invalid('Enter a valid delivery fee.')

    const reassigning = Boolean(order.delivery?.partnerId)
    const at = nowISO()
    order.delivery = {
      ...(order.delivery ?? { history: [] }),
      status: 'assigned',
      partnerId: partner.id,
      partnerName: partner.name,
      fee: input.fee,
      feePayer: input.feePayer,
      estimatedDate: input.estimatedDate,
      trackingReference: input.trackingReference || order.delivery?.trackingReference,
      history: [...(order.delivery?.history ?? []), { at, status: 'assigned', note: input.note || `${partner.name} assigned by HeyCileng.` }],
    }
    const summary = `${partner.name} · delivery fee ${formatCurrency(input.fee)} paid by ${PAYER[input.feePayer]} · estimated ${formatDate(input.estimatedDate)}`
    record(order, { title: reassigning ? 'Logistics partner updated' : 'Logistics partner assigned', description: summary })
    notifyBoth(order, `Delivery arranged for ${order.reference}`, summary)
    audit({ action: reassigning ? 'Updated logistics' : 'Assigned logistics partner', targetType: 'order', targetLabel: order.reference, detail: summary })
    return ok(copy(order))
  },

  async updateDelivery(orderId, input) {
    await delay(600)
    const order = find(orderId)
    if (!order) return notFound('This order')
    const delivery = order.delivery
    if (order.fulfilment !== 'delivery' || !delivery?.partnerId) return invalid('Assign a logistics partner before updating the delivery.')
    const allowed = DELIVERY_FLOW[delivery.status] ?? []
    if (!allowed.includes(input.status)) {
      return invalid(`A delivery that is ${getStatusMeta('delivery', delivery.status).label.toLowerCase()} can’t move to ${getStatusMeta('delivery', input.status).label.toLowerCase()}.`)
    }
    if (input.status === 'failed' && !input.note?.trim()) return invalid('Add a note explaining why the delivery failed.')

    const at = nowISO()
    delivery.status = input.status
    if (input.estimatedDate) delivery.estimatedDate = input.estimatedDate
    if (input.trackingReference) delivery.trackingReference = input.trackingReference
    delivery.history.push({ at, status: input.status, note: input.note?.trim() || undefined })
    const label = getStatusMeta('delivery', input.status).label
    audit({ action: `Marked delivery ${label.toLowerCase()}`, targetType: 'order', targetLabel: order.reference, detail: input.note?.trim() || undefined })

    if (input.status === 'in_transit') {
      record(order, { status: 'dispatched', title: 'Order dispatched', description: input.note || 'Picked up by the assigned logistics partner.' })
      notifyBoth(order, `Order ${order.reference} is on its way`, delivery.estimatedDate ? `Estimated delivery: ${formatDate(delivery.estimatedDate)}.` : 'Picked up by the logistics partner.')
    } else if (input.status === 'delivered') {
      settleStock(order)
      record(order, { status: 'completed', title: 'Delivered', description: input.note || 'Delivery confirmed by HeyCileng.' })
      notifyBoth(order, `Order ${order.reference} delivered`, `${order.listing.name} · ${formatQuantity(order.quantity, order.listing.unit)} delivered and confirmed by HeyCileng.`, 'order')
    } else if (input.status === 'failed') {
      record(order, { status: 'delivery_failed', title: 'Delivery failed', description: `${input.note!.trim()} HeyCileng support will follow up.` })
      notifyBoth(order, `Delivery problem with ${order.reference}`, 'The delivery couldn’t be completed. HeyCileng support will contact you to rearrange.')
    } else {
      // Scheduled (including rescheduling after a failure).
      const rescheduled = order.status === 'delivery_failed'
      record(order, {
        status: rescheduled ? 'processing' : undefined,
        title: rescheduled ? 'Delivery rescheduled' : 'Delivery scheduled',
        description: input.note || (delivery.estimatedDate ? `Estimated delivery: ${formatDate(delivery.estimatedDate)}.` : undefined),
      })
      notifyBoth(order, `Delivery ${rescheduled ? 'rescheduled' : 'scheduled'} for ${order.reference}`, delivery.estimatedDate ? `Estimated delivery: ${formatDate(delivery.estimatedDate)}.` : label)
    }
    return ok(copy(order))
  },

  async markReadyForCollection(orderId, note) {
    await delay(500)
    const order = find(orderId)
    if (!order) return notFound('This order')
    if (order.fulfilment !== 'collection') return invalid('Only collection orders can be marked ready for collection.')
    if (!['accepted', 'processing'].includes(order.status)) return invalid('The order must be accepted or processing first.')
    const at = nowISO()
    order.delivery = { status: 'ready_for_collection', history: [...(order.delivery?.history ?? []), { at, status: 'ready_for_collection', note: note || undefined }] }
    record(order, { status: 'ready_for_collection', title: 'Ready for collection', description: note || 'HeyCileng will share collection instructions with the buyer.' })
    notifyBoth(order, `Order ${order.reference} is ready for collection`, note || 'HeyCileng will share the collection point and instructions.', 'order')
    audit({ action: 'Marked ready for collection', targetType: 'order', targetLabel: order.reference })
    return ok(copy(order))
  },

  async markCollected(orderId) {
    await delay(500)
    const order = find(orderId)
    if (!order) return notFound('This order')
    if (order.status !== 'ready_for_collection') return invalid('Only orders that are ready for collection can be marked collected.')
    const at = nowISO()
    order.delivery = { status: 'collected', history: [...(order.delivery?.history ?? []), { at, status: 'collected' }] }
    settleStock(order)
    record(order, { status: 'completed', title: 'Collected', description: 'Collection confirmed by HeyCileng.' })
    notifyBoth(order, `Order ${order.reference} completed`, 'Collection confirmed by HeyCileng.', 'order')
    audit({ action: 'Confirmed collection', targetType: 'order', targetLabel: order.reference })
    return ok(copy(order))
  },

  async cancel(orderId, reason) {
    await delay(500)
    const order = find(orderId)
    if (!order) return notFound('This order')
    if (['completed', 'cancelled', 'declined'].includes(order.status)) return invalid('This order is already closed.')
    if (!reason.trim()) return invalid('Add a reason for cancelling.')
    releaseStock(order)
    record(order, { status: 'cancelled', title: 'Cancelled by HeyCileng', description: reason.trim() })
    audit({ action: 'Cancelled order', targetType: 'order', targetLabel: order.reference, detail: reason.trim() })
    notifyBoth(order, `Order ${order.reference} was cancelled`, 'HeyCileng cancelled this order. Any reserved stock has been released. Contact support for details.', 'order')
    return ok(copy(order))
  },
}
