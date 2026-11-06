import type { Delivery, Order, OrderEvent } from '@/types/order'
import type { OrderStatus } from '@/types/status'
import { DEMO_LISTINGS } from './listings'
import { DEMO_SELLERS } from './sellers'
import { DEMO_BUYER_NAMES } from './users'

/**
 * ⚠ Illustrative demo orders. Not real transactions: logistics partners are placeholders,
 * tracking references start with DEMO-, and no payments exist (Paystack isn't integrated).
 */

const ADDRESS = 'Demo delivery address (illustrative)'

let eventCounter = 0
const ev = (at: string, title: string, actor: OrderEvent['actor'], status?: OrderStatus, description?: string): OrderEvent => ({
  id: `demo-evt-${++eventCounter}`,
  at,
  title,
  actor,
  status,
  description,
})

const requested = (at: string) =>
  ev(at, 'Order request sent', 'buyer', 'pending', 'Waiting for the seller to respond. Stock is not reserved until the seller accepts.')
const accepted = (at: string) => ev(at, 'Seller accepted the order', 'seller', 'accepted', 'The requested quantity is now reserved for this order.')

interface Seed {
  id: string
  /** Defaults to the main demo buyer. */
  buyerId?: string
  listingId: string
  quantity: number
  status: OrderStatus
  fulfilment: Order['fulfilment']
  createdAt: string
  timeline: OrderEvent[]
  delivery: Delivery | null
  buyerNote?: string
  preferredDate?: string
}

