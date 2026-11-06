import type { AccountStatus } from './status'

/** Roles are assigned by the backend. Admin can never be chosen during signup. */
export type Role = 'buyer' | 'seller' | 'admin'

/** Account types a visitor may register as. */
export type AccountType = Extract<Role, 'buyer' | 'seller'>

export interface User {
  id: string
  role: Role
  fullName: string
  email: string
  phone: string
  status: AccountStatus
  emailVerified: boolean
  createdAt: string
}

export interface BuyerProfile {
  userId: string
  fullName: string
  email: string
  phone: string
  businessName: string
  industry: string
  location: { state: string; area: string }
  about: string
  updatedAt: string
  isDemo?: boolean
}

export interface SellerProfile {
  userId: string
  fullName: string
  email: string
  phone: string
  businessName: string
  location: { state: string; area: string }
  description: string
  updatedAt: string
  isDemo?: boolean
}

/**
 * What buyers may see about a seller. Deliberately excludes phone, email and personal names —
 * buyers and sellers never contact each other directly.
 */
export interface SellerPublicProfile {
  id: string
  businessName: string
  location: { state: string; area: string }
  description: string
  memberSince: string
  /** Business details reviewed by HeyCileng. */
  verified: boolean
  isDemo?: boolean
}

export interface Session {
  user: User
  /** ISO timestamp. Tokens themselves are managed by the auth client, never by UI code. */
  expiresAt: string
}

export interface BuyerSignupInput {
  accountType: 'buyer'
  fullName: string
  email: string
  phone: string
  password: string
  acceptedTerms: boolean
}

export interface SellerSignupInput extends Omit<BuyerSignupInput, 'accountType'> {
  accountType: 'seller'
  businessName: string
  businessLocation: string
  businessDescription: string
}

export type SignupInput = BuyerSignupInput | SellerSignupInput

export interface SignInInput {
  email: string
  password: string
  /** Keep the session after the browser closes. */
  remember: boolean
}
