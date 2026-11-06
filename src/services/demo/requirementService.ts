import type { Requirement } from '@/types/requirement'
import type { RequirementService } from '../types'
import { demoActor } from './actor'
import { demoDb, nextId, nowISO } from './db'
import { copy, delay, notFound, ok } from './shared'

/** Only the current demo buyer's requirements. */
const mine = () => demoDb.requirements.filter((r) => r.buyerId === demoActor.id)

export const demoRequirementService: RequirementService = {
  async list() {
    await delay(350)
    return ok(copy(mine().sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
  },

  async get(id) {
    await delay(200)
    const found = mine().find((r) => r.id === id)
    return found ? ok(copy(found)) : notFound('This requirement')
  },

  async create(input) {
    await delay(500)
    const requirement: Requirement = { ...input, id: nextId('demo-req'), buyerId: demoActor.id, status: 'active', createdAt: nowISO(), isDemo: true }
    demoDb.requirements.push(requirement)
    return ok(copy(requirement))
  },

  async update(id, input) {
    await delay(500)
    const index = demoDb.requirements.findIndex((r) => r.id === id && r.buyerId === demoActor.id)
    if (index === -1) return notFound('This requirement')
    demoDb.requirements[index] = { ...demoDb.requirements[index], ...input }
    return ok(copy(demoDb.requirements[index]))
  },

  async setStatus(id, status) {
    await delay(300)
    const found = mine().find((r) => r.id === id)
    if (!found) return notFound('This requirement')
    found.status = status
    return ok(copy(found))
  },

  async remove(id) {
    await delay(300)
    demoDb.requirements = demoDb.requirements.filter((r) => !(r.id === id && r.buyerId === demoActor.id))
    return ok(null)
  },
}
