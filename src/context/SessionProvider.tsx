import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { services } from '@/services'
import type { Session } from '@/types/user'
import { SessionContext } from './session-context'

/**
 * Holds the authenticated session. With no auth backend connected there is never a session;
 * the Supabase integration will restore it here (getSession + onAuthStateChange).
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)

  const signOut = useCallback(async () => {
    await services.auth.signOut()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({ session, status: session ? ('authenticated' as const) : ('anonymous' as const), signOut }),
    [session, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
