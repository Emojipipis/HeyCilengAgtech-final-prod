import type { StatusKind, StatusKinds } from '@/types/status'

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand' | 'accent'

export interface StatusMeta {
  label: string
  tone: Tone
  /** Short plain-language explanation, used in tooltips and timelines. */
  description: string
}

type StatusRegistry = { [K in StatusKind]: Record<StatusKinds[K], StatusMeta> }

export const STATUS_META: StatusRegistry = {
  order: {
    pending: { label: 'Pending', tone: 'warning', description: 'Awaiting the seller’s response. Stock is not reserved yet.' },
    accepted: { label: 'Accepted', tone: 'info', description: 'The seller accepted the request.' },
    declined: { label: 'Declined', tone: 'danger', description: 'The seller declined the request.' },
    processing: { label: 'Processing', tone: 'brand', description: 'The order is being prepared.' },
    dispatched: { label: 'Dispatched', tone: 'info', description: 'The order has left the seller with the assigned logistics partner.' },
    ready_for_collection: { label: 'Ready for Collection', tone: 'accent', description: 'The order is ready to be collected.' },
    completed: { label: 'Completed', tone: 'success', description: 'The order was delivered or collected.' },
    cancelled: { label: 'Cancelled', tone: 'neutral', description: 'The order was cancelled.' },
    delivery_failed: { label: 'Delivery Failed', tone: 'danger', description: 'Delivery could not be completed. HeyCileng support will follow up.' },
  },
  listing: {
    draft: { label: 'Draft', tone: 'neutral', description: 'Not yet submitted.' },
    pending_review: { label: 'Pending Review', tone: 'warning', description: 'Awaiting HeyCileng review before it appears in the marketplace.' },
    active: { label: 'Active', tone: 'success', description: 'Visible in the marketplace.' },
    paused: { label: 'Paused', tone: 'neutral', description: 'Hidden from the marketplace by the seller.' },
    sold_out: { label: 'Sold Out', tone: 'accent', description: 'No available quantity remains.' },
    rejected: { label: 'Rejected', tone: 'danger', description: 'Did not pass review.' },
    suspended: { label: 'Suspended', tone: 'danger', description: 'Suspended by HeyCileng.' },
  },
  requirement: {
    active: { label: 'Active', tone: 'success', description: 'Being used for matchmaking.' },
    paused: { label: 'Paused', tone: 'neutral', description: 'Excluded from matchmaking until resumed.' },
    expired: { label: 'Expired', tone: 'warning', description: 'Past its expiry date.' },
    fulfilled: { label: 'Fulfilled', tone: 'info', description: 'Marked as fulfilled by the buyer.' },
  },
  delivery: {
    not_assigned: { label: 'Not Assigned', tone: 'neutral', description: 'HeyCileng has not assigned a logistics partner yet.' },
    assigned: { label: 'Partner Assigned', tone: 'info', description: 'A logistics partner has been assigned by HeyCileng.' },
    scheduled: { label: 'Scheduled', tone: 'brand', description: 'Pickup and delivery have been scheduled.' },
    in_transit: { label: 'In Transit', tone: 'info', description: 'On the way to the delivery address.' },
    delivered: { label: 'Delivered', tone: 'success', description: 'Delivered to the buyer.' },
    ready_for_collection: { label: 'Ready for Collection', tone: 'accent', description: 'Awaiting collection by the buyer.' },
    collected: { label: 'Collected', tone: 'success', description: 'Collected by the buyer.' },
    failed: { label: 'Failed', tone: 'danger', description: 'Delivery attempt failed.' },
  },
  ticket: {
    open: { label: 'Open', tone: 'warning', description: 'Waiting for a HeyCileng agent.' },
    in_progress: { label: 'In Progress', tone: 'info', description: 'A HeyCileng agent is working on it.' },
    awaiting_user: { label: 'Awaiting You', tone: 'accent', description: 'HeyCileng needs more information from you.' },
    resolved: { label: 'Resolved', tone: 'success', description: 'Marked as resolved.' },
    closed: { label: 'Closed', tone: 'neutral', description: 'Closed.' },
  },
  account: {
    active: { label: 'Active', tone: 'success', description: 'Account in good standing.' },
    pending_verification: { label: 'Pending Verification', tone: 'warning', description: 'Email not yet verified.' },
    suspended: { label: 'Suspended', tone: 'danger', description: 'Suspended by HeyCileng.' },
  },
  dispute: {
    open: { label: 'Open', tone: 'warning', description: 'Awaiting review.' },
    under_review: { label: 'Under Review', tone: 'info', description: 'Being reviewed by HeyCileng.' },
    resolved: { label: 'Resolved', tone: 'success', description: 'A resolution was reached.' },
    rejected: { label: 'Rejected', tone: 'neutral', description: 'The dispute was not upheld.' },
  },
}

export function getStatusMeta<K extends StatusKind>(kind: K, status: StatusKinds[K]): StatusMeta {
  return (STATUS_META[kind] as Record<StatusKinds[K], StatusMeta>)[status]
}
