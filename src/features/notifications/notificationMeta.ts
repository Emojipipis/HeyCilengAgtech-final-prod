import { Megaphone, Package, Sparkles, Store, Truck, UserRound, type LucideIcon } from 'lucide-react'
import type { NotificationCategory } from '@/types/notification'

export const NOTIFICATION_META: Record<NotificationCategory, { label: string; icon: LucideIcon; className: string }> = {
  order: { label: 'Order update', icon: Package, className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
  listing: { label: 'Listing update', icon: Store, className: 'bg-ochre-100 text-ochre-700 dark:bg-ochre-400/15 dark:text-ochre-300' },
  match: { label: 'Match', icon: Sparkles, className: 'bg-leaf-100 text-leaf-700 dark:bg-leaf-500/15 dark:text-leaf-300' },
  delivery: { label: 'Delivery update', icon: Truck, className: 'bg-forest-100 text-forest-700 dark:bg-forest-400/15 dark:text-forest-200' },
  account: { label: 'Account', icon: UserRound, className: 'bg-surface-sunken text-muted' },
  announcement: { label: 'Announcement', icon: Megaphone, className: 'bg-ochre-100 text-ochre-800 dark:bg-ochre-400/15 dark:text-ochre-200' },
}
