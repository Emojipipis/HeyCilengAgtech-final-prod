import type { LogisticsService } from '../types'
import type { LogisticsPartnerInput } from '@/types/logistics'
import { audit, demoDb, nextId, nowISO } from './db'
import { copy, delay, invalid, notFound, ok } from './shared'

function validate(input: LogisticsPartnerInput) {
  if (input.name.trim().length < 2) return 'Enter the partner’s name.'
  if (input.coverageStates.length === 0) return 'Choose at least one state the partner covers.'
  return undefined
}

export const demoLogisticsService: LogisticsService = {
  async listPartners() {
    await delay(300)
    return ok(copy([...demoDb.partners].sort((a, b) => a.name.localeCompare(b.name))))
  },

  async createPartner(input) {
    await delay(500)
    const problem = validate(input)
    if (problem) return invalid(problem)
    const partner = { ...input, name: input.name.trim(), id: nextId('demo-partner'), status: 'active' as const, createdAt: nowISO(), isDemo: true }
    demoDb.partners.push(partner)
    audit({ action: 'Added logistics partner', targetType: 'partner', targetLabel: partner.name })
    return ok(copy(partner))
  },

  async updatePartner(id, input) {
    await delay(500)
    const partner = demoDb.partners.find((p) => p.id === id)
    if (!partner) return notFound('This partner')
    const problem = validate(input)
    if (problem) return invalid(problem)
    Object.assign(partner, input, { name: input.name.trim() })
    audit({ action: 'Edited logistics partner', targetType: 'partner', targetLabel: partner.name })
    // Open deliveries keep showing the partner's current name.
    demoDb.orders.forEach((o) => {
      if (o.delivery?.partnerId === id) o.delivery.partnerName = partner.name
    })
    return ok(copy(partner))
  },

  async setPartnerStatus(id, status) {
    await delay(300)
    const partner = demoDb.partners.find((p) => p.id === id)
    if (!partner) return notFound('This partner')
    partner.status = status
    audit({ action: status === 'active' ? 'Activated logistics partner' : 'Deactivated logistics partner', targetType: 'partner', targetLabel: partner.name })
    return ok(copy(partner))
  },
}
