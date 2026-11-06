import { Plus, Store } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { ButtonLink } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { Tabs } from '@/components/ui/Tabs'
import { STATUS_META } from '@/config/statuses'
import { SellerListingCard } from '@/features/listings/SellerListingCard'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/hooks/useToast'
import { services, type ServiceError } from '@/services'
import type { Listing } from '@/types/listing'
import type { ListingStatus } from '@/types/status'

type TabValue = 'all' | ListingStatus
const TABS: ListingStatus[] = ['active', 'pending_review', 'paused', 'sold_out', 'draft', 'rejected', 'suspended']

export function SellerListingsPage() {
  const { toast } = useToast()
  const { data, loading, error, reload, setData } = useAsync(() => services.sellerListings.listMine(), 'seller-listings')
  const [tab, setTab] = useState<TabValue>('all')
  const [deleting, setDeleting] = useState<Listing | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<ServiceError | null>(null)

  const listings = data ?? []
  const buyers = useAsync(() => services.matching.potentialBuyers(), listings.map((l) => `${l.id}:${l.status}:${l.updatedAt}`).join('|'))
  const buyerCounts = (buyers.data ?? []).reduce<Record<string, number>>((acc, b) => ({ ...acc, [b.listing.id]: (acc[b.listing.id] ?? 0) + 1 }), {})
  const visibleTabs = TABS.filter((status) => status === 'active' || listings.some((l) => l.status === status))
  const visible = tab === 'all' ? listings : listings.filter((l) => l.status === tab)

  const togglePause = async (listing: Listing) => {
    const pause = listing.status === 'active'
    const result = await services.sellerListings.setPaused(listing.id, pause)
    if (result.ok) {
      setData((list) => (list ?? []).map((l) => (l.id === listing.id ? result.data : l)))
      toast({ tone: 'success', title: pause ? 'Listing paused' : 'Listing resumed', description: pause ? 'It’s hidden from the marketplace until you resume it.' : undefined })
    } else {
      toast({ tone: 'error', title: 'Couldn’t update listing', description: result.error.message })
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    setDeleteError(null)
    const result = await services.sellerListings.remove(deleting.id)
    setDeleteBusy(false)
    if (result.ok) {
      setData((list) => (list ?? []).filter((l) => l.id !== deleting.id))
      toast({ tone: 'success', title: 'Listing deleted' })
      setDeleting(null)
    } else {
      setDeleteError(result.error)
    }
  }

  return (
    <>
      <PageHeader
        title="My listings"
        description="Manage the by-products you offer on HeyCileng."
        actions={
          <ButtonLink to="/seller/listings/new" leftIcon={<Plus className="size-4" />}>
            Create listing
          </ButtonLink>
        }
      />

      <Tabs
        label="Filter listings by status"
        value={tab}
        onChange={setTab}
        className="mb-6"
        items={[
          { value: 'all', label: 'All', count: listings.length },
          ...visibleTabs.map((status) => ({ value: status, label: STATUS_META.listing[status].label, count: listings.filter((l) => l.status === status).length })),
        ]}
      />

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error.message} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<Store />}
          title={listings.length === 0 ? 'No listings yet' : 'No listings with this status'}
          description="Create a listing to reach buyers who need your by-products."
          action={<ButtonLink to="/seller/listings/new">Create listing</ButtonLink>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((listing) => (
            <SellerListingCard
              key={listing.id}
              listing={listing}
              editPath={`/seller/listings/${listing.id}/edit`}
              onTogglePause={() => void togglePause(listing)}
              onDelete={() => {
                setDeleteError(null)
                setDeleting(listing)
              }}
              potentialBuyers={buyers.data ? (buyerCounts[listing.id] ?? 0) : undefined}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        tone="danger"
        title="Delete this listing?"
        description={deleting ? `“${deleting.name}” will be removed from the marketplace permanently.` : undefined}
        confirmLabel="Delete listing"
        loading={deleteBusy}
      >
        {deleteError && <Alert tone="error">{deleteError.message}</Alert>}
      </ConfirmDialog>
    </>
  )
}
