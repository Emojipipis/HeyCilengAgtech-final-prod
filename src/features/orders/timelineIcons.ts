import { Ban, CircleCheckBig, CircleX, ClipboardList, PackageCheck, Send, Truck, Warehouse, type LucideIcon } from 'lucide-react'
import type { OrderEvent } from '@/types/order'
import type { OrderStatus } from '@/types/status'

const BY_STATUS: Record<OrderStatus, LucideIcon> = {
  pending: Send,
  accepted: CircleCheckBig,
  declined: CircleX,
  processing: ClipboardList,
  dispatched: Truck,
  ready_for_collection: Warehouse,
  completed: PackageCheck,
  cancelled: Ban,
  delivery_failed: CircleX,
}

/** Icon for a timeline event: its status icon, or a logistics icon for HeyCileng updates. */
export function eventIcon(event: OrderEvent): LucideIcon {
  if (event.status) return BY_STATUS[event.status]
  return event.actor === 'heycileng' ? Truck : ClipboardList
}
