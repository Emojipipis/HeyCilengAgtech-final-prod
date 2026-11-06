import type { Role } from '@/types/user'

/** Landing route for each role after sign-in. The role always comes from the backend session. */
export const DASHBOARD_PATH: Record<Role, string> = {
  buyer: '/buyer',
  seller: '/seller',
  admin: '/admin',
}
