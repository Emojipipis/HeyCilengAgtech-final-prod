import type { Order } from '@/types/order'

/**
 * Display helpers that mirror the database rules (order_amount_due / order_is_payable).
 * The amount actually charged is always computed by the backend.
 */

/** Delivery fee the buyer pays (0 when HeyCileng or the seller covers it, or for collection). */
export function buyerDeliveryFee(order: Order): number {
  return order.fulfilment === 'delivery' && order.delivery?.feePayer === 'buyer' ? (order.delivery.fee ?? 0) : 0
}

/** Goods plus any buyer-paid delivery fee. */
export function amountDue(order: Order): number {
  return order.subtotal + buyerDeliveryFee(order)
}

/** True once the seller has accepted and, for deliveries, HeyCileng has confirmed the fee. */
export function isPayable(order: Order): boolean {
  if (order.payment.status !== 'unpaid') return false
  if (!['accepted', 'processing', 'delivery_failed'].includes(order.status)) return false
  return order.fulfilment === 'collection' || (order.delivery?.feePayer !== undefined && order.delivery.fee !== undefined)
}

/** Unpaid and accepted, but waiting for HeyCileng to confirm the delivery fee. */
export function awaitingDeliveryFee(order: Order): boolean {
  return (
    order.payment.status === 'unpaid' &&
    ['accepted', 'processing'].includes(order.status) &&
    order.fulfilment === 'delivery' &&
    (order.delivery?.feePayer === undefined || order.delivery.fee === undefined)
  )
}

/** What HeyCileng pays the seller: goods minus commission, minus the delivery fee when the seller covers it. */
export function sellerPayout(order: Order, fallbackRatePercent = 0) {
  const ratePercent = order.payment.commissionRate ?? fallbackRatePercent
  const commission = Math.round(order.subtotal * ratePercent) / 100
  const sellerFee = order.fulfilment === 'delivery' && order.delivery?.feePayer === 'seller' ? (order.delivery.fee ?? 0) : 0
  return { ratePercent, commission, sellerFee, amount: Math.max(0, order.subtotal - commission - sellerFee) }
}
