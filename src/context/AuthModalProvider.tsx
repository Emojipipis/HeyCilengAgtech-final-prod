import { useCallback, useMemo, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AUTH_VIEWS, AuthModalContext, type AuthView } from './auth-modal-context'

const PARAM = 'auth'

/**
 * Auth modals are driven by the `?auth=` query parameter, so they can be linked to,
 * survive refreshes and close with the browser back button.
 */
export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get(PARAM)
  const view = AUTH_VIEWS.includes(raw as AuthView) ? (raw as AuthView) : null

  const openAuth = useCallback(
    (next: AuthView) =>
      setSearchParams(
        (params) => {
          const copy = new URLSearchParams(params)
          copy.set(PARAM, next)
          return copy
        },
        // Switching between views inside an open modal shouldn't stack history entries.
        { replace: view !== null, preventScrollReset: true },
      ),
    [setSearchParams, view],
  )

  const closeAuth = useCallback(
    () =>
      setSearchParams(
        (params) => {
          const copy = new URLSearchParams(params)
          copy.delete(PARAM)
          return copy
        },
        { preventScrollReset: true },
      ),
    [setSearchParams],
  )

  const value = useMemo(() => ({ view, openAuth, closeAuth }), [view, openAuth, closeAuth])

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>
}
