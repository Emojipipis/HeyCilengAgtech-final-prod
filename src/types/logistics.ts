import type { DeliveryStatus } from './status'
import type { FeePayer } from './order'

/** A delivery company HeyCileng works with. Managed by administrators only; never shown to buyers or sellers beyond its name. */
export interface LogisticsPartner {
  id: string
  name: string
  /** States the partner can serve. */
  coverageStates: string[]
  vehicleTypes: string
  /** Internal operations contact — visible to HeyCileng administrators only. */
  contactName: string
  contactPhone: string
  status: 'active' | 'inactive'
  notes: string
  createdAt: string
  isDemo?: boolean
}

export type LogisticsPartnerInput = Pick<LogisticsPartner, 'name' | 'coverageStates' | 'vehicleTypes' | 'contactName' | 'contactPhone' | 'notes'>

export interface AssignDeliveryInput {
  partnerId: string
  fee: number
  feePayer: FeePayer
  estimatedDate: string
  trackingReference?: string
  note?: string
}

/** Delivery statuses an administrator can move an assigned delivery to. */
export type DeliveryUpdateStatus = Extract<DeliveryStatus, 'scheduled' | 'in_transit' | 'delivered' | 'failed'>

export interface UpdateDeliveryInput {
  status: DeliveryUpdateStatus
  note?: string
  estimatedDate?: string
  trackingReference?: string
}
