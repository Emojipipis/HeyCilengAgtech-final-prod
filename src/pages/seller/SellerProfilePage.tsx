import { Eye, Lock, Mail, MapPin, Phone } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ErrorState, LoadingState } from '@/components/ui/States'
import { Textarea } from '@/components/ui/Textarea'
import { STATES, stateName } from '@/config/locations'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/hooks/useToast'
import { formatDateTime } from '@/lib/format'
import { hasErrors, isPhone, type Errors } from '@/lib/validation'
import { services, type ServiceError } from '@/services'
import type { SellerProfile } from '@/types/user'

interface Editable {
  fullName: string
  phone: string
  businessName: string
  state: string
  area: string
  description: string
}

const toEditable = (p: SellerProfile): Editable => ({
  fullName: p.fullName,
  phone: p.phone,
  businessName: p.businessName,
  state: p.location.state,
  area: p.location.area,
  description: p.description,
})

function validate(v: Editable): Errors<Editable> {
  return {
    fullName: v.fullName.trim().length >= 2 ? undefined : 'Enter your full name.',
    phone: isPhone(v.phone) ? undefined : 'Enter a valid phone number.',
    businessName: v.businessName.trim().length >= 2 ? undefined : 'Enter your business name.',
    state: v.state ? undefined : 'Choose a state.',
    area: v.area.trim().length >= 2 ? undefined : 'Enter your town or area.',
    description: v.description.trim().length >= 30 ? undefined : 'Describe your business in at least 30 characters.',
  }
}

export function SellerProfilePage() {
  const profile = useAsync(() => services.profile.getSellerProfile(), 'seller-profile')
  if (profile.loading) return <LoadingState label="Loading profile…" />
  if (profile.error || !profile.data) return <ErrorState description={profile.error?.message} onRetry={profile.reload} />
  return <SellerProfileForm key={profile.data.updatedAt} profile={profile.data} onSaved={profile.setData} />
}

function SellerProfileForm({ profile, onSaved }: { profile: SellerProfile; onSaved: (p: SellerProfile) => void }) {
  const { toast } = useToast()
  const [values, setValues] = useState<Editable>(() => toEditable(profile))
  const [errors, setErrors] = useState<Errors<Editable>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)
  const dirty = JSON.stringify(values) !== JSON.stringify(toEditable(profile))

  const set = <K extends keyof Editable>(key: K, value: Editable[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    const next = validate(values)
    setErrors(next)
    if (hasErrors(next)) return
    setSaving(true)
    setError(null)
    const result = await services.profile.updateSellerProfile({
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      businessName: values.businessName.trim(),
      location: { state: values.state, area: values.area.trim() },
      description: values.description.trim(),
    })
    setSaving(false)
    if (result.ok) {
      onSaved(result.data)
      toast({ tone: 'success', title: 'Business profile updated' })
    } else {
      setError(result.error)
    }
  }

  return (
    <>
      <PageHeader title="Business profile" description="Manage your business details and account information." />
      <form noValidate onSubmit={save} className="grid gap-6 lg:grid-cols-[1fr_20rem] *:min-w-0">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Business details" description="Shown to buyers on your listings." />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Input label="Business name" required containerClassName="sm:col-span-2" value={values.businessName} onChange={(e) => set('businessName', e.target.value)} error={errors.businessName} />
              <Select
                label="State"
                required
                placeholder="Select a state"
                options={STATES.map((s) => ({ value: s.id, label: s.name }))}
                value={values.state}
                onChange={(e) => set('state', e.target.value)}
                error={errors.state}
              />
              <Input label="Town / area" required value={values.area} onChange={(e) => set('area', e.target.value)} error={errors.area} />
              <Textarea
                label="Business description"
                required
                rows={4}
                containerClassName="sm:col-span-2"
                value={values.description}
                onChange={(e) => set('description', e.target.value)}
                error={errors.description}
                hint="What you grow or process and the by-products you usually have. Don’t include contact details."
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Account information" description="Private — only you and HeyCileng can see this." />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Input label="Account holder" required value={values.fullName} onChange={(e) => set('fullName', e.target.value)} error={errors.fullName} />
              <Input label="Phone number" type="tel" required leftIcon={<Phone />} value={values.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} />
              <Input
                label="Email address"
                type="email"
                value={profile.email}
                readOnly
                disabled
                leftIcon={<Mail />}
                containerClassName="sm:col-span-2"
                hint="To change your email, contact HeyCileng support."
              />
            </CardBody>
            {error && (
              <div className="px-5 pb-4 sm:px-6">
                <Alert tone={error.code === 'not_connected' ? 'warning' : 'error'}>{error.message}</Alert>
              </div>
            )}
            <CardFooter>
              <Button variant="outline" disabled={!dirty || saving} onClick={() => setValues(toEditable(profile))}>
                Discard changes
              </Button>
              <Button type="submit" loading={saving} disabled={!dirty}>
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card padded>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Eye className="size-4 text-action" aria-hidden="true" />
              What buyers see
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={values.businessName || profile.businessName} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{values.businessName || '—'}</p>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <MapPin className="size-3" aria-hidden="true" />
                  {values.area || '—'}, {values.state ? stateName(values.state) : '—'}
                </p>
              </div>
            </div>
            <p className="mt-3 line-clamp-4 text-sm text-muted">{values.description}</p>
            <p className="mt-4 flex gap-2 rounded-lg bg-surface-muted p-3 text-xs text-muted">
              <Lock className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              Your name, phone number and email are never shown to buyers.
            </p>
            <p className="mt-3 text-xs text-subtle">Last updated {formatDateTime(profile.updatedAt)}</p>
          </Card>
        </aside>
      </form>
    </>
  )
}
