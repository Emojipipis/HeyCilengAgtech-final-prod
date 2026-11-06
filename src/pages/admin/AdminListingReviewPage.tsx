import { Ban, CircleCheckBig, PackageSearch, RotateCcw, ShieldAlert, X } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Textarea } from '@/components/ui/Textarea'
import { getStatusMeta } from '@/config/statuses'
import { StockBar } from '@/features/listings/StockBar'
import { BackLink, ListingDetailView } from '@/features/marketplace/ListingDetailView'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/hooks/useToast'
import { services, type ServiceError } from '@/services'

type Action = 'approve' | 'reject' | 'suspend' | 'reinstate' | null

const BACK = { to: '/admin/listings', label: 'All listings' }

const COPY = {
  approve: { title: 'Approve this listing?', description: 'It goes live in the marketplace and becomes eligible for matching.', confirm: 'Approve listing', reason: false, tone: 'default' as const },
  reject: { title: 'Reject this listing?', description: 'The seller is told why and can edit and resubmit it.', confirm: 'Reject listing', reason: true, tone: 'danger' as const },
  suspend: { title: 'Suspend this listing?', description: 'It’s hidden from the marketplace and matching. Existing orders continue.', confirm: 'Suspend listing', reason: true, tone: 'danger' as const },
  reinstate: { title: 'Reinstate this listing?', description: 'It returns to the marketplace as active.', confirm: 'Reinstate listing', reason: false, tone: 'default' as const },
}

export function AdminListingReviewPage() {
  const { listingId = '' } = useParams()
  const { toast } = useToast()
  const item = useAsync(() => services.adminListings.get(listingId), listingId)
  const [action, setAction] = useState<Action>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<ServiceError | null>(null)

  if (item.loading && !item.data) return <LoadingState label="Loading listing…" />
  if (item.error || !item.data) {
    return (
      <div className="space-y-6">
        <BackLink {...BACK} />
        {item.error?.code === 'not_found' ? (
          <EmptyState icon={<PackageSearch />} title="Listing not found" action={<ButtonLink to="/admin/listings">Back to listings</ButtonLink>} />
        ) : (
          <ErrorState description={item.error?.message} onRetry={item.reload} />
        )}
      </div>
    )
  }

  const { listing } = item.data
  const status = listing.status

  const open = (a: Action) => {
    setReason('')
    setActionError(null)
    setAction(a)
  }

  const run = async () => {
    if (!action) return
    setBusy(true)
    const result =
      action === 'approve'
        ? await services.adminListings.approve(listing.id)
        : action === 'reject'
          ? await services.adminListings.reject(listing.id, reason)
          : action === 'suspend'
            ? await services.adminListings.suspend(listing.id, reason)
            : await services.adminListings.reinstate(listing.id)
    setBusy(false)
    if (!result.ok) {
      setActionError(result.error)
      return
    }
    item.setData((current) => ({ ...current!, listing: result.data }))
    toast({ tone: 'success', title: `Listing ${getStatusMeta('listing', result.data.status).label.toLowerCase()}`, description: 'The seller has been notified.' })
    setAction(null)
  }

  const actions = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Status:</span>
        <StatusBadge kind="listing" status={status} size="md" />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {status === 'pending_review' && (
          <>
            <Button className="flex-1" leftIcon={<CircleCheckBig className="size-4" />} onClick={() => open('approve')}>
              Approve
            </Button>
            <Button variant="outline" leftIcon={<X className="size-4" />} onClick={() => open('reject')}>
              Reject
            </Button>
          </>
        )}
        {(status === 'active' || status === 'paused' || status === 'sold_out') && (
          <Button variant="outline" leftIcon={<Ban className="size-4" />} onClick={() => open('suspend')}>
            Suspend listing
          </Button>
        )}
        {(status === 'suspended' || status === 'rejected') && (
          <Button variant="outline" leftIcon={<RotateCcw className="size-4" />} onClick={() => open('reinstate')}>
            Reinstate
          </Button>
        )}
      </div>
      {listing.reviewNote && <Alert tone="warning" title="Note shared with the seller">{listing.reviewNote}</Alert>}
    </div>
  )

  const copy = action ? COPY[action] : null

  return (
    <>
      <ListingDetailView
        item={item.data}
        back={BACK}
        actions={actions}
        aside={
          <Card>
            <CardHeader title="Review checklist" />
            <CardBody className="space-y-4 text-sm text-muted">
              <ul className="space-y-2">
                {[
                  'Material, quantity and unit are realistic and clearly described',
                  'Photos show the actual material and packaging',
                  'No phone numbers, emails or links in the description',
                  'Price and location look plausible',
                ].map((c) => (
                  <li key={c} className="flex gap-2">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-action" aria-hidden="true" />
                    {c}
                  </li>
                ))}
              </ul>
              <StockBar listing={listing} />
            </CardBody>
          </Card>
        }
      />

      <ConfirmDialog
        open={action !== null}
        onClose={() => setAction(null)}
        onConfirm={() => void run()}
        tone={copy?.tone}
        title={copy?.title ?? ''}
        description={copy?.description}
        confirmLabel={copy?.confirm}
        loading={busy}
      >
        {copy?.reason && <Textarea label="Reason (shared with the seller)" required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />}
        {actionError && <Alert tone="error" className="mt-3">{actionError.message}</Alert>}
      </ConfirmDialog>
    </>
  )
}
