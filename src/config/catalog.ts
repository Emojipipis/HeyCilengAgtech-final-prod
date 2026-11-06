import {
  Apple,
  Factory,
  Leaf,
  Nut,
  Recycle,
  Shrub,
  TreePalm,
  Wheat,
  type LucideIcon,
} from 'lucide-react'
import type { ApplicationId, CategoryId, QualityTag, Unit } from '@/types/catalog'

export interface CategoryMeta {
  id: CategoryId
  name: string
  icon: LucideIcon
  examples: string[]
  uses: string[]
  /** Colour family for generated listing artwork. */
  tone: 'ochre' | 'forest' | 'leaf' | 'amber'
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'crop_residues', name: 'Crop Residues', icon: Wheat, tone: 'ochre', examples: ['Maize stalks', 'Rice straw', 'Sorghum stalks'], uses: ['Animal feed', 'Mulch', 'Bioenergy'] },
  { id: 'husks_shells', name: 'Husks & Shells', icon: Nut, tone: 'amber', examples: ['Rice husks', 'Groundnut shells', 'Palm kernel shells'], uses: ['Boiler fuel', 'Briquettes', 'Building materials'] },
  { id: 'peels_pulp', name: 'Peels & Pulp', icon: Apple, tone: 'leaf', examples: ['Cassava peels', 'Plantain peels', 'Fruit pulp'], uses: ['Livestock feed', 'Biogas', 'Compost'] },
  { id: 'cobs_bagasse', name: 'Cobs & Bagasse', icon: Shrub, tone: 'ochre', examples: ['Maize cobs', 'Sugarcane bagasse'], uses: ['Biofuel', 'Paper & board', 'Mushroom substrate'] },
  { id: 'tree_crop', name: 'Tree Crop By-products', icon: TreePalm, tone: 'forest', examples: ['Cocoa pod husks', 'Coconut husks', 'Palm fronds'], uses: ['Potash', 'Coir fibre', 'Organic fertiliser'] },
  { id: 'processing', name: 'Processing By-products', icon: Factory, tone: 'amber', examples: ['Wheat & rice bran', 'Brewers’ spent grain', 'Oil cake'], uses: ['Animal feed', 'Food ingredients', 'Fermentation'] },
  { id: 'livestock', name: 'Livestock By-products', icon: Recycle, tone: 'forest', examples: ['Poultry litter', 'Cattle manure'], uses: ['Organic fertiliser', 'Biogas', 'Soil conditioner'] },
  { id: 'fibre', name: 'Fibre Residues', icon: Leaf, tone: 'leaf', examples: ['Plantain pseudostem fibre', 'Sisal waste', 'Kenaf stalks'], uses: ['Textiles', 'Composites', 'Pulp'] },
]

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, CategoryMeta>

export const APPLICATIONS: Record<ApplicationId, string> = {
  animal_feed: 'Animal feed',
  bioenergy: 'Bioenergy & solid fuel',
  biogas: 'Biogas',
  organic_fertiliser: 'Organic fertiliser & compost',
  building_materials: 'Building materials',
  paper_pulp: 'Paper & pulp',
  textiles_composites: 'Textiles & composites',
  food_ingredients: 'Food ingredients',
  mushroom_substrate: 'Mushroom substrate',
}

export const QUALITY_TAGS: Record<QualityTag, string> = {
  sun_dried: 'Sun-dried',
  low_moisture: 'Low moisture (≤12%)',
  bagged: 'Bagged',
  sorted: 'Sorted / cleaned',
  fresh: 'Fresh',
  milled: 'Milled / ground',
  pelleted: 'Pelleted',
  contaminant_free: 'Free of plastics & stones',
}

export const UNITS: Record<Unit, { label: string; plural: string; short: string }> = {
  kg: { label: 'Kilogram', plural: 'kilograms', short: 'kg' },
  tonne: { label: 'Tonne', plural: 'tonnes', short: 't' },
  bag: { label: 'Bag (50 kg)', plural: 'bags', short: 'bags' },
}

/** Kilograms per unit. A bag is standardised at 50 kg so quantities stay comparable. */
export const KG_PER_UNIT: Record<Unit, number> = { kg: 1, tonne: 1000, bag: 50 }
