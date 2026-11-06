import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import type { DashboardNavGroup } from '@/config/navigation'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useViewer } from '@/hooks/useSession'
import { DemoBanner } from './DemoBanner'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface DashboardLayoutProps {
  nav: DashboardNavGroup[]
  areaLabel: string
  homePath: string
  profilePath?: string
  searchPath?: string
  searchPlaceholder?: string
}

/** Shared shell for buyer, seller and admin areas. */
export function DashboardLayout({ nav, areaLabel, homePath, profilePath, searchPath, searchPlaceholder }: DashboardLayoutProps) {
  const { isDemo } = useViewer()
  const [menuOpen, setMenuOpen] = useState(false)
  useScrollLock(menuOpen)
  useEscapeKey(() => setMenuOpen(false), menuOpen)

  return (
    <div className="min-h-dvh bg-bg">
      <Sidebar groups={nav} areaLabel={areaLabel} homePath={homePath} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-h-dvh flex-col lg:pl-64">
        {isDemo && <DemoBanner />}
        <Topbar onOpenMenu={() => setMenuOpen(true)} profilePath={profilePath} searchPath={searchPath} searchPlaceholder={searchPlaceholder} />
        <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
