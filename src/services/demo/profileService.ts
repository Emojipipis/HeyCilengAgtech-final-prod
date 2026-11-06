import type { ProfileService } from '../types'
import { demoDb, nowISO } from './db'
import { copy, delay, ok } from './shared'

export const demoProfileService: ProfileService = {
  async getBuyerProfile() {
    await delay(300)
    return ok(copy(demoDb.buyerProfile))
  },
  async updateBuyerProfile(input) {
    await delay(600)
    demoDb.buyerProfile = { ...demoDb.buyerProfile, ...input, updatedAt: nowISO() }
    return ok(copy(demoDb.buyerProfile))
  },
  async getSellerProfile() {
    await delay(300)
    return ok(copy(demoDb.sellerProfile))
  },
  async updateSellerProfile(input) {
    await delay(600)
    demoDb.sellerProfile = { ...demoDb.sellerProfile, ...input, updatedAt: nowISO() }
    // Keep the public business profile buyers see in sync (never includes phone or email).
    const publicProfile = demoDb.sellers.find((s) => s.id === demoDb.sellerProfile.userId)
    if (publicProfile) {
      publicProfile.businessName = input.businessName
      publicProfile.location = input.location
      publicProfile.description = input.description
    }
    return ok(copy(demoDb.sellerProfile))
  },
}
