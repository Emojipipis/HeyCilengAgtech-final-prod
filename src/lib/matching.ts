import { APPLICATIONS, CATEGORY_BY_ID, QUALITY_TAGS } from '@/config/catalog'
import { stateName } from '@/config/locations'
import { MATCH_WEIGHTS } from '@/config/matching'
import type { Listing } from '@/types/listing'
import type { CriterionScore, CriterionStatus, MatchCriterion, MatchResult } from '@/types/match'
import type { Requirement } from '@/types/requirement'
import { formatCurrency, formatNumber } from './format'
import { distanceBetweenStates } from './geo'
import { availableQuantity, convertQuantity, convertUnitPrice } from './inventory'

/**
 * Advisory match scoring between a buyer requirement and a seller listing.
 *
 * This runs in the browser for display and explanation only. Production scoring should run on
 * the backend so it can't be tampered with — and matching never places orders, reserves stock
 * or contacts anyone.
 */

const statusFor = (score: number): CriterionStatus => (score >= 0.999 ? 'good' : score >= 0.5 ? 'partial' : 'poor')

function criterion(key: MatchCriterion, score: number, detail: string, status: CriterionStatus = statusFor(score)): CriterionScore {
  return { criterion: key, weight: MATCH_WEIGHTS[key], score: Math.max(0, Math.min(1, score)), status, detail }
}

