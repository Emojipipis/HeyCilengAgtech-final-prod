import {
  Bell,
  Boxes,
  Building,
  ChartColumn,
  ClipboardList,
  Coins,
  CreditCard,
  Heart,
  History,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Package,
  Scale,
  Settings,
  ShoppingBasket,
  Sparkles,
  Store,
  Truck,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'

/** Public site navigation: `section` scrolls to an element id on the home page; `to` is a page route. */
export type PublicNavItem = { label: string; section: string; to?: never } | { label: string; to: string; section?: never }

export const PUBLIC_NAV: PublicNavItem[] = [
  { label: 'Home', section: 'top' },
  { label: 'About', section: 'about' },
  { label: 'How It Works', section: 'how-it-works' },
  { label: 'Marketplace', to: '/marketplace' },
  { label: 'Contact', section: 'contact' },
]

export interface DashboardNavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Match the path exactly (for index routes). */
  end?: boolean
}

export interface DashboardNavGroup {
  label?: string
  items: DashboardNavItem[]
}

export const BUYER_NAV: DashboardNavGroup[] = [
  { items: [{ label: 'Overview', to: '/buyer', icon: LayoutDashboard, end: true }] },
  {
    label: 'Marketplace',
    items: [
      { label: 'Browse listings', to: '/buyer/marketplace', icon: Store },
      { label: 'Saved listings', to: '/buyer/saved', icon: Heart },
    ],
  },
  {
    label: 'Sourcing',
    items: [
      { label: 'Requirements', to: '/buyer/requirements', icon: ClipboardList },
      { label: 'Matches', to: '/buyer/matches', icon: Sparkles },
    ],
  },
  {
    label: 'Orders',
    items: [
      { label: 'My orders', to: '/buyer/orders', icon: Package },
      { label: 'Payments', to: '/buyer/payments', icon: CreditCard },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Notifications', to: '/buyer/notifications', icon: Bell },
      { label: 'Support', to: '/buyer/support', icon: LifeBuoy },
      { label: 'Profile', to: '/buyer/profile', icon: UserRound },
    ],
  },
]

export const SELLER_NAV: DashboardNavGroup[] = [
  { items: [{ label: 'Overview', to: '/seller', icon: LayoutDashboard, end: true }] },
  {
    label: 'Listings',
    items: [
      { label: 'My listings', to: '/seller/listings', icon: Store },
      { label: 'Inventory', to: '/seller/inventory', icon: Boxes },
    ],
  },
  { label: 'Orders', items: [{ label: 'Incoming orders', to: '/seller/orders', icon: Inbox }] },
  { label: 'Demand', items: [{ label: 'Potential buyers', to: '/seller/potential-buyers', icon: Users }] },
  {
    label: 'Account',
    items: [
      { label: 'Notifications', to: '/seller/notifications', icon: Bell },
      { label: 'Support', to: '/seller/support', icon: LifeBuoy },
      { label: 'Business profile', to: '/seller/profile', icon: Building },
    ],
  },
]

/** Admin navigation — the sixteen administrator areas. */
export const ADMIN_NAV: DashboardNavGroup[] = [
  { items: [{ label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true }] },
  {
    label: 'People',
    items: [
      { label: 'Users', to: '/admin/users', icon: Users, end: true },
      { label: 'Sellers', to: '/admin/users/sellers', icon: Store },
      { label: 'Buyers', to: '/admin/users/buyers', icon: ShoppingBasket },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { label: 'Listings', to: '/admin/listings', icon: Boxes },
      { label: 'Orders', to: '/admin/orders', icon: Package },
      { label: 'Logistics', to: '/admin/logistics', icon: Truck },
      { label: 'Matchmaking', to: '/admin/matchmaking', icon: Sparkles },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Payments', to: '/admin/payments', icon: CreditCard },
      { label: 'Commissions', to: '/admin/commissions', icon: Coins },
    ],
  },
  {
    label: 'Support',
    items: [
      { label: 'Disputes', to: '/admin/disputes', icon: Scale },
      { label: 'Support tickets', to: '/admin/support', icon: LifeBuoy },
      { label: 'Announcements', to: '/admin/announcements', icon: Megaphone },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Reports', to: '/admin/reports', icon: ChartColumn },
      { label: 'Platform settings', to: '/admin/settings', icon: Settings },
      { label: 'Audit logs', to: '/admin/audit', icon: History },
    ],
  },
]
