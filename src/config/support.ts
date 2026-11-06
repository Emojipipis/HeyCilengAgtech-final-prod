import type { TicketCategory } from '@/types/support'

export const TICKET_CATEGORIES: Record<TicketCategory, string> = {
  order: 'An order',
  delivery: 'Delivery',
  listing: 'A listing',
  account: 'My account',
  payment: 'Payments & fees',
  other: 'Something else',
}
