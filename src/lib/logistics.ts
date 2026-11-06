import type { DeliveryUpdateStatus } from '@/types/logistics'
import type { Order } from '@/types/order'
import type { DeliveryStatus } from '@/types/status'

/** Allowed delivery moves once a partner is assigned. The backend must enforce the same rules. */
export const DELIVERY_FLOW: Partial<Record<DeliveryStatus, DeliveryUpdateStatus[]>> = {
  assigned: ['scheduled', 'in_transit'],
  scheduled: ['in_transit', 'failed'],
  in_transit: ['delivered', 'failed'],
  failed: ['scheduled', 'in_transit'],
}

export type AdminNextAction =
  | 'await_seller'
  | 'assign_partner'
  | 'update_delivery'
  | 'resolve_failed'
  | 'none'

/** What HeyCileng needs to do next for an order. */
export function nextAdminAction(order: Order): AdminNextAction {
  if (order.status === 'pending') return 'await_seller'
  if (['completed', 'cancelled', 'declined'].includes(order.status)) return 'none'
  if (order.status === 'delivery_failed') return 'resolve_failed'
  if (!order.delivery?.partnerId) return 'assign_partner'
  return 'update_delivery'
}

export const NEXT_ACTION_LABEL: Record<AdminNextAction, string> = {
  await_seller: 'Waiting for the seller to accept or decline',
  assign_partner: 'Assign a logistics partner',
  update_delivery: 'Keep the delivery status up to date',
  resolve_failed: 'Delivery failed — reschedule or cancel',
  none: 'No action needed',
}
