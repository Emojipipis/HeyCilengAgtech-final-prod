import type { AdminInsightsService } from '../types'
import { computeCommissions, computeMatchmaking, computeOverview, computeReports, type InsightsData } from '@/lib/insights'
import { demoDb } from './db'
import { delay, ok } from './shared'

const data = (): InsightsData => demoDb

/** Admin aggregates over the demo store (the same calculations as with live data). */
export const demoAdminInsightsService: AdminInsightsService = {
  async overview() {
    await delay(400)
    return ok(computeOverview(data()))
  },
  async reports() {
    await delay(450)
    return ok(computeReports(data()))
  },
  async matchmaking() {
    await delay(450)
    return ok(computeMatchmaking(data()))
  },
  async commissions() {
    await delay(400)
    return ok(computeCommissions(data()))
  },
}
