import type { AppNotification } from '@/types/notification'

/** ⚠ Illustrative demo notifications for the demo buyer. */
export const DEMO_BUYER_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'demo-ntf-1', category: 'delivery', title: 'Order HC-DEMO-1043 is on its way',
    body: 'Your rice husks order has been dispatched. Estimated delivery: 6 Nov.', createdAt: '2026-11-03T07:35:00Z', read: false,
    href: '/buyer/orders/demo-order-4',
  },
  {
    id: 'demo-ntf-2', category: 'order', title: 'Ready for collection',
    body: 'Order HC-DEMO-1044 (fresh cassava peels) is ready to collect.', createdAt: '2026-11-04T15:05:00Z', read: false,
    href: '/buyer/orders/demo-order-5',
  },
  {
    id: 'demo-ntf-3', category: 'match', title: '2 new matches for “Dried cassava peels for poultry feed”',
    body: 'Recommended listings are ready to review. Matches are advisory only.', createdAt: '2026-11-03T12:00:00Z', read: false,
    href: '/buyer/matches?requirement=demo-req-1',
  },
  {
    id: 'demo-ntf-4', category: 'order', title: 'Seller accepted order HC-DEMO-1041',
    body: 'Sun-dried cassava peels · 4 tonnes. HeyCileng will assign logistics next.', createdAt: '2026-11-02T08:16:00Z', read: true,
    href: '/buyer/orders/demo-order-2',
  },
  {
    id: 'demo-ntf-5', category: 'account', title: 'Requirement expired',
    body: '“Maize cobs for mushroom substrate” passed its expiry date and is no longer used for matching.', createdAt: '2026-11-01T00:05:00Z', read: true,
    href: '/buyer/requirements',
  },
  {
    id: 'demo-ntf-6', category: 'announcement', title: 'Online payments coming soon',
    body: 'Paystack payments will be added in a future release. No payments are processed on the platform yet.', createdAt: '2026-10-25T09:00:00Z', read: true,
  },
].map((n) => ({ ...n, isDemo: true }) as AppNotification)

/** ⚠ Illustrative demo notifications for the demo seller. */
export const DEMO_SELLER_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'demo-sntf-1', category: 'order', title: 'New order request HC-DEMO-1049',
    body: 'Sun-dried cassava peels · 6 tonnes. Review and accept or decline.', createdAt: '2026-11-05T07:31:00Z', read: false,
    href: '/seller/orders/demo-order-10',
  },
  {
    id: 'demo-sntf-2', category: 'listing', title: 'Listing submitted for review',
    body: '“Wet cassava starch residue” will go live once HeyCileng approves it.', createdAt: '2026-11-04T16:01:00Z', read: false,
    href: '/seller/listings',
  },
  {
    id: 'demo-sntf-3', category: 'match', title: 'Buyer requirements match your listings',
    body: 'See potential buyers for your cassava peel listings. Matching never contacts buyers on your behalf.', createdAt: '2026-11-03T12:00:00Z', read: false,
    href: '/seller/potential-buyers',
  },
  {
    id: 'demo-sntf-4', category: 'delivery', title: 'Order HC-DEMO-1055 dispatched',
    body: 'Picked up by the HeyCileng-assigned logistics partner.', createdAt: '2026-11-04T07:05:00Z', read: true,
    href: '/seller/orders/demo-order-16',
  },
  {
    id: 'demo-sntf-5', category: 'announcement', title: 'Online payments coming soon',
    body: 'Paystack payouts will be added in a future release. No payments are processed on the platform yet.', createdAt: '2026-10-25T09:00:00Z', read: true,
  },
].map((n) => ({ ...n, isDemo: true }) as AppNotification)
