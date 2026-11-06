import { useMemo, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { env } from '@/config/env'
import { ViewerContext } from '@/context/session-context'
import { DEMO_USERS } from '@/fixtures/demo/users'
import { setDemoActor } from '@/services/demo/actor'
import { useSession } from '@/hooks/useSession'
import type { Role } from '@/types/user'

/**
 * UX guard for role areas — NOT a security boundary. The backend must enforce access on every request.
 *
 * - Real session with the matching role → render.
 * - Demo Preview Mode (developer flag) → render with a labelled demo user for this area.
 * - Otherwise → back to the homepage with the login modal open.
 */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session } = useSession()
  const location = useLocation()

  const viewer = useMemo(() => {
    if (session?.user.role === role) return { user: session.user, isDemo: false }
    if (env.demoMode) {
      // Demo services act for the demo account of the area being viewed.
      setDemoActor(role)
      return { user: DEMO_USERS[role], isDemo: true }
    }
    return null
  }, [session, role])

  if (!viewer) {
    if (session) return <Navigate to="/" replace />
    return <Navigate to={{ pathname: '/', search: '?auth=login' }} replace state={{ from: location.pathname }} />
  }

  return <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>
}
