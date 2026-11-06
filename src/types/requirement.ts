import type { ApplicationId, CategoryId, QualityTag, StateId, Unit } from './catalog'
import type { RequirementStatus } from './status'

export interface Requirement {
  id: string
  buyerId: string
  title: string
  category: CategoryId
  quantity: number
  unit: Unit
  /** Budget per unit, in the platform currency. */
  budgetMin?: number
  budgetMax: number
  preferredLocation: StateId
  maxDeliveryDistanceKm: number
  intendedApplication: ApplicationId
  qualityRequirements: QualityTag[]
  qualitySpecifications: string
  additionalSpecifications: string
  /** ISO date (yyyy-mm-dd). Past this date the requirement is treated as expired. */
  expiresAt: string
  /** Stored status; `expired` is derived from `expiresAt` for active/paused requirements. */
  status: RequirementStatus
  createdAt: string
  isDemo?: boolean
}

export type RequirementInput = Omit<Requirement, 'id' | 'buyerId' | 'status' | 'createdAt' | 'isDemo'>
