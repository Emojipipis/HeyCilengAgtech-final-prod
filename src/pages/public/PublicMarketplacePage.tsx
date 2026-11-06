import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { Container } from '@/components/shared/Section'
import { env } from '@/config/env'
import { MarketplaceBrowser } from '@/features/marketplace/MarketplaceBrowser'
import { useMarketplaceParams } from '@/features/marketplace/marketplaceParams'
import { useAuthModal } from '@/hooks/useAuthModal'

/** Public marketplace: anyone can browse; requesting orders and matching need a buyer account. */
export function PublicMarketplacePage() {
  const { key, initialQuery, initialCategories } = useMarketplaceParams()
  const { openAuth } = useAuthModal()

  return (
    <Container className="py-10 sm:py-14">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {env.demoMode && <DemoBadge label="Illustrative demo listings — not real sellers, stock or prices" className="mb-3" />}
          <h1 className="text-3xl font-bold sm:text-4xl">Marketplace</h1>
          <p className="mt-2 max-w-2xl text-muted">Browse agricultural by-products from farms, cooperatives and agro-processors across Nigeria.</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 lg:max-w-md">
          <Sparkles className="size-5 shrink-0 text-action" aria-hidden="true" />
          <p className="text-sm text-muted">
            <span className="font-semibold text-fg">Get matched to listings.</span> Create a free buyer account to post requirements and request orders.
          </p>
          <Button size="sm" onClick={() => openAuth('signup')} className="shrink-0">
            Sign up
          </Button>
        </div>
      </div>

      <MarketplaceBrowser key={key} listingPath={(id) => `/marketplace/${id}`} initialQuery={initialQuery} initialCategories={initialCategories} />
    </Container>
  )
}