const seeds: Seed[] = [
  {
    id: 'demo-order-1', listingId: 'demo-listing-13', quantity: 40, status: 'pending', fulfilment: 'delivery',
    createdAt: '2026-11-04T09:20:00Z', preferredDate: '2026-11-18', buyerNote: 'Delivery to loading bay 2, weekdays only.',
    timeline: [requested('2026-11-04T09:20:00Z')], delivery: null,
  },
  {
    id: 'demo-order-2', listingId: 'demo-listing-1', quantity: 4, status: 'accepted', fulfilment: 'delivery',
    createdAt: '2026-11-01T11:00:00Z', preferredDate: '2026-11-12',
    timeline: [requested('2026-11-01T11:00:00Z'), accepted('2026-11-02T08:15:00Z'), ev('2026-11-02T08:20:00Z', 'Awaiting logistics assignment', 'heycileng', undefined, 'HeyCileng will assign a logistics partner and confirm the delivery fee.')],
    delivery: { status: 'not_assigned', history: [] },
  },
  {
    id: 'demo-order-3', listingId: 'demo-listing-3', quantity: 60, status: 'processing', fulfilment: 'delivery',
    createdAt: '2026-10-27T14:00:00Z', preferredDate: '2026-11-08',
    timeline: [
      requested('2026-10-27T14:00:00Z'),
      accepted('2026-10-28T09:00:00Z'),
      ev('2026-10-29T10:30:00Z', 'Logistics partner assigned', 'heycileng', undefined, 'Delivery fee and estimated date confirmed.'),
      ev('2026-10-31T12:00:00Z', 'Order is being prepared', 'seller', 'processing'),
    ],
    delivery: {
      status: 'scheduled', partnerName: 'Demo Logistics Partner A', fee: 85000, feePayer: 'buyer', estimatedDate: '2026-11-08',
      history: [
        { at: '2026-10-29T10:30:00Z', status: 'assigned', note: 'Partner assigned by HeyCileng.' },
        { at: '2026-10-31T12:10:00Z', status: 'scheduled', note: 'Pickup scheduled for 7 Nov.' },
      ],
    },
  },
  {
    id: 'demo-order-4', listingId: 'demo-listing-5', quantity: 10, status: 'dispatched', fulfilment: 'delivery',
    createdAt: '2026-10-22T10:00:00Z',
    timeline: [
      requested('2026-10-22T10:00:00Z'),
      accepted('2026-10-22T16:40:00Z'),
      ev('2026-10-23T09:00:00Z', 'Logistics partner assigned', 'heycileng'),
      ev('2026-10-27T08:00:00Z', 'Order is being prepared', 'seller', 'processing'),
      ev('2026-11-03T07:30:00Z', 'Order dispatched', 'heycileng', 'dispatched', 'Picked up by the assigned logistics partner.'),
    ],
    delivery: {
      status: 'in_transit', partnerName: 'Demo Logistics Partner B', fee: 120000, feePayer: 'buyer', estimatedDate: '2026-11-06',
      trackingReference: 'DEMO-TRK-1004',
      history: [
        { at: '2026-10-23T09:00:00Z', status: 'assigned' },
        { at: '2026-10-30T15:00:00Z', status: 'scheduled' },
        { at: '2026-11-03T07:30:00Z', status: 'in_transit', note: 'Left Makurdi.' },
      ],
    },
  },
  {
    id: 'demo-order-5', listingId: 'demo-listing-2', quantity: 6, status: 'dispatched', fulfilment: 'delivery',
    createdAt: '2026-10-30T09:00:00Z',
    timeline: [
      requested('2026-10-30T09:00:00Z'),
      accepted('2026-10-30T13:00:00Z'),
      ev('2026-11-02T10:00:00Z', 'Order is being prepared', 'seller', 'processing'),
      ev('2026-11-03T09:00:00Z', 'Logistics partner assigned', 'heycileng'),
      ev('2026-11-04T15:00:00Z', 'Order dispatched', 'heycileng', 'dispatched', 'Picked up from the seller by the assigned logistics partner.'),
    ],
    delivery: {
      status: 'in_transit', partnerName: 'Demo Logistics Partner A', fee: 45000, feePayer: 'buyer', estimatedDate: '2026-11-07',
      trackingReference: 'DEMO-TRK-1044',
      history: [
        { at: '2026-11-03T09:00:00Z', status: 'assigned' },
        { at: '2026-11-04T15:00:00Z', status: 'in_transit' },
      ],
    },
  },
  {
    id: 'demo-order-6', listingId: 'demo-listing-8', quantity: 200, status: 'completed', fulfilment: 'delivery',
    createdAt: '2026-09-18T09:00:00Z',
    timeline: [
      requested('2026-09-18T09:00:00Z'),
      accepted('2026-09-18T15:00:00Z'),
      ev('2026-09-19T10:00:00Z', 'Logistics partner assigned', 'heycileng'),
      ev('2026-09-22T08:00:00Z', 'Order is being prepared', 'seller', 'processing'),
      ev('2026-09-24T07:00:00Z', 'Order dispatched', 'heycileng', 'dispatched'),
      ev('2026-09-25T14:00:00Z', 'Delivered', 'heycileng', 'completed', 'Delivery confirmed by HeyCileng.'),
    ],
    delivery: {
      status: 'delivered', partnerName: 'Demo Logistics Partner A', fee: 45000, feePayer: 'buyer', estimatedDate: '2026-09-25',
      trackingReference: 'DEMO-TRK-0981',
      history: [
        { at: '2026-09-19T10:00:00Z', status: 'assigned' },
        { at: '2026-09-24T07:00:00Z', status: 'in_transit' },
        { at: '2026-09-25T14:00:00Z', status: 'delivered' },
      ],
    },
  },
  {
    id: 'demo-order-7', listingId: 'demo-listing-10', quantity: 5, status: 'cancelled', fulfilment: 'delivery',
    createdAt: '2026-10-10T09:00:00Z',
    timeline: [requested('2026-10-10T09:00:00Z'), ev('2026-10-11T08:00:00Z', 'Cancelled by buyer', 'buyer', 'cancelled', 'Cancelled before the seller responded.')],
    delivery: null,
  },
  {
    id: 'demo-order-8', listingId: 'demo-listing-7', quantity: 8, status: 'declined', fulfilment: 'delivery',
    createdAt: '2026-10-05T09:00:00Z',
    timeline: [requested('2026-10-05T09:00:00Z'), ev('2026-10-06T12:00:00Z', 'Seller declined the order', 'seller', 'declined', 'The seller couldn’t fulfil this request.')],
    delivery: null,
  },
  {
    id: 'demo-order-9', listingId: 'demo-listing-9', quantity: 8, status: 'delivery_failed', fulfilment: 'delivery',
    createdAt: '2026-10-14T09:00:00Z',
    timeline: [
      requested('2026-10-14T09:00:00Z'),
      accepted('2026-10-14T17:00:00Z'),
      ev('2026-10-15T09:00:00Z', 'Logistics partner assigned', 'heycileng'),
      ev('2026-10-18T07:00:00Z', 'Order dispatched', 'heycileng', 'dispatched'),
      ev('2026-10-19T16:00:00Z', 'Delivery failed', 'heycileng', 'delivery_failed', 'The vehicle couldn’t access the site. HeyCileng support will contact you to rearrange.'),
    ],
    delivery: {
      status: 'failed', partnerName: 'Demo Logistics Partner B', fee: 95000, feePayer: 'buyer', estimatedDate: '2026-10-19',
      trackingReference: 'DEMO-TRK-0993',
      history: [
        { at: '2026-10-15T09:00:00Z', status: 'assigned' },
        { at: '2026-10-18T07:00:00Z', status: 'in_transit' },
        { at: '2026-10-19T16:00:00Z', status: 'failed', note: 'Site access issue.' },
      ],
    },
  },
  // Orders from other demo buyers on the demo seller's listings (seller view).
  {
    id: 'demo-order-10', buyerId: 'demo-buyer-3', listingId: 'demo-listing-1', quantity: 6, status: 'pending', fulfilment: 'delivery',
    createdAt: '2026-11-05T07:30:00Z', preferredDate: '2026-11-20',
    timeline: [requested('2026-11-05T07:30:00Z')], delivery: null,
  },
  {
    id: 'demo-order-11', buyerId: 'demo-buyer-2', listingId: 'demo-listing-13', quantity: 40, status: 'processing', fulfilment: 'delivery',
    createdAt: '2026-10-31T10:00:00Z',
    timeline: [
      requested('2026-10-31T10:00:00Z'),
      accepted('2026-11-01T09:00:00Z'),
      ev('2026-11-01T14:00:00Z', 'Logistics partner assigned', 'heycileng'),
      ev('2026-11-03T08:00:00Z', 'Order is being prepared', 'seller', 'processing'),
    ],
    delivery: {
      status: 'scheduled', partnerName: 'Demo Logistics Partner A', fee: 60000, feePayer: 'buyer', estimatedDate: '2026-11-09',
      history: [
        { at: '2026-11-01T14:00:00Z', status: 'assigned' },
        { at: '2026-11-03T09:00:00Z', status: 'scheduled' },
      ],
    },
  },
  {
    id: 'demo-order-12', buyerId: 'demo-buyer-4', listingId: 'demo-listing-2', quantity: 10, status: 'declined', fulfilment: 'delivery',
    createdAt: '2026-10-20T10:00:00Z',
    timeline: [
      requested('2026-10-20T10:00:00Z'),
      ev('2026-10-21T09:00:00Z', 'Seller declined the order', 'seller', 'declined', 'Fresh peels can’t travel that distance in time.'),
    ],
    delivery: null,
  },
  {
    id: 'demo-order-13', buyerId: 'demo-buyer-2', listingId: 'demo-listing-2', quantity: 12, status: 'completed', fulfilment: 'delivery',
    createdAt: '2026-10-08T10:00:00Z',
    timeline: [
      requested('2026-10-08T10:00:00Z'),
      accepted('2026-10-08T15:00:00Z'),
      ev('2026-10-10T09:00:00Z', 'Logistics partner assigned', 'heycileng'),
      ev('2026-10-10T14:00:00Z', 'Order dispatched', 'heycileng', 'dispatched'),
      ev('2026-10-11T12:00:00Z', 'Delivered', 'heycileng', 'completed'),
    ],
    delivery: {
      status: 'delivered', partnerName: 'Demo Logistics Partner A', fee: 60000, feePayer: 'heycileng', estimatedDate: '2026-10-11',
      trackingReference: 'DEMO-TRK-0981',
      history: [
        { at: '2026-10-10T09:00:00Z', status: 'assigned' },
        { at: '2026-10-10T14:00:00Z', status: 'in_transit' },
        { at: '2026-10-11T12:00:00Z', status: 'delivered' },
      ],
    },
  },
  {
    id: 'demo-order-14', buyerId: 'demo-buyer-3', listingId: 'demo-listing-1', quantity: 2, status: 'completed', fulfilment: 'delivery',
    createdAt: '2026-10-02T10:00:00Z',
    timeline: [
      requested('2026-10-02T10:00:00Z'),
      accepted('2026-10-02T16:00:00Z'),
      ev('2026-10-03T09:00:00Z', 'Logistics partner assigned', 'heycileng'),
      ev('2026-10-06T07:00:00Z', 'Order dispatched', 'heycileng', 'dispatched'),
      ev('2026-10-09T13:00:00Z', 'Delivered', 'heycileng', 'completed'),
    ],
    delivery: {
      status: 'delivered', partnerName: 'Demo Logistics Partner B', fee: 140000, feePayer: 'buyer', estimatedDate: '2026-10-09',
      trackingReference: 'DEMO-TRK-0960',
      history: [
        { at: '2026-10-03T09:00:00Z', status: 'assigned' },
        { at: '2026-10-06T07:00:00Z', status: 'in_transit' },
        { at: '2026-10-09T13:00:00Z', status: 'delivered' },
      ],
    },
  },
  {
    id: 'demo-order-15', buyerId: 'demo-buyer-4', listingId: 'demo-listing-13', quantity: 60, status: 'completed', fulfilment: 'delivery',
    createdAt: '2026-09-25T10:00:00Z',
    timeline: [
      requested('2026-09-25T10:00:00Z'),
      accepted('2026-09-25T14:00:00Z'),
      ev('2026-09-27T09:00:00Z', 'Logistics partner assigned', 'heycileng'),
      ev('2026-09-27T13:00:00Z', 'Order dispatched', 'heycileng', 'dispatched'),
      ev('2026-09-28T11:00:00Z', 'Delivered', 'heycileng', 'completed'),
    ],
    delivery: {
      status: 'delivered', partnerName: 'Demo Logistics Partner A', fee: 80000, feePayer: 'heycileng', estimatedDate: '2026-09-28',
      trackingReference: 'DEMO-TRK-0944',
      history: [
        { at: '2026-09-27T09:00:00Z', status: 'assigned' },
        { at: '2026-09-27T13:00:00Z', status: 'in_transit' },
        { at: '2026-09-28T11:00:00Z', status: 'delivered' },
      ],
    },
  },
  {
    id: 'demo-order-16', buyerId: 'demo-buyer-2', listingId: 'demo-listing-1', quantity: 3, status: 'dispatched', fulfilment: 'delivery',
    createdAt: '2026-10-29T10:00:00Z',
    timeline: [
      requested('2026-10-29T10:00:00Z'),
      accepted('2026-10-29T15:00:00Z'),
      ev('2026-10-30T09:00:00Z', 'Logistics partner assigned', 'heycileng'),
      ev('2026-11-01T08:00:00Z', 'Order is being prepared', 'seller', 'processing'),
      ev('2026-11-04T07:00:00Z', 'Order dispatched', 'heycileng', 'dispatched'),
    ],
    delivery: {
      status: 'in_transit', partnerName: 'Demo Logistics Partner A', fee: 70000, feePayer: 'buyer', estimatedDate: '2026-11-06',
      trackingReference: 'DEMO-TRK-1016',
      history: [
        { at: '2026-10-30T09:00:00Z', status: 'assigned' },
        { at: '2026-11-04T07:00:00Z', status: 'in_transit' },
      ],
    },
  },
]

