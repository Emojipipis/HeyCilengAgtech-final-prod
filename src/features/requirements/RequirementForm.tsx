import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FilterChips } from '@/components/ui/FilterChips'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { APPLICATIONS, CATEGORIES, QUALITY_TAGS, UNITS } from '@/config/catalog'
import { STATES } from '@/config/locations'
import { PLATFORM } from '@/config/platform'
import { todayISODate } from '@/lib/format'
import { hasErrors, type Errors } from '@/lib/validation'
import type { ServiceError } from '@/services'
import type { ApplicationId, CategoryId, QualityTag, Unit } from '@/types/catalog'
import type { Requirement, RequirementInput } from '@/types/requirement'

interface FormValues {
  title: string
  category: CategoryId | ''
  quantity: string
  unit: Unit
  budgetMin: string
  budgetMax: string
  preferredLocation: string
  maxDeliveryDistanceKm: string
  intendedApplication: ApplicationId | ''
  qualityRequirements: QualityTag[]
  qualitySpecifications: string
  additionalSpecifications: string
  expiresAt: string
}

const DISTANCES = ['50', '100', '150', '250', '400', '600', '1000']

function inDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function fromRequirement(r?: Requirement): FormValues {
  return {
    title: r?.title ?? '',
    category: r?.category ?? '',
    quantity: r ? String(r.quantity) : '',
    unit: r?.unit ?? 'tonne',
    budgetMin: r?.budgetMin !== undefined ? String(r.budgetMin) : '',
    budgetMax: r ? String(r.budgetMax) : '',
    preferredLocation: r?.preferredLocation ?? '',
    maxDeliveryDistanceKm: r ? String(r.maxDeliveryDistanceKm) : '250',
    intendedApplication: r?.intendedApplication ?? '',
    qualityRequirements: r?.qualityRequirements ?? [],
    qualitySpecifications: r?.qualitySpecifications ?? '',
    additionalSpecifications: r?.additionalSpecifications ?? '',
    expiresAt: r?.expiresAt ?? inDays(30),
  }
}

function validate(v: FormValues): Errors<FormValues> {
  const qty = Number(v.quantity)
  const max = Number(v.budgetMax)
  const min = v.budgetMin ? Number(v.budgetMin) : undefined
  return {
    title: v.title.trim().length >= 4 ? undefined : 'Give the requirement a short title.',
    category: v.category ? undefined : 'Choose a material category.',
    quantity: qty > 0 ? undefined : 'Enter the quantity you need.',
    budgetMax: !(max > 0) ? 'Enter your maximum price per unit.' : min !== undefined && min > max ? 'Maximum must be at least the minimum.' : undefined,
    budgetMin: min !== undefined && !(min >= 0) ? 'Enter a valid amount.' : undefined,
    preferredLocation: v.preferredLocation ? undefined : 'Choose where you need the material.',
    intendedApplication: v.intendedApplication ? undefined : 'Choose how you’ll use the material.',
    expiresAt: !v.expiresAt ? 'Choose an expiry date.' : v.expiresAt <= todayISODate() ? 'The expiry date must be in the future.' : undefined,
  }
}

function toInput(v: FormValues): RequirementInput {
  return {
    title: v.title.trim(),
    category: v.category as CategoryId,
    quantity: Number(v.quantity),
    unit: v.unit,
    budgetMin: v.budgetMin ? Number(v.budgetMin) : undefined,
    budgetMax: Number(v.budgetMax),
    preferredLocation: v.preferredLocation,
    maxDeliveryDistanceKm: Number(v.maxDeliveryDistanceKm),
    intendedApplication: v.intendedApplication as ApplicationId,
    qualityRequirements: v.qualityRequirements,
    qualitySpecifications: v.qualitySpecifications.trim(),
    additionalSpecifications: v.additionalSpecifications.trim(),
    expiresAt: v.expiresAt,
  }
}

interface RequirementFormModalProps {
  open: boolean
  onClose: () => void
  /** Present when editing. */
  requirement?: Requirement
  onSubmit: (input: RequirementInput) => Promise<{ ok: true } | { ok: false; error: ServiceError }>
}

export function RequirementFormModal({ open, onClose, requirement, onSubmit }: RequirementFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={requirement ? 'Edit requirement' : 'New requirement'}
      description="Describe what you need. HeyCileng recommends matching listings — nothing is ordered automatically."
    >
      {open && <RequirementForm key={requirement?.id ?? 'new'} requirement={requirement} onClose={onClose} onSubmit={onSubmit} />}
    </Modal>
  )
}

