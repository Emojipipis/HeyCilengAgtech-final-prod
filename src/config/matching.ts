import type { MatchCriterion } from '@/types/match'

/**
 * Default matching weights (sum = 1). Material compatibility is also a hard restriction:
 * a category mismatch makes a listing ineligible regardless of other scores.
 */
export const DEFAULT_MATCH_WEIGHTS: Record<MatchCriterion, number> = {
  material: 0.3,
  quantity: 0.2,
  location: 0.15,
  price: 0.15,
  application: 0.1,
  quality: 0.1,
}

export const DEFAULT_MIN_RECOMMENDED_SCORE = 40

/**
 * Weights and threshold currently in effect. Platform settings update these at runtime in demo mode;
 * with a backend, scoring runs server-side and these mirror the saved settings for display.
 */
export const MATCH_WEIGHTS: Record<MatchCriterion, number> = { ...DEFAULT_MATCH_WEIGHTS }
export const MATCH_CONFIG = { minRecommendedScore: DEFAULT_MIN_RECOMMENDED_SCORE }

/** Applies settings expressed in percent (they must add up to 100). */
export function applyMatchingSettings(weightsPercent: Record<MatchCriterion, number>, minRecommendedScore: number) {
  ;(Object.keys(weightsPercent) as MatchCriterion[]).forEach((key) => {
    MATCH_WEIGHTS[key] = weightsPercent[key] / 100
  })
  MATCH_CONFIG.minRecommendedScore = minRecommendedScore
}

export const CRITERION_LABELS: Record<MatchCriterion, string> = {
  material: 'Material compatibility',
  quantity: 'Quantity suitability',
  location: 'Location suitability',
  price: 'Price suitability',
  application: 'Intended application',
  quality: 'Quality specifications',
}
