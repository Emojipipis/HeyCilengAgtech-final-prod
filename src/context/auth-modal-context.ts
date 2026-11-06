import { createContext } from 'react'

export type AuthView = 'login' | 'signup' | 'forgot-password'

export const AUTH_VIEWS: AuthView[] = ['login', 'signup', 'forgot-password']

export interface AuthModalContextValue {
  view: AuthView | null
  openAuth: (view: AuthView) => void
  closeAuth: () => void
}

export const AuthModalContext = createContext<AuthModalContextValue | null>(null)
