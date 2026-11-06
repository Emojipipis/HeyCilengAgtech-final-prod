import type { LogisticsPartner } from '@/types/logistics'

/**
 * ⚠ Placeholder logistics partners for Demo Preview Mode. These are NOT real companies —
 * HeyCileng administrators add real partners once agreements are in place.
 */
export const DEMO_LOGISTICS_PARTNERS: LogisticsPartner[] = [
  {
    id: 'demo-partner-a', name: 'Demo Logistics Partner A', coverageStates: ['oyo', 'ogun', 'lagos', 'osun', 'kwara'],
    vehicleTypes: 'Flatbed trucks (10–20 t)', contactName: 'Demo contact A', contactPhone: '+234 800 000 0101',
    status: 'active', notes: 'South-west routes. Placeholder record.', createdAt: '2026-02-10T09:00:00Z',
  },
  {
    id: 'demo-partner-b', name: 'Demo Logistics Partner B', coverageStates: ['benue', 'kaduna', 'kano', 'abuja', 'niger', 'plateau'],
    vehicleTypes: 'Tippers and 30 t trailers', contactName: 'Demo contact B', contactPhone: '+234 800 000 0102',
    status: 'active', notes: 'North and middle-belt bulk loads. Placeholder record.', createdAt: '2026-03-02T09:00:00Z',
  },
  {
    id: 'demo-partner-c', name: 'Demo Logistics Partner C', coverageStates: ['rivers', 'delta', 'enugu', 'ondo'],
    vehicleTypes: 'Vans and 5 t trucks', contactName: 'Demo contact C', contactPhone: '+234 800 000 0103',
    status: 'inactive', notes: 'Paused pending agreement renewal. Placeholder record.', createdAt: '2026-05-18T09:00:00Z',
  },
].map((p) => ({ ...p, isDemo: true }) as LogisticsPartner)
