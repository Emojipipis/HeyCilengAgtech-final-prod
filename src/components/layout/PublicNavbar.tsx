import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/shared/Section'
import { Logo } from '@/components/shared/Logo'
import { PUBLIC_NAV } from '@/config/navigation'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useAuthModal } from '@/hooks/useAuthModal'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useScrollLock } from '@/hooks/useScrollLock'
import { cn } from '@/lib/cn'
import { SectionLink } from './SectionLink'
import { ThemeToggle } from './ThemeToggle'

export function PublicNavbar() {
  const { pathname } = useLocation()
  const { openAuth } = useAuthModal()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const isHome = pathname === '/'
  const sectionIds = PUBLIC_NAV.flatMap((item) => (item.section ? [item.section] : []))
  const active = useActiveSection(sectionIds, isHome)
  const isCurrent = (item: (typeof PUBLIC_NAV)[number]) =>
    item.to ? pathname === item.to || pathname.startsWith(`${item.to}/`) : isHome && active === item.section

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu when the viewport grows past the breakpoint.
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const onChange = () => media.matches && setMenuOpen(false)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useScrollLock(menuOpen)
  useEscapeKey(() => setMenuOpen(false), menuOpen)

  const openFromMenu = (view: 'login' | 'signup') => {
    setMenuOpen(false)
    openAuth(view)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-200',
        scrolled || menuOpen ? 'border-b border-border bg-surface/90 shadow-card backdrop-blur-md' : 'border-b border-transparent bg-transparent',
      )}
    >
      <Container className="flex h-16 items-center gap-6">
        <Logo />

        <nav aria-label="Main" className="ml-6 hidden flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {PUBLIC_NAV.map((item) => {
              const current = isCurrent(item)
              const className = cn('relative rounded-md px-3 py-2 text-sm font-medium transition-colors', current ? 'text-fg' : 'text-muted hover:text-fg')
              const indicator = current && <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-action" aria-hidden="true" />
              return (
                <li key={item.label}>
                  {item.section === undefined ? (
                    <Link to={item.to} aria-current={current ? 'page' : undefined} className={className}>
                      {item.label}
                      {indicator}
                    </Link>
                  ) : (
                    <SectionLink section={item.section} aria-current={current ? 'location' : undefined} className={className}>
                      {item.label}
                      {indicator}
                    </SectionLink>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden items-center gap-2 sm:flex">
            <Button variant="ghost" onClick={() => openAuth('login')}>
              Login
            </Button>
            <Button variant="primary" onClick={() => openAuth('signup')}>
              Get Started
            </Button>
          </div>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-surface text-fg lg:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {menuOpen && (
        <div id="mobile-menu" className="h-[calc(100dvh-4rem)] animate-fade-in overflow-y-auto border-t border-border bg-surface lg:hidden">
          <Container className="flex flex-col gap-1 py-4">
            <nav aria-label="Mobile">
              <ul className="flex flex-col">
                {PUBLIC_NAV.map((item) => {
                  const className = cn('flex rounded-md px-3 py-3 text-base font-medium', isCurrent(item) ? 'bg-surface-sunken text-fg' : 'text-muted')
                  return (
                    <li key={item.label}>
                      {item.section === undefined ? (
                        <Link to={item.to} onClick={() => setMenuOpen(false)} className={className}>
                          {item.label}
                        </Link>
                      ) : (
                        <SectionLink section={item.section} onNavigate={() => setMenuOpen(false)} className={className}>
                          {item.label}
                        </SectionLink>
                      )}
                    </li>
                  )
                })}
              </ul>
            </nav>
            <div className="mt-4 grid gap-2 border-t border-border pt-5">
              <Button variant="outline" size="lg" onClick={() => openFromMenu('login')}>
                Login
              </Button>
              <Button variant="primary" size="lg" onClick={() => openFromMenu('signup')}>
                Get Started
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  )
}
