import { Info } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { FilterChips } from '@/components/ui/FilterChips'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { APPLICATIONS, CATEGORIES, QUALITY_TAGS, UNITS } from '@/config/catalog'
import { STATES } from '@/config/locations'
import { PLATFORM } from '@/config/platform'
import { formatQuantity } from '@/lib/format'
import { hasErrors, type Errors } from '@/lib/validation'
import { useAsync } from '@/hooks/useAsync'
import { services, type ServiceError } from '@/services'
import type { ApplicationId, CategoryId, QualityTag, Unit } from '@/types/catalog'
import type { Listing, ListingImageInput, ListingInput } from '@/types/listing'
import type { SellerPublicProfile } from '@/types/user'
import { ListingCard } from '../marketplace/ListingCard'
import { ListingImagesField } from './ListingImagesField'
import { StockBar } from './StockBar'
import { CONTACT_DETAILS_MESSAGE, containsContactDetails } from '@/lib/contactDetails'

interface FormValues {
  name: string
  category: CategoryId | ''
  description: string
  listedQuantity: string
  unit: Unit
  minOrderQuantity: string
  pricePerUnit: string
  state: string
  area: string
  qualityTags: QualityTag[]
  qualitySpecifications: string
  applications: ApplicationId[]
  images: ListingImageInput[]
}

function fromListing(listing: Listing | undefined, defaults: { state: string; area: string }): FormValues {
  return {
    name: listing?.name ?? '',
    category: listing?.category ?? '',
    description: listing?.description ?? '',
    listedQuantity: listing ? String(listing.listedQuantity) : '',
    unit: listing?.unit ?? 'tonne',
    minOrderQuantity: listing ? String(listing.minOrderQuantity) : '',
    pricePerUnit: listing ? String(listing.pricePerUnit) : '',
    state: listing?.location.state ?? defaults.state,
    area: listing?.location.area ?? defaults.area,
    qualityTags: listing?.qualityTags ?? [],
    qualitySpecifications: listing?.qualitySpecifications ?? '',
    applications: listing?.applications ?? [],
    images: listing?.images.map((image) => ({ id: image.id, url: image.url, alt: image.alt })) ?? [],
  }
}

function validate(v: FormValues, listing?: Listing): Errors<FormValues> {
  const listed = Number(v.listedQuantity)
  const min = Number(v.minOrderQuantity)
  const committed = listing ? listing.reservedQuantity + listing.soldQuantity : 0
  return {
    name: v.name.trim().length < 3 ? 'Enter a product name.' : containsContactDetails(v.name) ? CONTACT_DETAILS_MESSAGE : undefined,
    category: v.category ? undefined : 'Choose a material category.',
    description:
      v.description.trim().length < 30 ? 'Describe the material in at least 30 characters.' : containsContactDetails(v.description) ? CONTACT_DETAILS_MESSAGE : undefined,
    qualitySpecifications: containsContactDetails(v.qualitySpecifications) ? CONTACT_DETAILS_MESSAGE : undefined,
    listedQuantity: !(listed > 0)
      ? 'Enter the quantity you have available.'
      : listed < committed && listing
        ? `Must be at least ${formatQuantity(committed, listing.unit)} (already reserved or sold).`
        : undefined,
    minOrderQuantity: !(min > 0) ? 'Enter a minimum order quantity.' : min > listed ? 'Minimum order can’t exceed the listed quantity.' : undefined,
    pricePerUnit: Number(v.pricePerUnit) > 0 ? undefined : 'Enter a price per unit.',
    state: v.state ? undefined : 'Choose a state.',
    area: v.area.trim().length >= 2 ? undefined : 'Enter the town or area.',
    applications: v.applications.length ? undefined : 'Choose at least one intended application.',
    images: v.images.length ? undefined : 'Add at least one product image.',
  }
}

function toInput(v: FormValues): ListingInput {
  return {
    name: v.name.trim(),
    category: v.category as CategoryId,
    description: v.description.trim(),
    unit: v.unit,
    listedQuantity: Number(v.listedQuantity),
    minOrderQuantity: Number(v.minOrderQuantity),
    pricePerUnit: Number(v.pricePerUnit),
    location: { state: v.state, area: v.area.trim() },
    qualityTags: v.qualityTags,
    qualitySpecifications: v.qualitySpecifications.trim(),
    applications: v.applications,
    images: v.images,
  }
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>{children}</CardBody>
    </Card>
  )
}

interface ListingFormProps {
  listing?: Listing
  seller: SellerPublicProfile
  onSubmit: (input: ListingInput) => Promise<{ ok: true } | { ok: false; error: ServiceError }>
  onCancel: () => void
}

