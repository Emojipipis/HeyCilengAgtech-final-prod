export type MatchCriterion = 'material' | 'quantity' | 'location' | 'price' | 'application' | 'quality'

export type CriterionStatus = 'good' | 'partial' | 'poor' | 'unknown'

export interface CriterionScore {
  criterion: MatchCriterion
  weight: number
  /** 0–1 */
  score: number
  status: CriterionStatus
  /** Short explanation, e.g. "8 t available of 5 t needed". */
  detail: string
}

/** Full: every key criterion satisfied. Partial: usable with limitations. Ineligible: hard restriction failed. */
export type MatchType = 'full' | 'partial' | 'ineligible'

export interface MatchResult {
  requirementId: string
  listingId: string
  /** 0–100, advisory only. */
  score: number
  type: MatchType
  criteria: CriterionScore[]
  reasons: string[]
  warnings: string[]
}
