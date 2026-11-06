import { X } from 'lucide-react'
import { useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/shared/Logo'
import type { DashboardNavGroup } from '@/config/navigation'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/cn'

interface SidebarProps {
  groups: DashboardNavGroup[]
  areaLabel: string
  homePath: string
  /** Mobile drawer state. On large screens the sidebar is always visible. */
  open: boolean
  onClose: () => void
}

function SidebarContent({ groups, areaLabel, homePath, onNavigate }: Omit<SidebarProps, 'open' | 'onClose'> & { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border px-5">
        <Logo to={homePath} />
        <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-ochre-800 uppercase dark:text-ochre-200">
          {areaLabel}
        </span>
      </div>
      <nav aria-label={`${areaLabel} navigation`} className="flex-1 overflow-y-auto px-3 py-5">
        <ul className="space-y-6">
          {groups.map((group, index) => (
            <li key={group.label ?? index}>
              {group.label && <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.12em] text-subtle uppercase">{group.label}</p>}
              <ul className="space-y-0.5">
                {group.items.map(({ label, to, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-leaf-50 font-semibold text-forest-800 dark:bg-leaf-500/10 dark:text-leaf-200 [&>svg]:text-action'
                            : 'text-muted hover:bg-surface-sunken hover:text-fg',
                        )
                      }
                    >
                      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-border p-4">
        <p className="text-xs leading-relaxed text-subtle">
          All order communication goes through HeyCileng notifications and support.
        </p>
      </div>
    </div>
  )
}

export function Sidebar({ open, onClose, ...props }: SidebarProps) {
  const drawerRef = useRef<HTMLElement>(null)
  useFocusTrap(drawerRef, open)

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-surface lg:block">
        <SidebarContent {...props} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 animate-fade-in bg-overlay" onClick={onClose} aria-hidden="true" />
          <aside ref={drawerRef} tabIndex={-1} className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-slide-up bg-surface shadow-overlay outline-none">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="absolute top-3 -right-12 inline-flex size-10 items-center justify-center rounded-full bg-surface text-fg shadow-raised"
            >
              <X className="size-5" />
            </button>
            <SidebarContent {...props} onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  )
}
