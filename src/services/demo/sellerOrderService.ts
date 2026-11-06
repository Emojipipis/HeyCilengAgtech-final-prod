import { formatQuantity } from '@/lib/format'
import { availableQuantity } from '@/lib/inventory'
import type { Order } from '@/types/order'
import type { SellerOrderService } from '../types'
import { demoActor } from './actor'
import { demoDb, nextId, notify, nowISO } from './db'
import { copy, delay, invalid, notFound, ok } from './shared'

const mine = (order: Order) => order.sellerId === demoActor.id

/** Sellers never receive the buyer's delivery address or private note — those are for HeyCileng and logistics. */
function forSeller(order: Order): Order {
  const { deliveryAddress: _address, buyerNote: _note, ...rest } = copy(order)
  return rest
}

function find(id: string) {
  return demoDb.orders.find((o) => o.id === id && mine(o))
}

export const demoSellerOrderService: SellerOrderService = {
  async listIncoming() {
    await delay(400)
    return ok(demoDb.orders.filter(mine).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(forSeller))
  },

  async get(id) {
    await delay(300)
    const order = find(id)
    return order ? ok(forSeller(order)) : notFound('This order')
  },

  async accept(id) {
    await delay(600)
    const order = find(id)
    if (!order) return notFound('This order')
    if (order.status !== 'pending') return invalid('Only pending requests can be accepted.')
    const listing = demoDb.listings.find((l) => l.id === order.listingId)
    if (!listing) return notFound('The listing for this order')
    const available = availableQuantity(listing)
    if (order.quantity > available) {
      return invalid(
        `Only ${formatQuantity(available, listing.unit)} is available, but this order needs ${formatQuantity(order.quantity, listing.unit)}. Update your listing or decline the request.`,
      )
    }
    listing.reservedQuantity += order.quantity
    const at = nowISO()
    order.status = 'accepted'
    order.updatedAt = at
    order.timeline.push(
      { id: nextId('demo-evt'), at, status: 'accepted', actor: 'seller', title: 'Seller accepted the order', description: 'The requested quantity is now reserved for this order.' },
      ...(order.fulfilment === 'delivery'
        ? [{ id: nextId('demo-evt'), at, actor: 'heycileng' as const, title: 'Awaiting logistics assignment', description: 'HeyCileng will assign a logistics partner and confirm the delivery fee.' }]
        : []),
    )
    notify(order.buyerId, {
      category: 'order',
      title: `Seller accepted order ${order.reference}`,
      body: `${order.listing.name} · ${formatQuantity(order.quantity, order.listing.unit)}. HeyCileng will arrange the next steps.`,
      href: `/buyer/orders/${order.id}`,
    })
    return ok(forSeller(order))
  },

  async decline(id, reason) {
    await delay(500)
    const order = find(id)
    if (!order) return notFound('This order')
    if (order.status !== 'pending') return invalid('Only pending requests can be declined.')
    const at = nowISO()
    order.status = 'declined'
    order.updatedAt = at
    order.timeline.push({ id: nextId('demo-evt'), at, status: 'declined', actor: 'seller', title: 'Seller declined the order', description: reason || undefined })
    notify(order.buyerId, {
      category: 'order',
      title: `Order ${order.reference} was declined`,
      body: 'The seller couldn’t fulfil this request. No stock was reserved and nothing was charged.',
      href: `/buyer/orders/${order.id}`,
    })
    return ok(forSeller(order))
  },

  async startProcessing(id) {
    await delay(500)
    const order = find(id)
    if (!order) return notFound('This order')
    if (order.status !== 'accepted') return invalid('Only accepted orders can move to processing.')
    const at = nowISO()
    order.status = 'processing'
    order.updatedAt = at
    order.timeline.push({ id: nextId('demo-evt'), at, status: 'processing', actor: 'seller', title: 'Order is being prepared' })
    notify(order.buyerId, {
      category: 'order',
      title: `Order ${order.reference} is being prepared`,
      body: 'The seller has started preparing your order.',
      href: `/buyer/orders/${order.id}`,
    })
    return ok(forSeller(order))
  },
}
