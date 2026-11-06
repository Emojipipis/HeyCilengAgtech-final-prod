import { ChevronDown, Globe, LogOut, Menu, Search, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Dropdown } from '@/components/ui/Dropdown'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { useSession, useViewer } from '@/hooks/useSession'
import { useToast } from '@/hooks/useToast'
import { ThemeToggle } from './ThemeToggle'

interface TopbarProps {
  onOpenMenu: () => void
  /** Omit to hide the Profile menu item. */
  profilePath?: string
  /** When set, the search box submits to this path with `?q=`. */
  searchPath?: string
  searchPlaceholder?: string
}

export function Topbar({ onOpenMenu, profilePath, searchPath, searchPlaceholder = 'Search…' }: TopbarProps) {
  const navigate = useNavigate()
  const { user, isDemo } = useViewer()
  const { signOut } = useSession()
  const { toast } = useToast()
  const [query, setQuery] = useState('')

  const onSearch = (event: FormEvent) => {
    event.preventDefault()
    if (!searchPath) return
    const q = query.trim()
    // The nonce lets the target page reset to this search even if it's already open.
    navigate(q ? `${searchPath}?q=${encodeURIComponent(q)}` : searchPath, { state: { search: Date.now() } })
  }

  const onSignOut = async () => {
    await signOut()
    navigate('/')
    toast({ tone: 'info', title: isDemo ? 'Demo preview closed' : 'Signed out' })
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open navigation"
        className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-surface text-fg lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {searchPath && (
        <form role="search" onSubmit={onSearch} className="relative hidden max-w-md flex-1 md:block">
          <label htmlFor="topbar-search" className="sr-only">
            Search the marketplace
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-subtle" aria-hidden="true" />
          <input
            id="topbar-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-md border border-border bg-surface-muted pr-3 pl-10 text-sm text-fg placeholder:text-subtle focus:border-action focus:bg-surface focus:ring-3 focus:ring-action/20 focus:outline-none"
          />
        </form>
      )}

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell />
        <Dropdown
          header={
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.fullName}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
              {isDemo && <p className="mt-1 text-[11px] font-semibold text-ochre-700 dark:text-ochre-300">Demo account</p>}
            </div>
          }
          trigger={(props) => (
            <button
              {...props}
              type="button"
              aria-label="Account menu"
              className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pr-2.5 pl-1 transition-colors hover:bg-surface-sunken"
            >
              <Avatar name={user.fullName} size="sm" />
              <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{user.fullName.split(' ')[0]}</span>
              <ChevronDown className="size-4 text-subtle" aria-hidden="true" />
            </button>
          )}
          items={[
            ...(profilePath ? [{ key: 'profile', label: 'Profile', icon: <UserRound />, onSelect: () => navigate(profilePath) }] : []),
            { key: 'site', label: 'Back to website', icon: <Globe />, onSelect: () => navigate('/') },
            { key: 'signout', label: isDemo ? 'Exit demo preview' : 'Sign out', icon: <LogOut />, tone: 'danger', onSelect: () => void onSignOut() },
          ]}
        />
      </div>
    </header>
  )
}
