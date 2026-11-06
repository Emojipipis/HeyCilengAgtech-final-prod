import { DEMO_USERS } from '@/fixtures/demo/users'
import type { Role } from '@/types/user'

/**
 * Which demo account the demo services act for. Set by RequireRole when a Demo Preview Mode
 * area renders. A real backend derives this from the authenticated session instead.
 */
let role: Role = 'buyer'

export function setDemoActor(next: Role) {
  role = next
}

export const demoActor = {
  get role() {
    return role
  },
  get id() {
    return DEMO_USERS[role].id
  },
}
