import { useContext } from 'react'
import { AuthModalContext, type AuthModalContextValue } from '@/context/auth-modal-context'

export function useAuthModal(): AuthModalContextValue {
  const context = useContext(AuthModalContext)
  if (!context) throw new Error('useAuthModal must be used within AuthModalProvider')
  return context
}
