import { PageHeader } from '@/components/layout/PageHeader'
import { MarketplaceBrowser } from '@/features/marketplace/MarketplaceBrowser'
import { useMarketplaceParams } from '@/features/marketplace/marketplaceParams'
import { useSavedListings } from '@/hooks/useSavedListings'

export function BuyerMarketplacePage() {
  const { key, initialQuery, initialCategories } = useMarketplaceParams()
  const saved = useSavedListings()

  return (
    <>
      <PageHeader title="Marketplace" description="Browse agricultural by-products from sellers across HeyCileng." />
      <MarketplaceBrowser
        key={key}
        listingPath={(id) => `/buyer/marketplace/${id}`}
        saved={saved}
        initialQuery={initialQuery}
        initialCategories={initialCategories}
      />
    </>
  )
}
