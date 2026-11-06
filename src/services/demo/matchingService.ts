import { stateName } from '@/config/locations'
import { MATCH_CONFIG } from '@/config/matching'
import { rankListings, scoreMatch } from '@/lib/matching'
import { effectiveRequirementStatus } from '@/lib/requirements'
import type { MatchingService, PotentialBuyer } from '../types'
import { demoActor } from './actor'
import { demoDb } from './db'
import { withSeller } from './marketplaceService'
import { copy, delay, notFound, ok } from './shared'

const myRequirements = () => demoDb.requirements.filter((r) => r.buyerId === demoActor.id)

export const demoMatchingService: MatchingService = {
  async matchesForRequirement(requirementId) {
    await delay(450)
    const requirement = myRequirements().find((r) => r.id === requirementId)
    if (!requirement) return notFound('This requirement')
    const ranked = rankListings(requirement, demoDb.listings, MATCH_CONFIG.minRecommendedScore)
    return ok({ requirement: copy(requirement), matches: ranked.map(({ listing, match }) => ({ listing: withSeller(listing), match })) })
  },

  async topMatches(limit) {
    await delay(400)
    const all = myRequirements()
      .filter((r) => effectiveRequirementStatus(r) === 'active')
      .flatMap((requirement) =>
        rankListings(requirement, demoDb.listings, MATCH_CONFIG.minRecommendedScore).map(({ listing, match }) => ({
          requirement: copy(requirement),
          listing: withSeller(listing),
          match,
        })),
      )
      .sort((a, b) => b.match.score - a.match.score)
    return ok(all.slice(0, limit))
  },

  async matchesForListing(listingId) {
    await delay(300)
    const listing = demoDb.listings.find((l) => l.id === listingId)
    if (!listing) return notFound('This listing')
    const results = myRequirements()
      .filter((r) => effectiveRequirementStatus(r) === 'active')
      .map((requirement) => ({ requirement: copy(requirement), match: scoreMatch(requirement, listing) }))
      .filter(({ match }) => match.type !== 'ineligible' && match.score >= MATCH_CONFIG.minRecommendedScore)
      .sort((a, b) => b.match.score - a.match.score)
    return ok(results)
  },

  async requirementMatchCounts() {
    await delay(250)
    const counts: Record<string, { total: number; full: number }> = {}
    for (const requirement of myRequirements()) {
      const ranked = rankListings(requirement, demoDb.listings, MATCH_CONFIG.minRecommendedScore)
      counts[requirement.id] = { total: ranked.length, full: ranked.filter(({ match }) => match.type === 'full').length }
    }
    return ok(counts)
  },

  async potentialBuyers() {
    await delay(450)
    const listings = demoDb.listings.filter((l) => l.sellerId === demoActor.id && l.status === 'active')
    const requirements = demoDb.requirements.filter((r) => effectiveRequirementStatus(r) === 'active' && r.buyerId !== demoActor.id)
    const results: PotentialBuyer[] = []
    for (const requirement of requirements) {
      for (const listing of listings) {
        const match = scoreMatch(requirement, listing)
        if (match.type === 'ineligible' || match.score < MATCH_CONFIG.minRecommendedScore) continue
        // Strip the buyer's identity: sellers see the requirement, never who posted it.
        const anonymised = { ...copy(requirement), buyerId: 'hidden' }
        results.push({ requirement: anonymised, buyerLabel: `Buyer in ${stateName(requirement.preferredLocation)}`, listing: copy(listing), match })
      }
    }
    return ok(results.sort((a, b) => b.match.score - a.match.score))
  },
}
