import { ArrowLeft, PackageSearch } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { ButtonLink } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { ListingForm } from '@/features/listings/ListingForm'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/hooks/useToast'
import { services } from '@/services'
import type { ListingInput } from '@/types/listing'
import type { SellerPublicProfile } from '@/types/user'

/** Create (`/seller/listings/new`) or edit (`/seller/listings/:listingId/edit`) a listing. */
export function ListingEditorPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const editing = Boolean(listingId)
  const listing = useAsync(
    () => (listingId ? services.sellerListings.get(listingId) : Promise.resolve({ ok: true as const, data: undefined })),
    listingId ?? 'new',
  )
  const profile = useAsync(() => services.profile.getSellerProfile(), 'seller-profile')

  const back = (
    <Link to="/seller/listings" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
      <ArrowLeft className="size-4" aria-hidden="true" />
      My listings
    </Link>
  )

  if (listing.loading || profile.loading) return <LoadingState label="Loading…" />
  if (listing.error?.code === 'not_found') {
    return (
      <div className="space-y-6">
        {back}
        <EmptyState icon={<PackageSearch />} title="Listing not found" action={<ButtonLink to="/seller/listings">Back to listings</ButtonLink>} />
      </div>
    )
  }
  if (listing.error || profile.error || !profile.data) {
    return <ErrorState description={(listing.error ?? profile.error)?.message} onRetry={() => (listing.error ? listing.reload() : profile.reload())} />
  }

  const seller: SellerPublicProfile = {
    id: profile.data.userId,
    businessName: profile.data.businessName,
    location: profile.data.location,
    description: profile.data.description,
    memberSince: '',
    verified: false,
  }

  const submit = async (input: ListingInput) => {
    const result = listingId ? await services.sellerListings.update(listingId, input) : await services.sellerListings.create(input)
    if (!result.ok) return result
    toast(
      editing
        ? { tone: 'success', title: 'Listing updated' }
        : { tone: 'success', title: 'Listing submitted for review', description: 'It will appear in the marketplace once HeyCileng approves it.' },
    )
    navigate('/seller/listings')
    return { ok: true as const }
  }

  return (
    <>
      <PageHeader
        eyebrow={back}
        title={editing ? 'Edit listing' : 'Create listing'}
        description={editing ? 'Changes apply to new order requests. Existing orders keep the price they were made at.' : 'Describe your by-product so buyers — and our matching — can find it.'}
        actions={listing.data ? <StatusBadge kind="listing" status={listing.data.status} size="md" /> : undefined}
      />
      <ListingForm key={listingId ?? 'new'} listing={listing.data} seller={seller} onSubmit={submit} onCancel={() => navigate('/seller/listings')} />
    </>
  )
}