export function ListingForm({ listing, seller, onSubmit, onCancel }: ListingFormProps) {
  const [values, setValues] = useState<FormValues>(() => fromListing(listing, seller.location))
  const [errors, setErrors] = useState<Errors<FormValues>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)
  const unitWord = UNITS[values.unit].label.split(' ')[0].toLowerCase()
  const committed = listing ? listing.reservedQuantity + listing.soldQuantity : 0
  const config = useAsync(() => services.platformConfig.get(), 'platform-config')
  const maxImages = config.data?.maxImagesPerListing ?? 6

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }
  const numeric = (raw: string) => raw.replace(/[^\d.]/g, '')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next = validate(values, listing)
    setErrors(next)
    if (hasErrors(next)) {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }
    setSubmitting(true)
    setError(null)
    const result = await onSubmit(toInput(values))
    setSubmitting(false)
    if (!result.ok) setError(result.error)
  }

  // Live preview of the marketplace card.
  const previewListing: Listing = {
    id: listing?.id ?? 'preview',
    sellerId: seller.id,
    name: values.name || 'Product name',
    category: values.category || 'peels_pulp',
    description: values.description,
    unit: values.unit,
    listedQuantity: Number(values.listedQuantity) || 0,
    reservedQuantity: listing?.reservedQuantity ?? 0,
    soldQuantity: listing?.soldQuantity ?? 0,
    minOrderQuantity: Number(values.minOrderQuantity) || 0,
    pricePerUnit: Number(values.pricePerUnit) || 0,
    location: { state: values.state, area: values.area || '—' },
    qualityTags: values.qualityTags,
    qualitySpecifications: values.qualitySpecifications,
    applications: values.applications,
    images: [],
    status: 'active',
    createdAt: '',
    updatedAt: '',
  }

  return (
    <form noValidate onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_20rem] *:min-w-0">
      <div className="space-y-6">
        <Section title="Product details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Product name" required value={values.name} onChange={(e) => set('name', e.target.value)} error={errors.name} placeholder="e.g. Sun-dried cassava peels" />
            <Select
              label="Material category"
              required
              placeholder="Select a category"
              options={CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
              value={values.category}
              onChange={(e) => set('category', e.target.value as CategoryId)}
              error={errors.category}
            />
            <Textarea
              label="Description"
              required
              rows={4}
              containerClassName="sm:col-span-2"
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              error={errors.description}
              hint="How it’s produced, processed and packed. Don’t include phone numbers or emails — buyers contact HeyCileng."
            />
          </div>
        </Section>

        <Section title="Quantity and price">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <Input
                label="Listed quantity"
                required
                inputMode="decimal"
                value={values.listedQuantity}
                onChange={(e) => set('listedQuantity', numeric(e.target.value))}
                error={errors.listedQuantity}
              />
              <Select
                label="Unit"
                options={Object.entries(UNITS).map(([value, u]) => ({ value, label: u.label }))}
                value={values.unit}
                onChange={(e) => set('unit', e.target.value as Unit)}
                disabled={committed > 0}
              />
            </div>
            <Input
              label={`Minimum order (${UNITS[values.unit].plural})`}
              required
              inputMode="decimal"
              value={values.minOrderQuantity}
              onChange={(e) => set('minOrderQuantity', numeric(e.target.value))}
              error={errors.minOrderQuantity}
            />
            <Input
              label={`Price per ${unitWord} (${PLATFORM.currency})`}
              required
              inputMode="numeric"
              value={values.pricePerUnit}
              onChange={(e) => set('pricePerUnit', numeric(e.target.value))}
              error={errors.pricePerUnit}
              hint="HeyCileng’s commission on completed orders is shown in your order details."
            />
          </div>
          {listing && (
            <div className="mt-5 rounded-lg bg-surface-muted p-4">
              <p className="mb-2 text-sm font-semibold">Current stock</p>
              <StockBar listing={{ ...listing, listedQuantity: Number(values.listedQuantity) || listing.listedQuantity }} />
              <p className="mt-2 flex gap-1.5 text-xs text-subtle">
                <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                Available = Listed − Reserved − Sold. Reserved stock belongs to accepted orders and can’t be removed here.
              </p>
            </div>
          )}
        </Section>

        <Section title="Location">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="State"
              required
              placeholder="Select a state"
              options={STATES.map((s) => ({ value: s.id, label: s.name }))}
              value={values.state}
              onChange={(e) => set('state', e.target.value)}
              error={errors.state}
            />
            <Input label="Town / area" required value={values.area} onChange={(e) => set('area', e.target.value)} error={errors.area} hint="Buyers see the area, not your exact address." />
          </div>
        </Section>

        <Section title="Quality and applications">
          <div className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Quality characteristics</legend>
              <FilterChips
                label="Quality characteristics"
                multiple
                options={Object.entries(QUALITY_TAGS).map(([value, label]) => ({ value: value as QualityTag, label }))}
                value={values.qualityTags}
                onChange={(next) => set('qualityTags', next)}
              />
            </fieldset>
            <Textarea
              label="Quality specifications"
              rows={3}
              value={values.qualitySpecifications}
              onChange={(e) => set('qualitySpecifications', e.target.value)}
              placeholder="e.g. Moisture 10–12%, sand minimised by slab drying"
              error={errors.qualitySpecifications}
            />
            <fieldset>
              <legend className="mb-2 text-sm font-medium">
                Intended applications <span className="text-red-600 dark:text-red-400">*</span>
              </legend>
              <FilterChips
                label="Intended applications"
                multiple
                options={Object.entries(APPLICATIONS).map(([value, label]) => ({ value: value as ApplicationId, label }))}
                value={values.applications}
                onChange={(next) => set('applications', next)}
              />
              {errors.applications && (
                <p role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                  {errors.applications}
                </p>
              )}
              <p className="mt-1.5 text-xs text-subtle">Used for matchmaking with buyer requirements.</p>
            </fieldset>
          </div>
        </Section>

        <Section title="Product images" description={`Up to ${maxImages} images.`}>
          <ListingImagesField value={values.images} onChange={(images) => set('images', images)} category={values.category} error={errors.images} maxImages={maxImages} />
        </Section>

        {error && <Alert tone={error.code === 'not_connected' ? 'warning' : 'error'}>{error.message}</Alert>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {listing ? 'Save changes' : 'Submit for review'}
          </Button>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="lg:sticky lg:top-24">
          <p className="mb-2 text-sm font-semibold">Marketplace preview</p>
          <div className="pointer-events-none">
            <ListingCard item={{ listing: previewListing, seller }} to="#" />
          </div>
          {!listing && (
            <p className="mt-3 text-xs text-subtle">New listings are reviewed by HeyCileng before they appear in the marketplace.</p>
          )}
        </div>
      </aside>
    </form>
  )
}
