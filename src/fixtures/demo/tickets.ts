import type { SupportTicket } from '@/types/support'

/** ⚠ Illustrative demo support tickets. HeyCileng replies here are sample text, not real agent responses. */
export const DEMO_TICKETS: SupportTicket[] = [
  {
    id: 'demo-ticket-1', reference: 'HC-SUP-DEMO-201', requesterId: 'demo-buyer-1', category: 'delivery',
    subject: 'Rearranging the failed maize stalks delivery', order: { id: 'demo-order-9', reference: 'HC-DEMO-1048' },
    status: 'awaiting_user', createdAt: '2026-10-19T17:10:00Z', updatedAt: '2026-10-20T10:05:00Z',
    messages: [
      { id: 'm1', author: 'user', at: '2026-10-19T17:10:00Z', body: 'The truck couldn’t reach our gate yesterday. Can the delivery be rearranged for next week?' },
      { id: 'm2', author: 'heycileng', at: '2026-10-20T10:05:00Z', body: 'Thanks for letting us know. The partner reported the access road was too narrow for their vehicle. Could you confirm a drop-off point that a 20 t truck can reach? We’ll then reschedule and share the new date.' },
    ],
  },
  {
    id: 'demo-ticket-2', reference: 'HC-SUP-DEMO-198', requesterId: 'demo-buyer-1', category: 'listing',
    subject: 'Moisture test results for cassava peels', status: 'resolved',
    createdAt: '2026-10-12T09:00:00Z', updatedAt: '2026-10-14T15:30:00Z',
    messages: [
      { id: 'm1', author: 'user', at: '2026-10-12T09:00:00Z', body: 'Does the seller of the sun-dried cassava peels have moisture test results? We need under 12% for our feed line.' },
      { id: 'm2', author: 'heycileng', at: '2026-10-13T11:20:00Z', body: 'We’ve asked the seller. They measure moisture with a handheld meter at bagging and report 10–12%. A lab certificate isn’t available yet.' },
      { id: 'm3', author: 'user', at: '2026-10-14T15:30:00Z', body: 'That works for a trial order. Thank you.' },
    ],
  },
  {
    id: 'demo-ticket-3', reference: 'HC-SUP-DEMO-205', requesterId: 'demo-buyer-1', category: 'payment',
    subject: 'When will online payment be available?', status: 'open',
    createdAt: '2026-11-03T08:40:00Z', updatedAt: '2026-11-03T08:40:00Z',
    messages: [{ id: 'm1', author: 'user', at: '2026-11-03T08:40:00Z', body: 'We’d like to pay through the platform. Is there a date for card or bank payments?' }],
  },
  {
    id: 'demo-ticket-4', reference: 'HC-SUP-DEMO-203', requesterId: 'demo-seller-1', category: 'order',
    subject: 'Buyer wants weekly deliveries', order: { id: 'demo-order-16', reference: 'HC-DEMO-1055' },
    status: 'in_progress', createdAt: '2026-11-01T12:00:00Z', updatedAt: '2026-11-02T09:15:00Z',
    messages: [
      { id: 'm1', author: 'user', at: '2026-11-01T12:00:00Z', body: 'Can HeyCileng check whether this buyer would like a regular weekly supply? We can commit 3 t per week.' },
      { id: 'm2', author: 'heycileng', at: '2026-11-02T09:15:00Z', body: 'Good idea — we’ll raise it with the buyer once this delivery arrives and come back to you. Any recurring arrangement still goes through HeyCileng orders.' },
    ],
  },
  {
    id: 'demo-ticket-5', reference: 'HC-SUP-DEMO-190', requesterId: 'demo-seller-1', category: 'account',
    subject: 'Updating our business address', status: 'closed',
    createdAt: '2026-09-20T10:00:00Z', updatedAt: '2026-09-22T14:00:00Z',
    messages: [
      { id: 'm1', author: 'user', at: '2026-09-20T10:00:00Z', body: 'We’ve moved our processing site within Iseyin. How do we update it?' },
      { id: 'm2', author: 'heycileng', at: '2026-09-21T09:30:00Z', body: 'You can change your town or area under Business profile. Listings keep their own location, so update those too.' },
    ],
  },
].map((t) => ({ ...t, isDemo: true }) as SupportTicket)
