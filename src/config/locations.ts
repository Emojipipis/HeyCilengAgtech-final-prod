/**
 * Supported states with approximate capital-city coordinates, used for location filters and
 * straight-line distance estimates in matching. Real routing distances come from logistics later.
 */
export interface StateMeta {
  id: string
  name: string
  lat: number
  lng: number
}

export const STATES: StateMeta[] = [
  { id: 'abuja', name: 'FCT Abuja', lat: 9.0765, lng: 7.3986 },
  { id: 'benue', name: 'Benue', lat: 7.7337, lng: 8.5214 },
  { id: 'delta', name: 'Delta', lat: 6.1977, lng: 6.7333 },
  { id: 'enugu', name: 'Enugu', lat: 6.4584, lng: 7.5464 },
  { id: 'kaduna', name: 'Kaduna', lat: 10.5105, lng: 7.4165 },
  { id: 'kano', name: 'Kano', lat: 12.0022, lng: 8.592 },
  { id: 'kwara', name: 'Kwara', lat: 8.4966, lng: 4.5421 },
  { id: 'lagos', name: 'Lagos', lat: 6.5244, lng: 3.3792 },
  { id: 'niger', name: 'Niger', lat: 9.6139, lng: 6.5569 },
  { id: 'ogun', name: 'Ogun', lat: 7.1475, lng: 3.3619 },
  { id: 'ondo', name: 'Ondo', lat: 7.2571, lng: 5.2058 },
  { id: 'osun', name: 'Osun', lat: 7.7827, lng: 4.5418 },
  { id: 'oyo', name: 'Oyo', lat: 7.3775, lng: 3.947 },
  { id: 'plateau', name: 'Plateau', lat: 9.8965, lng: 8.8583 },
  { id: 'rivers', name: 'Rivers', lat: 4.8156, lng: 7.0498 },
]

export const STATE_BY_ID = Object.fromEntries(STATES.map((s) => [s.id, s])) as Record<string, StateMeta>

export function stateName(id: string) {
  return STATE_BY_ID[id]?.name ?? id
}
