export type NotificationCategory = 'order' | 'listing' | 'match' | 'delivery' | 'account' | 'announcement'

export interface AppNotification {
  id: string
  category: NotificationCategory
  title: string
  body: string
  createdAt: string
  read: boolean
  /** In-app route to open, if any. */
  href?: string
  isDemo?: boolean
}
