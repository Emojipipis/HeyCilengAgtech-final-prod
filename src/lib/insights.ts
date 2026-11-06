import { CATEGORY_BY_ID } from '@/config/catalog'
import { stateName } from '@/config/locations'
import { MATCH_CONFIG } from '@/config/matching'
import { getStatusMeta } from '@/config/statuses'
import { nextAdminAction } from '@/lib/logistics'
import { rankListings } from '@/lib/matching'
import { effectiveRequirementStatus } from '@/lib/requirements'
import { stockTotalsInTonnes } from '@/lib/stock'
import type { AdminMatchmaking, AdminOverview, AdminReports, AdminUserRecord, CommissionEstimate, Dispute, PlatformSettings } from '@/types/admin'
import type { Listing } from '@/types/listing'
import type { Order } from '@/types/order'
import type { Requirement } from '@/types/requirement'
import type { OrderStatus, TicketStatus } from '@/types/status'
import type { SellerPublicProfile } from '@/types/user'

/** Everything the admin aggregates are computed from. Demo mode passes the demo store; Supabase mode passes fetched rows. */
export interface InsightsData {
  orders: Order[]
  listings: Listing[]
  requirements: Requirement[]
  accounts: AdminUserRecord[]
  tickets: { status: TicketStatus }[]
  disputes: Pick<Dispute, 'status'>[]
  sellers: Pick<SellerPublicProfile, 'id' | 'businessName'>[]
  settings: PlatformSettings
}

const OPEN: OrderStatus[] = ['pending', 'accepted', 'processing', 'dispatched', 'ready_for_collection', 'delivery_failed']
const ACTIONABLE = ['assign_partner', 'resolve_failed', 'mark_ready', 'confirm_collection']

/** When an order completed (its last "completed" timeline event). */
const completedAt = (o: Order) => [...o.timeline].reverse().find((e) => e.status === 'completed')?.at ?? o.updatedAt

/** ISO week start (Monday) as yyyy-mm-dd. */
function weekStart(iso: string) {
const d = new Date(iso)
const day = (d.getUTCDay() + 6) % 7
d.setUTCDate(d.getUTCDate() - day)
return d.toISOString().slice(0, 10)
}

export function computeOverview(data: InsightsData): AdminOverview {
  const completed = data.orders.filter((o) => o.status === 'completed')
  const weeks = new Map<string, number>()
  const now = new Date()
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i * 7)
    weeks.set(weekStart(d.toISOString()), 0)
  }
  data.orders.forEach((o) => {
    const key = weekStart(o.createdAt)
    if (weeks.has(key)) weeks.set(key, (weeks.get(key) ?? 0) + 1)
  })
  return ({
    users: {
      buyers: data.accounts.filter((a) => a.role === 'buyer').length,
      sellers: data.accounts.filter((a) => a.role === 'seller').length,
      suspended: data.accounts.filter((a) => a.status === 'suspended').length,
    },
    listings: {
      active: data.listings.filter((l) => l.status === 'active').length,
      pendingReview: data.listings.filter((l) => l.status === 'pending_review').length,
    },
    orders: {
      open: data.orders.filter((o) => OPEN.includes(o.status)).length,
      needsAction: data.orders.filter((o) => ACTIONABLE.includes(nextAdminAction(o))).length,
      completed: completed.length,
      completedValue: completed.reduce((sum, o) => sum + o.subtotal, 0),
    },
    support: {
      openTickets: data.tickets.filter((t) => ['open', 'in_progress'].includes(t.status)).length,
      openDisputes: data.disputes.filter((d) => ['open', 'under_review'].includes(d.status)).length,
    },
    ordersByWeek: [...weeks.entries()].map(([week, orders]) => ({ week, orders })),
  })
}


export function computeReports(data: InsightsData): AdminReports {
  const statuses = [...new Set(data.orders.map((o) => o.status))]
  const months = new Map<string, number>()
  data.orders
    .filter((o) => o.status === 'completed')
    .forEach((o) => {
      const key = completedAt(o).slice(0, 7)
      months.set(key, (months.get(key) ?? 0) + o.subtotal)
    })
  const categories = Object.values(CATEGORY_BY_ID).map((c) => ({
    category: c.name,
    listings: data.listings.filter((l) => l.category === c.id && l.status === 'active').length,
    requirements: data.requirements.filter((r) => r.category === c.id && effectiveRequirementStatus(r) === 'active').length,
  }))
  return ({
    ordersByStatus: statuses
      .map((s) => ({ status: getStatusMeta('order', s).label, count: data.orders.filter((o) => o.status === s).length }))
      .sort((a, b) => b.count - a.count),
    completedValueByMonth: [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, value]) => ({ month, value })),
    supplyDemandByCategory: categories.filter((c) => c.listings + c.requirements > 0),
    stockTonnes: stockTotalsInTonnes(data.listings.filter((l) => l.status !== 'rejected')),
  })
}


export function computeMatchmaking(data: InsightsData): AdminMatchmaking {
  const active = data.requirements.filter((r) => effectiveRequirementStatus(r) === 'active')
  const matchedListingIds = new Set<string>()
  let full = 0
  let partial = 0
  const requirements = data.requirements.map((r) => {
    const status = effectiveRequirementStatus(r)
    const ranked = status === 'active' ? rankListings(r, data.listings, MATCH_CONFIG.minRecommendedScore) : []
    ranked.forEach(({ listing, match }) => {
      matchedListingIds.add(listing.id)
      if (match.type === 'full') full++
      else partial++
    })
    const account = data.accounts.find((a) => a.id === r.buyerId)
    return {
      id: r.id,
      title: r.title,
      buyerLabel: account?.businessName ?? `Buyer in ${stateName(r.preferredLocation)}`,
      category: CATEGORY_BY_ID[r.category].name,
      status,
      matches: ranked.length,
      full: ranked.filter(({ match }) => match.type === 'full').length,
      bestScore: ranked[0]?.match.score ?? null,
    }
  })
  const activeListings = data.listings.filter((l) => l.status === 'active')
  return ({
    activeRequirements: active.length,
    activeListings: activeListings.length,
    fullMatches: full,
    partialMatches: partial,
    requirements: requirements.sort((a, b) => Number(b.status === 'active') - Number(a.status === 'active') || b.matches - a.matches),
    unmatchedListings: activeListings
      .filter((l) => !matchedListingIds.has(l.id))
      .map((l) => ({
        id: l.id,
        name: l.name,
        sellerBusinessName: data.sellers.find((s) => s.id === l.sellerId)?.businessName ?? '',
        category: CATEGORY_BY_ID[l.category].name,
      })),
  })
}


export function computeCommissions(data: InsightsData): { ratePercent: number; records: CommissionEstimate[] } {
  const rate = data.settings.commission.ratePercent
  const records: CommissionEstimate[] = data.orders
    .filter((o) => o.status === 'completed')
    .map((o) => {
      // Paid orders use the rate recorded at payment; anything else is an estimate at today's rate.
      const collected = o.payment.status === 'paid'
      const ratePercent = collected ? (o.payment.commissionRate ?? rate) : rate
      return {
        orderId: o.id,
        orderReference: o.reference,
        completedAt: completedAt(o),
        sellerBusinessName: o.listing.sellerBusinessName,
        orderValue: o.subtotal,
        ratePercent,
        amount: Math.round(o.subtotal * ratePercent) / 100,
        status: collected ? ('collected' as const) : ('not_collected' as const),
      }
    })
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
  return ({ ratePercent: rate, records })
}

