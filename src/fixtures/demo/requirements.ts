import type { Requirement } from '@/types/requirement'

/** ⚠ Illustrative demo buyer requirements. */
export const DEMO_REQUIREMENTS: Requirement[] = [
  {
    id: 'demo-req-1', buyerId: 'demo-buyer-1', title: 'Dried cassava peels for poultry feed', category: 'peels_pulp',
    quantity: 10, unit: 'tonne', budgetMin: 40000, budgetMax: 55000, preferredLocation: 'oyo', maxDeliveryDistanceKm: 150,
    intendedApplication: 'animal_feed', qualityRequirements: ['sun_dried', 'low_moisture', 'bagged'],
    qualitySpecifications: 'Moisture ≤ 12%, minimal sand.', additionalSpecifications: 'Monthly supply preferred.',
    expiresAt: '2026-12-31', status: 'active', createdAt: '2026-10-29T10:00:00Z',
  },
  {
    id: 'demo-req-2', buyerId: 'demo-buyer-1', title: 'Biomass fuel for boiler trial', category: 'husks_shells',
    quantity: 20, unit: 'tonne', budgetMax: 20000, preferredLocation: 'oyo', maxDeliveryDistanceKm: 400,
    intendedApplication: 'bioenergy', qualityRequirements: ['low_moisture'],
    qualitySpecifications: 'Dry, low ash preferred.', additionalSpecifications: 'Trial order before contract.',
    expiresAt: '2026-12-15', status: 'active', createdAt: '2026-10-21T10:00:00Z',
  },
  {
    id: 'demo-req-3', buyerId: 'demo-buyer-1', title: 'Bran for fish feed', category: 'processing',
    quantity: 5, unit: 'tonne', budgetMax: 140000, preferredLocation: 'oyo', maxDeliveryDistanceKm: 300,
    intendedApplication: 'animal_feed', qualityRequirements: ['bagged', 'low_moisture', 'contaminant_free'],
    qualitySpecifications: 'Clean bran, bagged.', additionalSpecifications: '',
    expiresAt: '2027-01-20', status: 'paused', createdAt: '2026-10-02T10:00:00Z',
  },
  {
    id: 'demo-req-4', buyerId: 'demo-buyer-1', title: 'Maize cobs for mushroom substrate', category: 'cobs_bagasse',
    quantity: 4, unit: 'tonne', budgetMax: 25000, preferredLocation: 'oyo', maxDeliveryDistanceKm: 250,
    intendedApplication: 'mushroom_substrate', qualityRequirements: ['sun_dried'],
    qualitySpecifications: '', additionalSpecifications: 'Pilot batch.',
    expiresAt: '2026-10-31', status: 'active', createdAt: '2026-09-15T10:00:00Z',
  },
  {
    id: 'demo-req-5', buyerId: 'demo-buyer-1', title: 'Poultry litter for feed-crop farm', category: 'livestock',
    quantity: 200, unit: 'bag', budgetMax: 3000, preferredLocation: 'oyo', maxDeliveryDistanceKm: 200,
    intendedApplication: 'organic_fertiliser', qualityRequirements: ['bagged'],
    qualitySpecifications: 'Composted.', additionalSpecifications: '',
    expiresAt: '2026-11-30', status: 'fulfilled', createdAt: '2026-08-20T10:00:00Z',
  },
  // Requirements from other demo buyers — seen by sellers only as anonymised potential buyers.
  {
    id: 'demo-req-20', buyerId: 'demo-buyer-2', title: 'Cassava peels for biogas digester', category: 'peels_pulp',
    quantity: 20, unit: 'tonne', budgetMax: 22000, preferredLocation: 'lagos', maxDeliveryDistanceKm: 200,
    intendedApplication: 'biogas', qualityRequirements: ['fresh'],
    qualitySpecifications: 'Fresh peels, delivered weekly.', additionalSpecifications: 'Ongoing supply.',
    expiresAt: '2027-01-31', status: 'active', createdAt: '2026-10-26T10:00:00Z',
  },
  {
    id: 'demo-req-21', buyerId: 'demo-buyer-3', title: 'Peel meal for poultry rations', category: 'peels_pulp',
    quantity: 150, unit: 'bag', budgetMax: 4000, preferredLocation: 'kano', maxDeliveryDistanceKm: 600,
    intendedApplication: 'animal_feed', qualityRequirements: ['milled', 'bagged'],
    qualitySpecifications: 'Sieved meal, moisture under 12%.', additionalSpecifications: '',
    expiresAt: '2026-12-20', status: 'active', createdAt: '2026-10-30T10:00:00Z',
  },
  {
    id: 'demo-req-22', buyerId: 'demo-buyer-4', title: 'Dried peels for compost blend', category: 'peels_pulp',
    quantity: 8, unit: 'tonne', budgetMax: 50000, preferredLocation: 'ogun', maxDeliveryDistanceKm: 150,
    intendedApplication: 'organic_fertiliser', qualityRequirements: ['sun_dried'],
    qualitySpecifications: '', additionalSpecifications: 'Bagged preferred.',
    expiresAt: '2026-12-31', status: 'active', createdAt: '2026-11-02T10:00:00Z',
  },
  {
    id: 'demo-req-23', buyerId: 'demo-buyer-2', title: 'Rice husks for boiler fuel', category: 'husks_shells',
    quantity: 30, unit: 'tonne', budgetMax: 18000, preferredLocation: 'lagos', maxDeliveryDistanceKm: 800,
    intendedApplication: 'bioenergy', qualityRequirements: ['low_moisture'],
    qualitySpecifications: '', additionalSpecifications: '',
    expiresAt: '2027-02-28', status: 'active', createdAt: '2026-10-12T10:00:00Z',
  },
  {
    id: 'demo-req-24', buyerId: 'demo-buyer-4', title: 'Fresh pulp for vermicompost', category: 'peels_pulp',
    quantity: 5, unit: 'tonne', budgetMax: 15000, preferredLocation: 'ogun', maxDeliveryDistanceKm: 200,
    intendedApplication: 'organic_fertiliser', qualityRequirements: [],
    qualitySpecifications: '', additionalSpecifications: '',
    expiresAt: '2026-12-31', status: 'paused', createdAt: '2026-10-08T10:00:00Z',
  },
].map((r) => ({ ...r, isDemo: true }) as Requirement)
