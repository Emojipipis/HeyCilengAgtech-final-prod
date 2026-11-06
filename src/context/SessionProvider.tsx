import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { services } from '@/services'
import type { Session } from '@/types/user'
import { SessionContext } from './session-context'

/** Holds the authenticated session: restored on load, then kept in sync with sign-in, sign-out and refreshes. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    let active = true
    void services.auth.getSession().then((current) => {
      if (!active) return
      setSession(current)
      setRestored(true)
    })
    const unsubscribe = services.auth.onSessionChange((next) => {
      if (active) setSession(next)
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    await services.auth.signOut()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({ session, status: !restored ? ('loading' as const) : session ? ('authenticated' as const) : ('anonymous' as const), signOut }),
    [session, restored, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
