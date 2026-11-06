import type { Requirement } from '@/types/requirement'
import type { RequirementStatus } from '@/types/status'
import { todayISODate } from './format'

/** Active or paused requirements past their expiry date are shown as expired. */
export function effectiveRequirementStatus(requirement: Pick<Requirement, 'status' | 'expiresAt'>, today = todayISODate()): RequirementStatus {
  if ((requirement.status === 'active' || requirement.status === 'paused') && requirement.expiresAt < today) return 'expired'
  return requirement.status
}
