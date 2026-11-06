import { stateName } from '@/config/locations'
import { MATCH_CONFIG } from '@/config/matching'
import { filterListings } from '@/lib/listingFilters'
import { rankListings, scoreMatch } from '@/lib/matching'
import { effectiveRequirementStatus } from '@/lib/requirements'
import type { Listing, MarketplaceListing } from '@/types/listing'
import type { MarketplaceService, MatchingService, PotentialBuyer, RequirementService } from '../types'
import { currentUserId, supabase } from './client'
import { fail, notFound, ok, signedOut } from './errors'
import { toListing, toRequirement, toRequirementRow, toSellerPublic, type ListingRow, type RequirementRow, type SellerPublicRow } from './mappers'

/** Public listings (RLS already hides suspended sellers) joined with the sellers' public profiles. */
export async function fetchPublicListings(ids?: string[]): Promise<MarketplaceListing[]> {
  let query = supabase.from('listings').select('*').in('status', ['active', 'sold_out'])
  if (ids) query = query.in('id', ids)
  const { data: rows, error } = await query.returns<ListingRow[]>()
  if (error) throw error
  const sellerIds = [...new Set(rows.map((r) => r.seller_id))]
  const { data: sellers, error: sellerError } = sellerIds.length
    ? await supabase.from('sellers_public').select('*').in('id', sellerIds).returns<SellerPublicRow[]>()
    : { data: [] as SellerPublicRow[], error: null }
  if (sellerError) throw sellerError
  const byId = new Map(sellers.map((s) => [s.id, toSellerPublic(s)]))
  return rows.filter((r) => byId.has(r.seller_id)).map((r) => ({ listing: toListing(r), seller: byId.get(r.seller_id)! }))
}

async function guard<T>(run: () => Promise<T>) {
  try {
    return ok(await run())
  } catch (error) {
    return fail<T>(error as { message?: string; code?: string })
  }
}

export const supabaseMarketplaceService: MarketplaceService = {
  listListings(filters) {
    return guard(async () => {
      const items = await fetchPublicListings()
      const name = new Map(items.map((i) => [i.listing.sellerId, i.seller.businessName]))
      const filtered = filterListings(items.map((i) => i.listing), filters, (id) => name.get(id) ?? '')
      const byId = new Map(items.map((i) => [i.listing.id, i]))
      return filtered.map((l) => byId.get(l.id)!)
    })
  },

  async getListing(id) {
    const result = await guard(() => fetchPublicListings([id]))
    if (!result.ok) return result
    return result.data[0] ? ok(result.data[0]) : notFound('This listing')
  },

  async listSaved() {
    const ids = await this.savedIds()
    if (!ids.ok) return ids
    if (ids.data.length === 0) return ok([])
    return guard(() => fetchPublicListings(ids.data))
  },

  async savedIds() {
    const uid = await currentUserId()
    if (!uid) return ok([])
    const { data, error } = await supabase.from('saved_listings').select('listing_id').eq('user_id', uid)
    return error ? fail(error) : ok(data.map((r) => r.listing_id as string))
  },

  async setSaved(listingId, saved) {
    const uid = await currentUserId()
    if (!uid) return signedOut()
    const { error } = saved
      ? await supabase.from('saved_listings').upsert({ user_id: uid, listing_id: listingId })
      : await supabase.from('saved_listings').delete().eq('user_id', uid).eq('listing_id', listingId)
    return error ? fail(error) : ok({ saved })
  },
}

/* ------------------------------------------------------------------ Requirements */

async function myRequirements() {
  const uid = await currentUserId()
  if (!uid) return []
  const { data, error } = await supabase.from('requirements').select('*').eq('buyer_id', uid).order('created_at', { ascending: false }).returns<RequirementRow[]>()
  if (error) throw error
  return data.map(toRequirement)
}

