import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { RequireRole } from '@/components/guards/RequireRole'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { RootLayout } from '@/components/layout/RootLayout'
import { ADMIN_NAV, BUYER_NAV, SELLER_NAV } from '@/config/navigation'
import { AdminAnnouncementsPage } from '@/pages/admin/AdminAnnouncementsPage'
import { AdminAuditPage } from '@/pages/admin/AdminAuditPage'
import { AdminCommissionsPage } from '@/pages/admin/AdminCommissionsPage'
import { AdminDisputesPage } from '@/pages/admin/AdminDisputesPage'
import { AdminListingReviewPage } from '@/pages/admin/AdminListingReviewPage'
import { AdminListingsPage } from '@/pages/admin/AdminListingsPage'
import { AdminMatchmakingPage } from '@/pages/admin/AdminMatchmakingPage'
import { AdminOverviewPage } from '@/pages/admin/AdminOverviewPage'
import { AdminPaymentsPage } from '@/pages/admin/AdminPaymentsPage'
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'
import { AdminSupportPage } from '@/pages/admin/AdminSupportPage'
import { AdminTicketPage } from '@/pages/admin/AdminTicketPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminLogisticsPage } from '@/pages/admin/AdminLogisticsPage'
import { AdminOrderDetailsPage } from '@/pages/admin/AdminOrderDetailsPage'
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage'
import { BuyerMarketplacePage } from '@/pages/buyer/BuyerMarketplacePage'
import { BuyerOrderDetailsPage } from '@/pages/buyer/BuyerOrderDetailsPage'
import { BuyerOrdersPage } from '@/pages/buyer/BuyerOrdersPage'
import { BuyerPaymentsPage } from '@/pages/buyer/BuyerPaymentsPage'
import { BuyerOverviewPage } from '@/pages/buyer/BuyerOverviewPage'
import { BuyerProfilePage } from '@/pages/buyer/BuyerProfilePage'
import { ListingDetailsPage } from '@/pages/buyer/ListingDetailsPage'
import { MatchesPage } from '@/pages/buyer/MatchesPage'
import { RequirementsPage } from '@/pages/buyer/RequirementsPage'
import { SavedListingsPage } from '@/pages/buyer/SavedListingsPage'
import { DesignSystemPage } from '@/pages/dev/DesignSystemPage'
import { NotificationsPage } from '@/pages/shared/NotificationsPage'
import { SupportPage } from '@/pages/shared/SupportPage'
import { SupportTicketPage } from '@/pages/shared/SupportTicketPage'
import { InventoryPage } from '@/pages/seller/InventoryPage'
import { ListingEditorPage } from '@/pages/seller/ListingEditorPage'
import { PotentialBuyersPage } from '@/pages/seller/PotentialBuyersPage'
import { SellerListingsPage } from '@/pages/seller/SellerListingsPage'
import { SellerOrderDetailsPage } from '@/pages/seller/SellerOrderDetailsPage'
import { SellerOrdersPage } from '@/pages/seller/SellerOrdersPage'
import { SellerOverviewPage } from '@/pages/seller/SellerOverviewPage'
import { SellerProfilePage } from '@/pages/seller/SellerProfilePage'
import { HomePage } from '@/pages/public/HomePage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { PublicListingPage } from '@/pages/public/PublicListingPage'
import { PublicMarketplacePage } from '@/pages/public/PublicMarketplacePage'

/** Route tree. */
const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/marketplace', element: <PublicMarketplacePage /> },
          { path: '/marketplace/:listingId', element: <PublicListingPage /> },
          { path: '/design-system', element: <DesignSystemPage /> },
        ],
      },
      {
        path: '/buyer',
        element: (
          <RequireRole role="buyer">
            <DashboardLayout
              nav={BUYER_NAV}
              areaLabel="Buyer"
              homePath="/buyer"
              profilePath="/buyer/profile"
              searchPath="/buyer/marketplace"
              searchPlaceholder="Search the marketplace"
            />
          </RequireRole>
        ),
        children: [
          { index: true, element: <BuyerOverviewPage /> },
          { path: 'marketplace', element: <BuyerMarketplacePage /> },
          { path: 'marketplace/:listingId', element: <ListingDetailsPage /> },
          { path: 'saved', element: <SavedListingsPage /> },
          { path: 'requirements', element: <RequirementsPage /> },
          { path: 'matches', element: <MatchesPage /> },
          { path: 'orders', element: <BuyerOrdersPage /> },
          { path: 'orders/:orderId', element: <BuyerOrderDetailsPage /> },
          { path: 'payments', element: <BuyerPaymentsPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'support', element: <SupportPage /> },
          { path: 'support/:ticketId', element: <SupportTicketPage /> },
          { path: 'profile', element: <BuyerProfilePage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        path: '/seller',
        element: (
          <RequireRole role="seller">
            <DashboardLayout nav={SELLER_NAV} areaLabel="Seller" homePath="/seller" profilePath="/seller/profile" />
          </RequireRole>
        ),
        children: [
          { index: true, element: <SellerOverviewPage /> },
          { path: 'listings', element: <SellerListingsPage /> },
          { path: 'listings/new', element: <ListingEditorPage /> },
          { path: 'listings/:listingId/edit', element: <ListingEditorPage /> },
          { path: 'inventory', element: <InventoryPage /> },
          { path: 'orders', element: <SellerOrdersPage /> },
          { path: 'orders/:orderId', element: <SellerOrderDetailsPage /> },
          { path: 'potential-buyers', element: <PotentialBuyersPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'support', element: <SupportPage /> },
          { path: 'support/:ticketId', element: <SupportTicketPage /> },
          { path: 'profile', element: <SellerProfilePage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        path: '/admin',
        element: (
          <RequireRole role="admin">
            <DashboardLayout nav={ADMIN_NAV} areaLabel="Admin" homePath="/admin" />
          </RequireRole>
        ),
        children: [
          { index: true, element: <AdminOverviewPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'users/sellers', element: <AdminUsersPage key="sellers" role="seller" /> },
          { path: 'users/buyers', element: <AdminUsersPage key="buyers" role="buyer" /> },
          { path: 'listings', element: <AdminListingsPage /> },
          { path: 'listings/:listingId', element: <AdminListingReviewPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'orders/:orderId', element: <AdminOrderDetailsPage /> },
          { path: 'logistics', element: <AdminLogisticsPage /> },
          { path: 'matchmaking', element: <AdminMatchmakingPage /> },
          { path: 'payments', element: <AdminPaymentsPage /> },
          { path: 'commissions', element: <AdminCommissionsPage /> },
          { path: 'disputes', element: <AdminDisputesPage /> },
          { path: 'support', element: <AdminSupportPage /> },
          { path: 'support/:ticketId', element: <AdminTicketPage /> },
          { path: 'announcements', element: <AdminAnnouncementsPage /> },
          { path: 'reports', element: <AdminReportsPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
          { path: 'audit', element: <AdminAuditPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