function RequirementForm({ requirement, onClose, onSubmit }: Omit<RequirementFormModalProps, 'open'>) {
  const [values, setValues] = useState<FormValues>(() => fromRequirement(requirement))
  const [errors, setErrors] = useState<Errors<FormValues>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)
  const unitLabel = UNITS[values.unit].label.split(' ')[0].toLowerCase()

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }
  const numeric = (raw: string) => raw.replace(/[^\d.]/g, '')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next = validate(values)
    setErrors(next)
    if (hasErrors(next)) return
    setSubmitting(true)
    setError(null)
    const result = await onSubmit(toInput(values))
    setSubmitting(false)
    if (result.ok) onClose()
    else setError(result.error)
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Title"
          required
          containerClassName="sm:col-span-2"
          placeholder="e.g. Dried cassava peels for poultry feed"
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          error={errors.title}
        />
        <Select
          label="Material category"
          required
          placeholder="Select a category"
          options={CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
          value={values.category}
          onChange={(e) => set('category', e.target.value as CategoryId)}
          error={errors.category}
          hint="Listings in other categories are never recommended."
        />
        <Select
          label="Intended application"
          required
          placeholder="Select an application"
          options={Object.entries(APPLICATIONS).map(([value, label]) => ({ value, label }))}
          value={values.intendedApplication}
          onChange={(e) => set('intendedApplication', e.target.value as ApplicationId)}
          error={errors.intendedApplication}
        />
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Input
            label="Required quantity"
            required
            inputMode="decimal"
            value={values.quantity}
            onChange={(e) => set('quantity', numeric(e.target.value))}
            error={errors.quantity}
          />
          <Select
            label="Unit"
            options={Object.entries(UNITS).map(([value, u]) => ({ value, label: u.label }))}
            value={values.unit}
            onChange={(e) => set('unit', e.target.value as Unit)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Min price / ${unitLabel}`}
            inputMode="numeric"
            placeholder="Optional"
            value={values.budgetMin}
            onChange={(e) => set('budgetMin', numeric(e.target.value))}
            error={errors.budgetMin}
          />
          <Input
            label={`Max price / ${unitLabel}`}
            required
            inputMode="numeric"
            value={values.budgetMax}
            onChange={(e) => set('budgetMax', numeric(e.target.value))}
            error={errors.budgetMax}
            hint={PLATFORM.currency}
          />
        </div>
        <Select
          label="Preferred location"
          required
          placeholder="Select a state"
          options={STATES.map((s) => ({ value: s.id, label: s.name }))}
          value={values.preferredLocation}
          onChange={(e) => set('preferredLocation', e.target.value)}
          error={errors.preferredLocation}
        />
        <Select
          label="Maximum delivery distance"
          options={DISTANCES.map((d) => ({ value: d, label: `${d} km` }))}
          value={values.maxDeliveryDistanceKm}
          onChange={(e) => set('maxDeliveryDistanceKm', e.target.value)}
          hint="Estimated straight-line distance."
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Quality requirements</legend>
        <FilterChips
          label="Quality requirements"
          multiple
          options={Object.entries(QUALITY_TAGS).map(([value, label]) => ({ value: value as QualityTag, label }))}
          value={values.qualityRequirements}
          onChange={(next) => set('qualityRequirements', next)}
        />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Textarea
          label="Quality specifications"
          rows={3}
          placeholder="e.g. Moisture ≤ 12%, minimal sand"
          value={values.qualitySpecifications}
          onChange={(e) => set('qualitySpecifications', e.target.value)}
        />
        <Textarea
          label="Additional specifications"
          rows={3}
          placeholder="Packaging, delivery frequency, trial batch…"
          value={values.additionalSpecifications}
          onChange={(e) => set('additionalSpecifications', e.target.value)}
        />
        <Input
          label="Requirement expires on"
          type="date"
          required
          min={inDays(1)}
          value={values.expiresAt}
          onChange={(e) => set('expiresAt', e.target.value)}
          error={errors.expiresAt}
          hint="After this date it’s no longer used for matching."
        />
      </div>

      {error && <Alert tone={error.code === 'not_connected' ? 'warning' : 'error'}>{error.message}</Alert>}

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {requirement ? 'Save changes' : 'Publish requirement'}
        </Button>
      </div>
    </form>
  )
}
