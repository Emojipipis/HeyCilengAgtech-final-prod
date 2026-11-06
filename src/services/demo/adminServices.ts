import { applyMatchingSettings } from '@/config/matching'
import { getStatusMeta } from '@/config/statuses'
import type { PlatformSettings } from '@/types/admin'
import type { Listing } from '@/types/listing'
import type {
  AdminListingService,
  AdminSupportService,
  AdminTicket,
  AdminUserService,
  AnnouncementService,
  AuditService,
  DisputeService,
  PaymentService,
  PlatformConfigService,
  SettingsService,
} from '../types'
import { audit, demoDb, nextId, notify, nowISO } from './db'
import { withSeller } from './marketplaceService'
import { copy, delay, invalid, notConnected, notFound, ok } from './shared'

/* ---------------------------------------------------------------- Users */

export const demoAdminUserService: AdminUserService = {
  async list() {
    await delay(350)
    return ok(copy([...demoDb.accounts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
  },

  async setStatus(id, status, reason) {
    await delay(500)
    const account = demoDb.accounts.find((a) => a.id === id)
    if (!account) return notFound('This account')
    if (account.role === 'admin') return invalid('Administrator accounts are managed outside the dashboard.')
    if (status === 'suspended' && !reason.trim()) return invalid('Add a reason for the suspension.')
    if (account.status === status) return invalid(`This account is already ${status}.`)
    account.status = status
    account.suspensionReason = status === 'suspended' ? reason.trim() : undefined
    audit({
      action: status === 'suspended' ? 'Suspended account' : 'Reactivated account',
      targetType: 'user',
      targetLabel: account.businessName,
      detail: reason.trim() || undefined,
    })
    notify(account.id, {
      category: 'account',
      title: status === 'suspended' ? 'Your account has been suspended' : 'Your account is active again',
      body: status === 'suspended' ? `Reason: ${reason.trim()} Contact HeyCileng support if you think this is a mistake.` : 'You can use HeyCileng as normal.',
    })
    return ok(copy(account))
  },
}

/* ---------------------------------------------------------------- Listings */

function listingAction(
  id: string,
  allowed: Listing['status'][],
  next: Listing['status'],
  label: string,
  reason?: string,
) {
  const listing = demoDb.listings.find((l) => l.id === id)
  if (!listing) return notFound<Listing>('This listing')
  if (!allowed.includes(listing.status)) {
    return invalid<Listing>(`A listing that is ${getStatusMeta('listing', listing.status).label.toLowerCase()} can’t be ${label}.`)
  }
  if (reason !== undefined && !reason.trim()) return invalid<Listing>('Add a reason — it’s shared with the seller.')
  listing.status = next
  listing.reviewNote = reason?.trim() || undefined
  listing.updatedAt = nowISO()
  audit({ action: `${label[0].toUpperCase()}${label.slice(1)} listing`, targetType: 'listing', targetLabel: listing.name, detail: reason?.trim() || undefined })
  const messages: Record<string, string> = {
    approved: 'is now live in the marketplace.',
    rejected: `wasn’t approved. Reason: ${reason?.trim()}`,
    suspended: `has been suspended by HeyCileng. Reason: ${reason?.trim()}`,
    reinstated: 'is active again.',
  }
  notify(listing.sellerId, { category: 'listing', title: `Listing ${label}`, body: `“${listing.name}” ${messages[label]}`, href: `/seller/listings/${listing.id}/edit` })
  return ok(copy(listing))
}

export const demoAdminListingService: AdminListingService = {
  async list() {
    await delay(350)
    return ok([...demoDb.listings].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(withSeller))
  },
  async get(id) {
    await delay(250)
    const listing = demoDb.listings.find((l) => l.id === id)
    return listing ? ok(withSeller(listing)) : notFound('This listing')
  },
  async approve(id) {
    await delay(450)
    return listingAction(id, ['pending_review'], 'active', 'approved')
  },
  async reject(id, reason) {
    await delay(450)
    return listingAction(id, ['pending_review'], 'rejected', 'rejected', reason)
  },
  async suspend(id, reason) {
    await delay(450)
    return listingAction(id, ['active', 'paused', 'sold_out'], 'suspended', 'suspended', reason)
  },
  async reinstate(id) {
    await delay(450)
    return listingAction(id, ['suspended', 'rejected'], 'active', 'reinstated')
  },
}

/* ---------------------------------------------------------------- Support queue */

function withRequester(ticket: (typeof demoDb.tickets)[number]): AdminTicket {
  const account = demoDb.accounts.find((a) => a.id === ticket.requesterId)
  return copy({ ...ticket, requesterName: account?.businessName ?? 'Unknown account', requesterRole: account?.role === 'seller' ? 'seller' : 'buyer' })
}

export const demoAdminSupportService: AdminSupportService = {
  async list() {
    await delay(350)
    return ok([...demoDb.tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(withRequester))
  },
  async get(id) {
    await delay(250)
    const ticket = demoDb.tickets.find((t) => t.id === id)
    return ticket ? ok(withRequester(ticket)) : notFound('This ticket')
  },
  async reply(id, message, status) {
    await delay(500)
    const ticket = demoDb.tickets.find((t) => t.id === id)
    if (!ticket) return notFound('This ticket')
    if (ticket.status === 'closed') return invalid('This ticket is closed.')
    if (message.trim().length < 2) return invalid('Write a reply first.')
    const at = nowISO()
    ticket.messages.push({ id: nextId('msg'), author: 'heycileng', body: message.trim(), at })
    ticket.status = status
    ticket.updatedAt = at
    audit({ action: 'Replied to support ticket', targetType: 'ticket', targetLabel: ticket.reference, detail: getStatusMeta('ticket', status).label })
    const account = demoDb.accounts.find((a) => a.id === ticket.requesterId)
    notify(ticket.requesterId, {
      category: 'account',
      title: `HeyCileng replied to ${ticket.reference}`,
      body: ticket.subject,
      href: `/${account?.role === 'seller' ? 'seller' : 'buyer'}/support/${ticket.id}`,
    })
    return ok(withRequester(ticket))
  },
  async setStatus(id, status) {
    await delay(350)
    const ticket = demoDb.tickets.find((t) => t.id === id)
    if (!ticket) return notFound('This ticket')
    ticket.status = status
    ticket.updatedAt = nowISO()
    audit({ action: `Set ticket to ${getStatusMeta('ticket', status).label}`, targetType: 'ticket', targetLabel: ticket.reference })
    return ok(withRequester(ticket))
  },
}

/* ---------------------------------------------------------------- Disputes */

export const demoDisputeService: DisputeService = {
  async list() {
    await delay(350)
    return ok(copy([...demoDb.disputes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))))
  },
  async update(id, update) {
    await delay(500)
    const dispute = demoDb.disputes.find((d) => d.id === id)
    if (!dispute) return notFound('This dispute')
    if ((update.status === 'resolved' || update.status === 'rejected') && !update.resolution?.trim()) {
      return invalid('Record the outcome before closing the dispute.')
    }
    const at = nowISO()
    if (update.note?.trim()) dispute.notes.push({ at, body: update.note.trim() })
    if (update.status) dispute.status = update.status
    if (update.resolution?.trim()) dispute.resolution = update.resolution.trim()
    dispute.updatedAt = at
    audit({
      action: update.status ? `Set dispute to ${getStatusMeta('dispute', update.status).label}` : 'Added dispute note',
      targetType: 'dispute',
      targetLabel: dispute.reference,
      detail: update.resolution?.trim() || update.note?.trim() || undefined,
    })
    return ok(copy(dispute))
  },
}

/* ---------------------------------------------------------------- Announcements */

export const demoAnnouncementService: AnnouncementService = {
  async list() {
    await delay(300)
    return ok(copy([...demoDb.announcements].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))))
  },
  async publish(input) {
    await delay(600)
    if (input.title.trim().length < 5) return invalid('Add a title of at least 5 characters.')
    if (input.body.trim().length < 20) return invalid('Write at least 20 characters.')
    const announcement = {
      id: nextId('demo-ann'),
      title: input.title.trim(),
      body: input.body.trim(),
      audience: input.audience,
      publishedAt: nowISO(),
      publishedBy: 'Demo Administrator',
      isDemo: true,
    }
    demoDb.announcements.unshift(announcement)
    demoDb.accounts
      .filter((a) => a.role !== 'admin' && a.status !== 'suspended' && (input.audience === 'all' || `${a.role}s` === input.audience))
      .forEach((a) => notify(a.id, { category: 'announcement', title: announcement.title, body: announcement.body }))
    audit({ action: 'Published announcement', targetType: 'announcement', targetLabel: announcement.title, detail: `Audience: ${input.audience}` })
    return ok(copy(announcement))
  },
}

/* ---------------------------------------------------------------- Settings */

function validateSettings(s: PlatformSettings) {
  const total = Object.values(s.matching.weights).reduce((sum, w) => sum + w, 0)
  if (total !== 100) return `Matching weights must add up to 100 (currently ${total}).`
  if (s.matching.weights.material < 1) return 'Material compatibility must keep some weight — it is also a hard restriction.'
  if (!(s.commission.ratePercent >= 0 && s.commission.ratePercent <= 30)) return 'Commission must be between 0% and 30%.'
  if (!(s.matching.minRecommendedScore >= 0 && s.matching.minRecommendedScore <= 100)) return 'Minimum score must be between 0 and 100.'
  if (!(s.marketplace.maxImagesPerListing >= 1 && s.marketplace.maxImagesPerListing <= 12)) return 'Images per listing must be between 1 and 12.'
  return undefined
}

export const demoSettingsService: SettingsService = {
  async get() {
    await delay(250)
    return ok(copy(demoDb.settings))
  },
  async update(settings) {
    await delay(600)
    const problem = validateSettings(settings)
    if (problem) return invalid(problem)
    const changed = (Object.keys(settings) as (keyof PlatformSettings)[]).filter((k) => JSON.stringify(settings[k]) !== JSON.stringify(demoDb.settings[k]))
    demoDb.settings = copy(settings)
    applyMatchingSettings(settings.matching.weights, settings.matching.minRecommendedScore)
    audit({ action: 'Updated platform settings', targetType: 'settings', targetLabel: changed.length ? changed.join(', ') : 'No changes' })
    return ok(copy(demoDb.settings))
  },
}

/* ---------------------------------------------------------------- Audit & payments */

export const demoAuditService: AuditService = {
  async list() {
    await delay(300)
    return ok(copy(demoDb.auditLog))
  },
}

/** Paystack isn't integrated: there are no payment records, real or fake. */
// Demo mode never simulates payments: no fake transactions or payment records.
export const demoPaymentService: PaymentService = {
  async listPayments() {
    await delay(300)
    return notConnected('Payment records')
  },
  async startCheckout() {
    await delay(300)
    return notConnected('Online payment')
  },
  async verifyPayment() {
    await delay(300)
    return notConnected('Online payment')
  },
  async markPayoutPaid() {
    await delay(300)
    return notConnected('Seller payouts')
  },
  async markRefunded() {
    await delay(300)
    return notConnected('Refunds')
  },
}

export const demoPlatformConfigService: PlatformConfigService = {
  async get() {
    const { marketplace, commission } = demoDb.settings
    return ok({ allowCollection: marketplace.allowCollection, maxImagesPerListing: marketplace.maxImagesPerListing, commissionRatePercent: commission.ratePercent })
  },
}
