import { STATE_BY_ID } from '@/config/locations'

/** Straight-line distance between two state centres in km (haversine). Undefined if either is unknown. */
export function distanceBetweenStates(a: string, b: string): number | undefined {
  const p = STATE_BY_ID[a]
  const q = STATE_BY_ID[b]
  if (!p || !q) return undefined
  if (a === b) return 0
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(q.lat - p.lat)
  const dLng = toRad(q.lng - p.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p.lat)) * Math.cos(toRad(q.lat)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)))
}