export const supabaseRequirementService: RequirementService = {
  list() {
    return guard(myRequirements)
  },
  async get(id) {
    const { data, error } = await supabase.from('requirements').select('*').eq('id', id).maybeSingle<RequirementRow>()
    if (error) return fail(error)
    return data ? ok(toRequirement(data)) : notFound('This requirement')
  },
  async create(input) {
    const { data, error } = await supabase.from('requirements').insert(toRequirementRow(input)).select().single<RequirementRow>()
    return error ? fail(error) : ok(toRequirement(data))
  },
  async update(id, input) {
    const { data, error } = await supabase.from('requirements').update(toRequirementRow(input)).eq('id', id).select().single<RequirementRow>()
    return error ? fail(error) : ok(toRequirement(data))
  },
  async setStatus(id, status) {
    const { data, error } = await supabase.from('requirements').update({ status }).eq('id', id).select().single<RequirementRow>()
    return error ? fail(error) : ok(toRequirement(data))
  },
  async remove(id) {
    const { error } = await supabase.from('requirements').delete().eq('id', id)
    return error ? fail(error) : ok(null)
  },
}

/* ------------------------------------------------------------------ Matching (advisory, computed in the browser) */

async function myActiveListings(): Promise<Listing[]> {
  const uid = await currentUserId()
  if (!uid) return []
  const { data, error } = await supabase.from('listings').select('*').eq('seller_id', uid).eq('status', 'active').returns<ListingRow[]>()
  if (error) throw error
  return data.map(toListing)
}

export const supabaseMatchingService: MatchingService = {
  async matchesForRequirement(requirementId) {
    return guard(async () => {
      const requirement = (await myRequirements()).find((r) => r.id === requirementId)
      if (!requirement) throw { message: 'This requirement couldn’t be found.', code: 'PGRST116' }
      const items = await fetchPublicListings()
      const byId = new Map(items.map((i) => [i.listing.id, i]))
      const ranked = rankListings(requirement, items.map((i) => i.listing), MATCH_CONFIG.minRecommendedScore)
      return { requirement, matches: ranked.map(({ listing, match }) => ({ listing: byId.get(listing.id)!, match })) }
    })
  },

  topMatches(limit) {
    return guard(async () => {
      const [requirements, items] = await Promise.all([myRequirements(), fetchPublicListings()])
      const byId = new Map(items.map((i) => [i.listing.id, i]))
      return requirements
        .filter((r) => effectiveRequirementStatus(r) === 'active')
        .flatMap((requirement) =>
          rankListings(requirement, items.map((i) => i.listing), MATCH_CONFIG.minRecommendedScore).map(({ listing, match }) => ({ requirement, listing: byId.get(listing.id)!, match })),
        )
        .sort((a, b) => b.match.score - a.match.score)
        .slice(0, limit)
    })
  },

  potentialBuyers() {
    return guard(async () => {
      const listings = await myActiveListings()
      if (listings.length === 0) return []
      // requirements_open has no buyer identity — sellers only ever see anonymised demand.
      const { data, error } = await supabase.from('requirements_open').select('*').returns<RequirementRow[]>()
      if (error) throw error
      const results: PotentialBuyer[] = []
      for (const requirement of data.map(toRequirement)) {
        for (const listing of listings) {
          const match = scoreMatch(requirement, listing)
          if (match.type === 'ineligible' || match.score < MATCH_CONFIG.minRecommendedScore) continue
          results.push({ requirement, buyerLabel: `Buyer in ${stateName(requirement.preferredLocation)}`, listing, match })
        }
      }
      return results.sort((a, b) => b.match.score - a.match.score)
    })
  },

  matchesForListing(listingId) {
    return guard(async () => {
      const [requirements, items] = await Promise.all([myRequirements(), fetchPublicListings([listingId])])
      const listing = items[0]?.listing
      if (!listing) return []
      return requirements
        .filter((r) => effectiveRequirementStatus(r) === 'active')
        .map((requirement) => ({ requirement, match: scoreMatch(requirement, listing) }))
        .filter(({ match }) => match.type !== 'ineligible' && match.score >= MATCH_CONFIG.minRecommendedScore)
        .sort((a, b) => b.match.score - a.match.score)
    })
  },

  requirementMatchCounts() {
    return guard(async () => {
      const [requirements, items] = await Promise.all([myRequirements(), fetchPublicListings()])
      const listings = items.map((i) => i.listing)
      return Object.fromEntries(
        requirements.map((r) => {
          const ranked = rankListings(r, listings, MATCH_CONFIG.minRecommendedScore)
          return [r.id, { total: ranked.length, full: ranked.filter(({ match }) => match.type === 'full').length }]
        }),
      )
    })
  },
}

export { guard }
