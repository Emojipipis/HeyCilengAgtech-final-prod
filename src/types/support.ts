import type { TicketStatus } from './status'

export type TicketCategory = 'order' | 'delivery' | 'listing' | 'account' | 'payment' | 'other'

export interface TicketMessage {
  id: string
  /** `user` is the ticket owner; `heycileng` is a HeyCileng support agent. There is no third party. */
  author: 'user' | 'heycileng'
  body: string
  at: string
}

/** A conversation between one user and HeyCileng support. Never visible to other buyers or sellers. */
export interface SupportTicket {
  id: string
  reference: string
  requesterId: string
  subject: string
  category: TicketCategory
  /** Related order, when the ticket is about one. */
  order?: { id: string; reference: string }
  status: TicketStatus
  messages: TicketMessage[]
  createdAt: string
  updatedAt: string
  isDemo?: boolean
}

export interface NewTicketInput {
  subject: string
  category: TicketCategory
  orderId?: string
  message: string
}
