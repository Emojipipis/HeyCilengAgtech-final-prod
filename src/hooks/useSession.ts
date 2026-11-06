import { useContext } from 'react'
import { SessionContext, ViewerContext, type SessionContextValue, type ViewerContextValue } from '@/context/session-context'

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within SessionProvider')
  return context
}

/** The current dashboard user. Only available inside a RequireRole-guarded route. */
export function useViewer(): ViewerContextValue {
  const context = useContext(ViewerContext)
  if (!context) throw new Error('useViewer must be used inside a RequireRole route')
  return context
}
