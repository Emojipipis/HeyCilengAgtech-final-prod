import { FlaskConical, PackageSearch } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { Container } from '@/components/shared/Section'
import { env } from '@/config/env'
import { BackLink, ListingDetailView } from '@/features/marketplace/ListingDetailView'
import { useAsync } from '@/hooks/useAsync'
import { useAuthModal } from '@/hooks/useAuthModal'
import { availableQuantity } from '@/lib/inventory'
import { services } from '@/services'

const BACK = { to: '/marketplace', label: 'Back to marketplace' }

export function PublicListingPage() {
  const { listingId = '' } = useParams()
  const { openAuth } = useAuthModal()
  const { data, loading, error, reload } = useAsync(() => services.marketplace.getListing(listingId), listingId)

  return (
    <Container className="py-10 sm:py-14">
      {loading ? (
        <LoadingState label="Loading listing…" />
      ) : error || !data ? (
        <div className="space-y-6">
          <BackLink {...BACK} />
          {error?.code === 'not_found' || error?.code === 'not_connected' ? (
            <EmptyState
              icon={<PackageSearch />}
              title="Listing not available"
              description={error.code === 'not_connected' ? 'The marketplace opens once the platform backend is connected.' : 'It may have been removed, sold out or paused by the seller.'}
              action={<ButtonLink to="/marketplace">Browse the marketplace</ButtonLink>}
            />
          ) : (
            <ErrorState description={error?.message} onRetry={reload} />
          )}
        </div>
      ) : (
        <ListingDetailView
          item={data}
          back={BACK}
          actions={
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button size="lg" className="flex-1" disabled={availableQuantity(data.listing) === 0} onClick={() => openAuth('login')}>
                  Log in to request an order
                </Button>
                <Button size="lg" variant="outline" onClick={() => openAuth('signup')}>
                  Create buyer account
                </Button>
              </div>
              <p className="text-xs text-subtle">Orders, saved listings and matching are available to signed-in buyers.</p>
              {env.demoMode && (
                <Link
                  to={`/buyer/marketplace/${data.listing.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-ochre-700 hover:underline dark:text-ochre-300"
                >
                  <FlaskConical className="size-3.5" aria-hidden="true" />
                  Open in the demo buyer dashboard
                </Link>
              )}
            </div>
          }
        />
      )}
    </Container>
  )
}
