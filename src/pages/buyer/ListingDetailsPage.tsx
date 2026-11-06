import { PackageSearch } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { BackLink, ListingDetailView } from '@/features/marketplace/ListingDetailView'
import { SaveListingButton } from '@/features/marketplace/SaveListingButton'
import { ListingMatchesPanel } from '@/features/matching/ListingMatchesPanel'
import { RequestOrderModal } from '@/features/orders/RequestOrderModal'
import { useAsync } from '@/hooks/useAsync'
import { useSavedListings } from '@/hooks/useSavedListings'
import { availableQuantity } from '@/lib/inventory'
import { services } from '@/services'

const BACK = { to: '/buyer/marketplace', label: 'Back to marketplace' }

export function ListingDetailsPage() {
  const { listingId = '' } = useParams()
  const { data, loading, error, reload } = useAsync(() => services.marketplace.getListing(listingId), listingId)
  const saved = useSavedListings()
  // null = closed; otherwise the quantity to prefill (undefined = listing minimum).
  const [request, setRequest] = useState<{ quantity?: number } | null>(null)

  if (loading) return <LoadingState label="Loading listing…" />
  if (error || !data) {
    return (
      <div className="space-y-6">
        <BackLink {...BACK} />
        {error?.code === 'not_found' ? (
          <EmptyState
            icon={<PackageSearch />}
            title="Listing not available"
            description="It may have been removed, sold out or paused by the seller."
            action={<ButtonLink to="/buyer/marketplace">Browse the marketplace</ButtonLink>}
          />
        ) : (
          <ErrorState description={error?.message} onRetry={reload} />
        )}
      </div>
    )
  }

  const soldOut = availableQuantity(data.listing) === 0

  return (
    <>
      <ListingDetailView
        item={data}
        back={BACK}
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="lg" className="flex-1" disabled={soldOut} onClick={() => setRequest({})}>
              {soldOut ? 'Currently sold out' : 'Request order'}
            </Button>
            <SaveListingButton
              variant="outline"
              saved={saved.isSaved(data.listing.id)}
              onToggle={() => void saved.toggle(data.listing.id)}
              label={data.listing.name}
              className="h-12"
            />
          </div>
        }
        aside={
          <ListingMatchesPanel
            listing={data.listing}
            matchesPath="/buyer/matches"
            onRequestForRequirement={soldOut ? undefined : (quantity) => setRequest({ quantity })}
          />
        }
      />
      <RequestOrderModal item={request ? data : null} onClose={() => setRequest(null)} ordersPath="/buyer/orders" defaultQuantity={request?.quantity} />
    </>
  )
}
