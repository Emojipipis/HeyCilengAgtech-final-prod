import { ClipboardList, Plus } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { Tabs } from '@/components/ui/Tabs'
import { RequirementCard } from '@/features/requirements/RequirementCard'
import { RequirementFormModal } from '@/features/requirements/RequirementForm'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/hooks/useToast'
import { effectiveRequirementStatus } from '@/lib/requirements'
import { services } from '@/services'
import type { Requirement, RequirementInput } from '@/types/requirement'
import type { RequirementStatus } from '@/types/status'

type TabValue = 'all' | RequirementStatus

const STATUS_TOAST: Record<Exclude<RequirementStatus, 'expired'>, string> = {
  active: 'Matching resumed',
  paused: 'Matching paused',
  fulfilled: 'Marked as fulfilled',
}

export function RequirementsPage() {
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const { data, loading, error, reload, setData } = useAsync(() => services.requirements.list(), 'requirements')
  const [tab, setTab] = useState<TabValue>('all')
  const [editing, setEditing] = useState<Requirement | undefined>()
  const [formOpen, setFormOpen] = useState(params.get('new') === '1')
  const [deleting, setDeleting] = useState<Requirement | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)

  const requirements = data ?? []
  // Recount matches whenever requirements change (create, edit, pause…).
  const matchCounts = useAsync(
    () => services.matching.requirementMatchCounts(),
    requirements.map((r) => `${r.id}:${r.status}:${r.category}:${r.quantity}:${r.budgetMax}`).join('|'),
  )
  const counts = requirements.reduce<Record<RequirementStatus, number>>(
    (acc, r) => ({ ...acc, [effectiveRequirementStatus(r)]: acc[effectiveRequirementStatus(r)] + 1 }),
    { active: 0, paused: 0, expired: 0, fulfilled: 0 },
  )
  const visible = tab === 'all' ? requirements : requirements.filter((r) => effectiveRequirementStatus(r) === tab)

  const closeForm = () => {
    setFormOpen(false)
    setEditing(undefined)
    if (params.has('new')) setParams({}, { replace: true })
  }

  const submit = async (input: RequirementInput) => {
    const result = editing ? await services.requirements.update(editing.id, input) : await services.requirements.create(input)
    if (!result.ok) return result
    setData((list) => (editing ? (list ?? []).map((r) => (r.id === result.data.id ? result.data : r)) : [result.data, ...(list ?? [])]))
    toast({
      tone: 'success',
      title: editing ? 'Requirement updated' : 'Requirement published',
      description: editing ? undefined : 'We’ll recommend matching listings. Nothing is ordered automatically.',
    })
    return { ok: true as const }
  }

  const setStatus = async (requirement: Requirement, status: Exclude<RequirementStatus, 'expired'>) => {
    const result = await services.requirements.setStatus(requirement.id, status)
    if (result.ok) {
      setData((list) => (list ?? []).map((r) => (r.id === requirement.id ? result.data : r)))
      toast({ tone: 'success', title: STATUS_TOAST[status] })
    } else {
      toast({ tone: 'error', title: 'Couldn’t update requirement', description: result.error.message })
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeletingBusy(true)
    const result = await services.requirements.remove(deleting.id)
    setDeletingBusy(false)
    if (result.ok) {
      setData((list) => (list ?? []).filter((r) => r.id !== deleting.id))
      toast({ tone: 'success', title: 'Requirement deleted' })
      setDeleting(null)
    } else {
      toast({ tone: 'error', title: 'Couldn’t delete requirement', description: result.error.message })
    }
  }

  return (
    <>
      <PageHeader
        title="Requirements"
        description="Tell HeyCileng what materials you need. Active requirements are used to recommend matching listings."
        actions={
          <Button leftIcon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
            New requirement
          </Button>
        }
      />

      <Tabs
        label="Filter requirements by status"
        value={tab}
        onChange={setTab}
        className="mb-6"
        items={[
          { value: 'all', label: 'All', count: requirements.length },
          { value: 'active', label: 'Active', count: counts.active },
          { value: 'paused', label: 'Paused', count: counts.paused },
          { value: 'expired', label: 'Expired', count: counts.expired },
          { value: 'fulfilled', label: 'Fulfilled', count: counts.fulfilled },
        ]}
      />

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error.message} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title={tab === 'all' ? 'No requirements yet' : `No ${tab} requirements`}
          description="Publish a requirement to get recommended listings that match your material, quantity, budget and location."
          action={
            <Button leftIcon={<Plus className="size-4" />} onClick={() => setFormOpen(true)}>
              New requirement
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((r) => (
            <RequirementCard
              key={r.id}
              requirement={r}
              matchesPath="/buyer/matches"
              onEdit={() => {
                setEditing(r)
                setFormOpen(true)
              }}
              onSetStatus={(status) => void setStatus(r, status)}
              onDelete={() => setDeleting(r)}
              matchCount={matchCounts.data?.[r.id]}
            />
          ))}
        </div>
      )}

      <RequirementFormModal open={formOpen} onClose={closeForm} requirement={editing} onSubmit={submit} />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        tone="danger"
        title="Delete this requirement?"
        description={deleting ? `“${deleting.title}” will be removed and no longer used for matching. This can’t be undone.` : undefined}
        confirmLabel="Delete requirement"
        loading={deletingBusy}
      />
    </>
  )
}
