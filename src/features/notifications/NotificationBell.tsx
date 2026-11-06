import { Bell, CheckCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { EmptyState, LoadingState } from '@/components/ui/States'
import { useAsync } from '@/hooks/useAsync'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useViewer } from '@/hooks/useSession'
import { cn } from '@/lib/cn'
import { services } from '@/services'
import type { AppNotification } from '@/types/notification'
import { NotificationItem } from './NotificationItem'
import { announceNotificationsChanged, useNotificationsChanged } from './notificationEvents'

export function NotificationBell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const { user } = useViewer()
  // Refresh when the account changes or on navigation, so new platform notifications show up.
  const { data, loading, error, setData, reload } = useAsync(() => services.notifications.list(), `${user.id}|${location.key}|${location.pathname}`)

  useNotificationsChanged(reload)
  // Live updates where the backend supports them (tells the bell and the notifications page).
  useEffect(() => services.notifications.subscribe?.(announceNotificationsChanged), [user.id])
  useClickOutside([buttonRef, panelRef], () => setOpen(false), open)
  useEscapeKey(() => {
    setOpen(false)
    buttonRef.current?.focus()
  }, open)

  const notifications = data ?? []
  const unread = notifications.filter((n) => !n.read).length

  const openNotification = (notification: AppNotification) => {
    void services.notifications.markRead(notification.id)
    setData((list) => (list ?? []).map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
    setOpen(false)
    if (notification.href) navigate(notification.href)
  }

  const markAll = () => {
    void services.notifications.markAllRead()
    setData((list) => (list ?? []).map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative inline-flex size-10 items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors hover:bg-surface-sunken hover:text-fg"
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ochre-400 px-1 text-[11px] font-bold text-forest-950 tabular-nums">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-3 top-16 z-40 animate-scale-in rounded-xl border border-border bg-surface shadow-raised sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-semibold">Notifications</p>
            <button
              type="button"
              onClick={markAll}
              disabled={unread === 0}
              className={cn('inline-flex items-center gap-1.5 text-sm font-medium text-action hover:underline disabled:pointer-events-none disabled:opacity-40')}
            >
              <CheckCheck className="size-4" aria-hidden="true" />
              Mark all read
            </button>
          </div>
          <div className="max-h-[min(28rem,70dvh)] overflow-y-auto p-2">
            {loading && !data ? (
              <LoadingState label="Loading notifications…" className="py-8" />
            ) : error ? (
              <p className="p-4 text-sm text-muted">{error.message}</p>
            ) : notifications.length === 0 ? (
              <EmptyState compact icon={<Bell />} title="You’re all caught up" description="Order, delivery and match updates will appear here." />
            ) : (
              notifications.slice(0, 8).map((n) => <NotificationItem key={n.id} notification={n} onOpen={openNotification} compact />)
            )}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
            <p className="text-xs text-subtle">Updates come from HeyCileng — never directly from other users.</p>
            {user.role !== 'admin' && (
              <Link to={`/${user.role}/notifications`} onClick={() => setOpen(false)} className="shrink-0 text-xs font-semibold text-action hover:underline">
                View all
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
