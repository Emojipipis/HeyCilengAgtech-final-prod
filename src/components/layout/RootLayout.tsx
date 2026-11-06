import { Outlet, ScrollRestoration } from 'react-router-dom'
import { AuthModalProvider } from '@/context/AuthModalProvider'
import { SessionProvider } from '@/context/SessionProvider'
import { AuthModalHost } from '@/features/auth/AuthModalHost'

/** Top-level route shell. App-wide providers that need router context mount here. */
export function RootLayout() {
  return (
    <SessionProvider>
      <AuthModalProvider>
        <Outlet />
        <AuthModalHost />
        <ScrollRestoration />
      </AuthModalProvider>
    </SessionProvider>
  )
}
