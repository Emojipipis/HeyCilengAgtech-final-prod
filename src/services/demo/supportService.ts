import type { SupportTicket } from '@/types/support'
import type { SupportService } from '../types'
import { demoActor } from './actor'
import { demoDb, nextId, nowISO } from './db'
import { copy, delay, invalid, notFound, ok } from './shared'

let referenceCounter = 300

const mine = () => demoDb.tickets.filter((t) => t.requesterId === demoActor.id)
const find = (id: string) => mine().find((t) => t.id === id)

/** The user may link a ticket only to their own orders (as buyer or seller). */
function ownOrder(orderId: string) {
  return demoDb.orders.find((o) => o.id === orderId && (o.buyerId === demoActor.id || o.sellerId === demoActor.id))
}

/**
 * Demo support desk. It never invents agent replies: new tickets stay open until
 * HeyCileng responds from the admin side.
 */
export const demoSupportService: SupportService = {
  async listMine() {
    await delay(350)
    return ok(copy(mine().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))))
  },

  async get(id) {
    await delay(250)
    const ticket = find(id)
    return ticket ? ok(copy(ticket)) : notFound('This ticket')
  },

  async create(input) {
    await delay(600)
    if (input.subject.trim().length < 5) return invalid('Add a short subject.')
    if (input.message.trim().length < 20) return invalid('Describe the issue in at least 20 characters.')
    const order = input.orderId ? ownOrder(input.orderId) : undefined
    if (input.orderId && !order) return notFound('That order')
    const at = nowISO()
    const ticket: SupportTicket = {
      id: nextId('demo-ticket'),
      reference: `HC-SUP-DEMO-${++referenceCounter}`,
      requesterId: demoActor.id,
      subject: input.subject.trim(),
      category: input.category,
      order: order ? { id: order.id, reference: order.reference } : undefined,
      status: 'open',
      messages: [{ id: nextId('msg'), author: 'user', body: input.message.trim(), at }],
      createdAt: at,
      updatedAt: at,
      isDemo: true,
    }
    demoDb.tickets.push(ticket)
    return ok(copy(ticket))
  },

  async reply(id, message) {
    await delay(450)
    const ticket = find(id)
    if (!ticket) return notFound('This ticket')
    if (ticket.status === 'closed') return invalid('This ticket is closed. Open a new ticket if you need more help.')
    if (message.trim().length < 2) return invalid('Write a message first.')
    const at = nowISO()
    ticket.messages.push({ id: nextId('msg'), author: 'user', body: message.trim(), at })
    // Your reply hands the ticket back to the support queue.
    if (ticket.status === 'awaiting_user' || ticket.status === 'resolved') ticket.status = 'open'
    ticket.updatedAt = at
    return ok(copy(ticket))
  },

  async markResolved(id) {
    await delay(350)
    const ticket = find(id)
    if (!ticket) return notFound('This ticket')
    if (ticket.status === 'closed' || ticket.status === 'resolved') return invalid('This ticket is already resolved.')
    ticket.status = 'resolved'
    ticket.updatedAt = nowISO()
    return ok(copy(ticket))
  },
}
