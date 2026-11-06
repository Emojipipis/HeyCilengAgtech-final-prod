import type { BuyerProfile, Role, SellerProfile, User } from '@/types/user'

/** ⚠ Illustrative demo accounts for Demo Preview Mode. Not real people. */
export const DEMO_USERS: Record<Role, User> = {
  buyer: {
    id: 'demo-buyer-1',
    role: 'buyer',
    fullName: 'Amina Yusuf',
    email: 'buyer.demo@example.com',
    phone: '+234 800 000 0001',
    status: 'active',
    emailVerified: true,
    createdAt: '2026-03-14T09:00:00Z',
  },
  seller: {
    id: 'demo-seller-1',
    role: 'seller',
    fullName: 'Tunde Adebayo',
    email: 'seller.demo@example.com',
    phone: '+234 800 000 0002',
    status: 'active',
    emailVerified: true,
    createdAt: '2026-02-02T09:00:00Z',
  },
  admin: {
    id: 'demo-admin-1',
    role: 'admin',
    fullName: 'Demo Administrator',
    email: 'admin.demo@example.com',
    phone: '+234 800 000 0003',
    status: 'active',
    emailVerified: true,
    createdAt: '2026-01-10T09:00:00Z',
  },
}

export const DEMO_BUYER_PROFILE: BuyerProfile = {
  userId: 'demo-buyer-1',
  fullName: 'Amina Yusuf',
  email: 'buyer.demo@example.com',
  phone: '+234 800 000 0001',
  businessName: 'Greenmill Feeds (Demo)',
  industry: 'Animal feed production',
  location: { state: 'oyo', area: 'Ibadan' },
  about: 'Sample feed mill sourcing cassava peels, bran and other by-products for poultry and fish feed.',
  updatedAt: '2026-10-01T09:00:00Z',
  isDemo: true,
}

export const DEMO_SELLER_PROFILE: SellerProfile = {
  userId: 'demo-seller-1',
  fullName: 'Tunde Adebayo',
  email: 'seller.demo@example.com',
  phone: '+234 800 000 0002',
  businessName: 'Sunfield Cassava Processors (Demo)',
  location: { state: 'oyo', area: 'Iseyin' },
  description: 'Sample garri and starch processor with weekly cassava peel output.',
  updatedAt: '2026-09-12T09:00:00Z',
  isDemo: true,
}

/** Business names of other demo buyers. Shown to sellers on orders only — never contact details. */
export const DEMO_BUYER_NAMES: Record<string, string> = {
  'demo-buyer-1': 'Greenmill Feeds (Demo)',
  'demo-buyer-2': 'Lagoon Biogas Works (Demo)',
  'demo-buyer-3': 'Northern Feeds Co-op (Demo)',
  'demo-buyer-4': 'Ogun Compost Makers (Demo)',
}