export const DEMO_ORDERS: Order[] = seeds.map((seed, index) => {
  const listing = DEMO_LISTINGS.find((l) => l.id === seed.listingId)!
  const seller = DEMO_SELLERS.find((s) => s.id === listing.sellerId)!
  return {
    id: seed.id,
    reference: `HC-DEMO-${String(1040 + index)}`,
    listingId: listing.id,
    listing: {
      name: listing.name,
      category: listing.category,
      unit: listing.unit,
      pricePerUnit: listing.pricePerUnit,
      sellerBusinessName: seller.businessName,
      sellerLocation: seller.location,
    },
    buyerId: seed.buyerId ?? 'demo-buyer-1',
    buyerBusinessName: DEMO_BUYER_NAMES[seed.buyerId ?? 'demo-buyer-1'],
    sellerId: seller.id,
    quantity: seed.quantity,
    subtotal: seed.quantity * listing.pricePerUnit,
    fulfilment: seed.fulfilment,
    deliveryAddress: seed.fulfilment === 'delivery' ? ADDRESS : undefined,
    preferredDate: seed.preferredDate,
    buyerNote: seed.buyerNote,
    status: seed.status,
    // Link demo deliveries to their placeholder partner records.
    delivery: seed.delivery && {
      ...seed.delivery,
      partnerId: seed.delivery.partnerName ? `demo-partner-${seed.delivery.partnerName.slice(-1).toLowerCase()}` : undefined,
    },
    payment: { status: 'unpaid', payoutStatus: 'not_due' },
    timeline: seed.timeline,
    createdAt: seed.createdAt,
    updatedAt: seed.timeline[seed.timeline.length - 1].at,
    isDemo: true,
  }
})
