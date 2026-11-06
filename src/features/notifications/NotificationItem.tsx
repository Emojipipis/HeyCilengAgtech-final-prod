import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { AppNotification } from '@/types/notification'
import { NOTIFICATION_META } from './notificationMeta'

export function NotificationItem({
  notification,
  onOpen,
  compact = false,
}: {
  notification: AppNotification
  onOpen?: (notification: AppNotification) => void
  compact?: boolean
}) {
  const meta = NOTIFICATION_META[notification.category]
  const Icon = meta.icon
  const clickable = Boolean(onOpen)

  const content = (
    <>
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', meta.className)}>
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className={cn('text-sm', notification.read ? 'font-medium text-fg' : 'font-semibold text-fg')}>{notification.title}</span>
          {!notification.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-action" aria-label="Unread" />}
        </span>
        <span className={cn('mt-0.5 block text-sm text-muted', compact && 'line-clamp-2')}>{notification.body}</span>
        <span className="mt-1 block text-xs text-subtle">
          {meta.label} · {formatRelative(notification.createdAt)}
        </span>
      </span>
    </>
  )

  const className = cn('flex w-full gap-3 rounded-lg p-3 text-left transition-colors', !notification.read && 'bg-leaf-50/60 dark:bg-leaf-500/5')

  return clickable ? (
    <button type="button" onClick={() => onOpen?.(notification)} className={cn(className, 'hover:bg-surface-sunken')}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  )
}