export function scoreMatch(requirement: Requirement, listing: Listing): MatchResult {
  const base = { requirementId: requirement.id, listingId: listing.id }
  const reasons: string[] = []
  const warnings: string[] = []
  // Explanations are always in kg, whatever unit the buyer or seller chose.
  const kg = (q: number) => `${formatNumber(Math.round(convertQuantity(q, requirement.unit, 'kg') * 100) / 100)} kg`
  const perKg = (p: number) => formatCurrency(Math.round(convertUnitPrice(p, requirement.unit, 'kg') * 100) / 100)

  // 1. Material — hard restriction.
  if (listing.category !== requirement.category) {
    return {
      ...base,
      score: 0,
      type: 'ineligible',
      criteria: [criterion('material', 0, `${CATEGORY_BY_ID[listing.category].name} doesn’t match ${CATEGORY_BY_ID[requirement.category].name}`, 'poor')],
      reasons: [],
      warnings: ['Material category doesn’t match — not a suitable recommendation.'],
    }
  }
  const available = convertQuantity(availableQuantity(listing), listing.unit, requirement.unit)
  if (listing.status !== 'active' || available <= 0) {
    return {
      ...base,
      score: 0,
      type: 'ineligible',
      criteria: [criterion('material', 1, 'Same material category')],
      reasons: [],
      warnings: ['This listing has no available quantity right now.'],
    }
  }
  const material = criterion('material', 1, `Same category: ${CATEGORY_BY_ID[listing.category].name}`)
  reasons.push(`Same material category (${CATEGORY_BY_ID[listing.category].name}).`)

  // 2. Quantity — insufficient quantity makes the match partial.
  const ratio = available / requirement.quantity
  const quantity = criterion(
    'quantity',
    Math.min(1, ratio),
    `${kg(available)} available of ${kg(requirement.quantity)} needed`,
  )
  if (ratio >= 1) reasons.push('Enough stock available to cover the full quantity.')
  else warnings.push(`Only ${Math.round(ratio * 100)}% of your required quantity is available — this is a partial match.`)
  const minOrder = convertQuantity(listing.minOrderQuantity, listing.unit, requirement.unit)
  if (minOrder > requirement.quantity) {
    warnings.push(`The seller’s minimum order (${kg(minOrder)}) is above your required quantity.`)
  }

  // 3. Location — straight-line estimate between state centres.
  const distance = distanceBetweenStates(listing.location.state, requirement.preferredLocation)
  const max = requirement.maxDeliveryDistanceKm
  let location: CriterionScore
  if (distance === undefined) {
    location = criterion('location', 0.5, 'Distance couldn’t be estimated', 'unknown')
    warnings.push('We couldn’t estimate the distance for this listing.')
  } else if (distance <= max) {
    location = criterion('location', 1, distance === 0 ? `In ${stateName(requirement.preferredLocation)}` : `≈${formatNumber(distance)} km away · within your ${formatNumber(max)} km limit`)
    reasons.push(distance === 0 ? 'Located in your preferred state.' : `About ${formatNumber(distance)} km from your preferred location.`)
  } else {
    const score = Math.max(0, 1 - (distance - max) / max)
    location = criterion('location', score, `≈${formatNumber(distance)} km away · beyond your ${formatNumber(max)} km limit`)
    warnings.push(`About ${formatNumber(distance)} km away — further than your ${formatNumber(max)} km maximum. Delivery may cost more.`)
  }

  // 4. Price — compared per requirement unit.
  const price = convertUnitPrice(listing.pricePerUnit, listing.unit, requirement.unit)
  let priceScore: CriterionScore
  if (price <= requirement.budgetMax) {
    priceScore = criterion('price', 1, `${perKg(price)} / kg · within budget`)
    reasons.push(`Priced within your budget at about ${perKg(price)} per kg.`)
  } else {
    const over = (price - requirement.budgetMax) / requirement.budgetMax
    priceScore = criterion('price', 1 - over / 0.3, `${perKg(price)} / kg · ${Math.round(over * 100)}% above budget`)
    warnings.push(`About ${Math.round(over * 100)}% above your maximum budget of ${perKg(requirement.budgetMax)} per kg.`)
  }

  // 5. Intended application.
  const suited = listing.applications.includes(requirement.intendedApplication)
  const application = suited
    ? criterion('application', 1, `Listed as suitable for ${APPLICATIONS[requirement.intendedApplication].toLowerCase()}`)
    : criterion('application', 0.3, `Not listed for ${APPLICATIONS[requirement.intendedApplication].toLowerCase()}`, 'unknown')
  if (suited) reasons.push(`The seller lists it for ${APPLICATIONS[requirement.intendedApplication].toLowerCase()}.`)
  else warnings.push(`The seller hasn’t listed ${APPLICATIONS[requirement.intendedApplication].toLowerCase()} as an intended use — confirm suitability with HeyCileng support.`)

  // 6. Quality tags.
  const required = requirement.qualityRequirements
  let quality: CriterionScore
  if (required.length === 0) {
    quality = criterion('quality', 1, 'No specific quality tags required')
  } else {
    const met = required.filter((tag) => listing.qualityTags.includes(tag))
    const missing = required.filter((tag) => !listing.qualityTags.includes(tag))
    quality = criterion('quality', met.length / required.length, `${met.length} of ${required.length} quality requirements met`)
    if (missing.length === 0) reasons.push('Meets all of your listed quality requirements.')
    else warnings.push(`Not confirmed: ${missing.map((tag) => QUALITY_TAGS[tag]).join(', ')}.`)
  }

  const criteria = [material, quantity, location, priceScore, application, quality]
  const score = Math.round(criteria.reduce((sum, c) => sum + c.weight * c.score, 0) * 100)
  const full =
    quantity.status === 'good' &&
    location.status === 'good' &&
    priceScore.status === 'good' &&
    application.status !== 'poor' &&
    quality.status !== 'poor'

  return { ...base, score, type: full ? 'full' : 'partial', criteria, reasons, warnings }
}

/** Scores and ranks listings for a requirement, dropping ineligible ones. */
export function rankListings(requirement: Requirement, listings: Listing[], minScore = 0) {
  return listings
    .map((listing) => ({ listing, match: scoreMatch(requirement, listing) }))
    .filter(({ match }) => match.type !== 'ineligible' && match.score >= minScore)
    .sort((a, b) => b.match.score - a.match.score)
}
