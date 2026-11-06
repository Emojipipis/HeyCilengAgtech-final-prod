import { createContext } from 'react'
import type { Session, User } from '@/types/user'

export interface SessionContextValue {
  /** Real backend session (Supabase Auth); null when signed out or in Demo Preview Mode. */
  session: Session | null
  status: 'loading' | 'authenticated' | 'anonymous'
  signOut: () => Promise<void>
}

export const SessionContext = createContext<SessionContextValue | null>(null)

/** The user a dashboard renders for: the real session user, or a labelled demo user in Demo Preview Mode. */
export interface ViewerContextValue {
  user: User
  isDemo: boolean
}

export const ViewerContext = createContext<ViewerContextValue | null>(null)
