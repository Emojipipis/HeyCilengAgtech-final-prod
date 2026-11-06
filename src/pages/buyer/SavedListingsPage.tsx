import { Heart } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { ListingCard } from '@/features/marketplace/ListingCard'
import { useAsync } from '@/hooks/useAsync'
import { useSavedListings } from '@/hooks/useSavedListings'
import { services } from '@/services'

export function SavedListingsPage() {
  const { data, loading, error, reload, setData } = useAsync(() => services.marketplace.listSaved(), 'saved')
  const saved = useSavedListings()

  const remove = async (listingId: string) => {
    if (await saved.toggle(listingId)) setData((list) => (list ?? []).filter((item) => item.listing.id !== listingId))
  }

  return (
    <>
      <PageHeader title="Saved listings" description="Your shortlist of listings to revisit. Saving a listing doesn’t reserve stock." />
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error.message} onRetry={reload} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={<Heart />}
          title="No saved listings"
          description="Tap the heart on any listing to save it here."
          action={<ButtonLink to="/buyer/marketplace">Browse the marketplace</ButtonLink>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {(data ?? []).map((item) => (
            <ListingCard
              key={item.listing.id}
              item={item}
              to={`/buyer/marketplace/${item.listing.id}`}
              saved
              onToggleSave={() => void remove(item.listing.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}
