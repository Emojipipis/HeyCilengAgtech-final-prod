import { formatQuantity } from '@/lib/format'
import { availableQuantity } from '@/lib/inventory'
import type { Order } from '@/types/order'
import type { OrderService } from '../types'
import { demoActor } from './actor'
import { demoDb, nextId, notify, nowISO } from './db'
import { copy, delay, invalid, notFound, ok } from './shared'

let referenceCounter = 1100

const mine = (order: Order) => order.buyerId === demoActor.id

export const demoOrderService: OrderService = {
  async listMine() {
    await delay(400)
    return ok(copy(demoDb.orders.filter(mine).sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
  },

  async get(id) {
    await delay(300)
    const order = demoDb.orders.find((o) => o.id === id && mine(o))
    return order ? ok(copy(order)) : notFound('This order')
  },

  async requestOrder(input) {
    await delay(700)
    const listing = demoDb.listings.find((l) => l.id === input.listingId)
    if (!listing || listing.status !== 'active') return notFound('This listing')
    const available = availableQuantity(listing)
    if (input.quantity < listing.minOrderQuantity) {
      return invalid(`The minimum order is ${formatQuantity(listing.minOrderQuantity, listing.unit)}.`)
    }
    if (input.quantity > available) {
      return invalid(`Only ${formatQuantity(available, listing.unit)} is currently available.`)
    }
    const seller = demoDb.sellers.find((s) => s.id === listing.sellerId)!
    const at = nowISO()
    const order: Order = {
      id: nextId('demo-order'),
      reference: `HC-DEMO-${++referenceCounter}`,
      listingId: listing.id,
      listing: {
        name: listing.name,
        category: listing.category,
        unit: listing.unit,
        pricePerUnit: listing.pricePerUnit,
        sellerBusinessName: seller.businessName,
        sellerLocation: seller.location,
      },
      buyerId: demoActor.id,
      buyerBusinessName: demoDb.buyerProfile.businessName,
      sellerId: seller.id,
      quantity: input.quantity,
      subtotal: input.quantity * listing.pricePerUnit,
      fulfilment: input.fulfilment,
      deliveryAddress: input.fulfilment === 'delivery' ? input.deliveryAddress : undefined,
      preferredDate: input.preferredDate,
      buyerNote: input.buyerNote,
      status: 'pending',
      delivery: input.fulfilment === 'delivery' ? { status: 'not_assigned', history: [] } : null,
      payment: { status: 'unpaid', payoutStatus: 'not_due' },
      timeline: [
        {
          id: nextId('demo-evt'),
          at,
          status: 'pending',
          actor: 'buyer',
          title: 'Order request sent',
          description: 'Waiting for the seller to respond. Stock is not reserved until the seller accepts.',
        },
      ],
      createdAt: at,
      updatedAt: at,
      isDemo: true,
    }
    // Note: no change to listing.reservedQuantity — a request never reserves stock.
    demoDb.orders.push(order)
    const summary = `${listing.name} · ${formatQuantity(order.quantity, listing.unit)}`
    notify(demoActor.id, {
      category: 'order',
      title: `Order request ${order.reference} sent`,
      body: `${summary}. You’ll be notified when the seller responds.`,
      href: `/buyer/orders/${order.id}`,
    })
    notify(seller.id, {
      category: 'order',
      title: `New order request ${order.reference}`,
      body: `${summary}. Review and accept or decline.`,
      href: `/seller/orders/${order.id}`,
    })
    return ok(copy(order))
  },

  async cancel(id, reason) {
    await delay(500)
    const order = demoDb.orders.find((o) => o.id === id && mine(o))
    if (!order) return notFound('This order')
    if (order.status !== 'pending' && order.status !== 'accepted') {
      return invalid('This order can no longer be cancelled. Contact HeyCileng support for help.')
    }
    // An accepted order holds a reservation; cancelling releases it.
    if (order.status === 'accepted') {
      const listing = demoDb.listings.find((l) => l.id === order.listingId)
      if (listing) listing.reservedQuantity = Math.max(0, listing.reservedQuantity - order.quantity)
    }
    const at = nowISO()
    order.status = 'cancelled'
    order.updatedAt = at
    order.timeline.push({ id: nextId('demo-evt'), at, status: 'cancelled', actor: 'buyer', title: 'Cancelled by buyer', description: reason || undefined })
    notify(order.sellerId, {
      category: 'order',
      title: `Order ${order.reference} was cancelled`,
      body: 'The buyer cancelled this order. Any reserved stock has been released.',
      href: `/seller/orders/${order.id}`,
    })
    return ok(copy(order))
  },
}
