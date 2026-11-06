/** Fixed vocabularies shared by listings, requirements and matching. */

export type CategoryId =
  | 'crop_residues'
  | 'husks_shells'
  | 'peels_pulp'
  | 'cobs_bagasse'
  | 'tree_crop'
  | 'processing'
  | 'livestock'
  | 'fibre'

export type ApplicationId =
  | 'animal_feed'
  | 'bioenergy'
  | 'biogas'
  | 'organic_fertiliser'
  | 'building_materials'
  | 'paper_pulp'
  | 'textiles_composites'
  | 'food_ingredients'
  | 'mushroom_substrate'

export type QualityTag = 'sun_dried' | 'low_moisture' | 'bagged' | 'sorted' | 'fresh' | 'milled' | 'pelleted' | 'contaminant_free'

export type Unit = 'kg' | 'tonne' | 'bag'

export type StateId = string

export interface Location {
  state: StateId
  /** Town or local area, e.g. "Iseyin". */
  area: string
}
