import { PackageSearch, SlidersHorizontal, Store } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/ui/SearchBar'
import { Select } from '@/components/ui/Select'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { usePagination } from '@/hooks/usePagination'
import { services } from '@/services'
import type { CategoryId } from '@/types/catalog'
import type { ListingFilters as ServiceFilters } from '@/types/listing'
import { activeFilterCount, EMPTY_FILTERS, toListingFilters, type FilterState } from './filterState'
import { ListingCard } from './ListingCard'
import { ListingFilters } from './ListingFilters'

type Sort = NonNullable<ServiceFilters['sort']>

const SORTS: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'quantity_desc', label: 'Most available' },
]

export interface MarketplaceBrowserProps {
  /** Detail page for a listing. */
  listingPath: (listingId: string) => string
  /** Save support — signed-in buyers only. */
  saved?: { isSaved: (id: string) => boolean; toggle: (id: string) => Promise<boolean> }
  initialQuery?: string
  initialCategories?: CategoryId[]
}

/**
 * Search, filters, sorting and paginated listing grid. Shared by the public marketplace and the buyer dashboard.
 * The search input owns the query; the URL's `?q=` follows after typing pauses (keeps fast typing lossless).
 */
export function MarketplaceBrowser({ listingPath, saved, initialQuery = '', initialCategories = [] }: MarketplaceBrowserProps) {
  const location = useLocation()
  const [, setParams] = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS, categories: initialCategories })
  const [sort, setSort] = useState<Sort>('newest')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const debouncedQuery = useDebounce(query, 250)
  const debouncedFilters = useDebounce(filters, 250)
  const serviceFilters = toListingFilters(debouncedFilters, debouncedQuery, sort)
  const listings = useAsync(() => services.marketplace.listListings(serviceFilters), JSON.stringify(serviceFilters))
  const pagination = usePagination(listings.data ?? [], 9, JSON.stringify(serviceFilters))
  const filterCount = activeFilterCount(filters)

  useEffect(() => {
    setParams(
      (current) => {
        if ((current.get('q') ?? '') === debouncedQuery) return current
        const next = new URLSearchParams(current)
        if (debouncedQuery) next.set('q', debouncedQuery)
        else next.delete('q')
        return next
      },
      { replace: true, state: location.state },
    )
  }, [debouncedQuery, setParams, location.state])

  const clearAll = () => {
    setFilters(EMPTY_FILTERS)
    setQuery('')
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[16rem_1fr] *:min-w-0">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-xl border border-border bg-surface p-5">
            <ListingFilters value={filters} onChange={setFilters} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBar value={query} onChange={setQuery} placeholder="Search by material, description or seller" className="flex-1" label="Search listings" />
            <div className="flex gap-3">
              <Button variant="outline" className="lg:hidden" onClick={() => setFiltersOpen(true)} leftIcon={<SlidersHorizontal className="size-4" />}>
                Filters{filterCount > 0 && ` (${filterCount})`}
              </Button>
              <Select
                aria-label="Sort listings"
                options={SORTS}
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                containerClassName="min-w-44 flex-1 sm:flex-none"
              />
            </div>
          </div>

          <p className="mt-4 text-sm text-muted" aria-live="polite">
            {listings.loading ? 'Searching…' : listings.error ? '' : `${pagination.total} listing${pagination.total === 1 ? '' : 's'} found`}
          </p>

          <div className="mt-4">
            {listings.loading && !listings.data ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-80 w-full rounded-xl" />
                ))}
              </div>
            ) : listings.error?.code === 'not_connected' ? (
              <EmptyState
                icon={<Store />}
                title="Listings aren’t available yet"
                description="The HeyCileng marketplace opens once the platform backend is connected. Check back soon."
              />
            ) : listings.error ? (
              <ErrorState description={listings.error.message} onRetry={listings.reload} />
            ) : pagination.total === 0 ? (
              <EmptyState
                icon={<PackageSearch />}
                title="No listings match your search"
                description="Try removing a filter or searching for a different material."
                action={
                  <Button variant="outline" onClick={clearAll}>
                    Clear search and filters
                  </Button>
                }
              />
            ) : (
              <div className={listings.loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {pagination.pageItems.map((item) => (
                    <ListingCard
                      key={item.listing.id}
                      item={item}
                      to={listingPath(item.listing.id)}
                      saved={saved?.isSaved(item.listing.id)}
                      onToggleSave={saved ? () => void saved.toggle(item.listing.id) : undefined}
                    />
                  ))}
                </div>
                {pagination.pageCount > 1 && (
                  <Pagination
                    className="mt-8"
                    page={pagination.page}
                    pageCount={pagination.pageCount}
                    onPageChange={(p) => {
                      pagination.setPage(p)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    rangeStart={pagination.rangeStart}
                    rangeEnd={pagination.rangeEnd}
                    total={pagination.total}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter listings"
        hideTitle
        footer={
          <Button onClick={() => setFiltersOpen(false)} fullWidth>
            Show {pagination.total} result{pagination.total === 1 ? '' : 's'}
          </Button>
        }
      >
        <div className="pt-6">
          <ListingFilters value={filters} onChange={setFilters} />
        </div>
      </Modal>
    </>
  )
}
