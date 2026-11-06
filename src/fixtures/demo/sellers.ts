import type { SellerPublicProfile } from '@/types/user'

/** ⚠ Illustrative demo seller businesses. Names are fictional and marked "(Demo)". */
export const DEMO_SELLERS: SellerPublicProfile[] = [
  {
    id: 'demo-seller-1',
    businessName: 'Sunfield Cassava Processors (Demo)',
    location: { state: 'oyo', area: 'Iseyin' },
    description: 'Sample garri and starch processor with weekly cassava peel output.',
    memberSince: '2026-02-02',
    verified: true,
  },
  {
    id: 'demo-seller-2',
    businessName: 'Northgate Grain Millers (Demo)',
    location: { state: 'kano', area: 'Dawakin Tofa' },
    description: 'Sample cooperative milling maize and wheat, producing bran and cobs.',
    memberSince: '2026-04-18',
    verified: true,
  },
  {
    id: 'demo-seller-3',
    businessName: 'Riverbend Rice Mill (Demo)',
    location: { state: 'benue', area: 'Makurdi' },
    description: 'Sample rice parboiling and milling operation with steady husk supply.',
    memberSince: '2026-05-07',
    verified: true,
  },
  {
    id: 'demo-seller-4',
    businessName: 'Hilltop Cocoa Growers (Demo)',
    location: { state: 'ondo', area: 'Idanre' },
    description: 'Sample growers’ association collecting cocoa pod husks after harvest.',
    memberSince: '2026-06-21',
    verified: false,
  },
  {
    id: 'demo-seller-5',
    businessName: 'Brightlayer Poultry Farm (Demo)',
    location: { state: 'ogun', area: 'Ifo' },
    description: 'Sample layer farm offering composted poultry litter.',
    memberSince: '2026-03-30',
    verified: true,
  },
  {
    id: 'demo-seller-6',
    businessName: 'Savanna Agro Residues (Demo)',
    location: { state: 'kaduna', area: 'Zaria' },
    description: 'Sample aggregator of maize stalks, sorghum stalks and groundnut shells.',
    memberSince: '2026-07-12',
    verified: true,
  },
].map((s) => ({ ...s, isDemo: true }))
