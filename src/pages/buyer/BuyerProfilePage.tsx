import { Lock, Mail, Phone } from 'lucide-react'
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
import { STATES } from '@/config/locations'
import { useAsync } from '@/hooks/useAsync'
import { useToast } from '@/hooks/useToast'
import { formatDateTime } from '@/lib/format'
import { hasErrors, isPhone, type Errors } from '@/lib/validation'
import { services, type ServiceError } from '@/services'
import type { BuyerProfile } from '@/types/user'

type Editable = Pick<BuyerProfile, 'fullName' | 'phone' | 'businessName' | 'industry' | 'about'> & { state: string; area: string }

const toEditable = (p: BuyerProfile): Editable => ({
  fullName: p.fullName,
  phone: p.phone,
  businessName: p.businessName,
  industry: p.industry,
  about: p.about,
  state: p.location.state,
  area: p.location.area,
})

function validate(v: Editable): Errors<Editable> {
  return {
    fullName: v.fullName.trim().length >= 2 ? undefined : 'Enter your full name.',
    phone: isPhone(v.phone) ? undefined : 'Enter a valid phone number.',
    businessName: v.businessName.trim().length >= 2 ? undefined : 'Enter your business name.',
    state: v.state ? undefined : 'Choose a state.',
  }
}

export function BuyerProfilePage() {
  const profile = useAsync(() => services.profile.getBuyerProfile(), 'buyer-profile')

  if (profile.loading) return <LoadingState label="Loading profile…" />
  if (profile.error || !profile.data) return <ErrorState description={profile.error?.message} onRetry={profile.reload} />

  return <ProfileForm key={profile.data.updatedAt} profile={profile.data} onSaved={profile.setData} />
}

function ProfileForm({ profile, onSaved }: { profile: BuyerProfile; onSaved: (p: BuyerProfile) => void }) {
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
    const result = await services.profile.updateBuyerProfile({
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      businessName: values.businessName.trim(),
      industry: values.industry.trim(),
      about: values.about.trim(),
      location: { state: values.state, area: values.area.trim() },
    })
    setSaving(false)
    if (result.ok) {
      onSaved(result.data)
      toast({ tone: 'success', title: 'Profile updated' })
    } else {
      setError(result.error)
    }
  }

  return (
    <>
      <PageHeader title="Profile" description="Manage your account and business details." />

      <form noValidate onSubmit={save} className="grid gap-6 lg:grid-cols-[1fr_20rem] *:min-w-0">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Personal details" />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Input label="Full name" required value={values.fullName} onChange={(e) => set('fullName', e.target.value)} error={errors.fullName} />
              <Input
                label="Phone number"
                type="tel"
                required
                leftIcon={<Phone />}
                value={values.phone}
                onChange={(e) => set('phone', e.target.value)}
                error={errors.phone}
                hint="Private — never shown to sellers."
              />
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
          </Card>

          <Card>
            <CardHeader title="Business details" description="Your business name may appear on orders handled by HeyCileng." />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <Input label="Business name" required value={values.businessName} onChange={(e) => set('businessName', e.target.value)} error={errors.businessName} />
              <Input label="Industry" placeholder="e.g. Animal feed production" value={values.industry} onChange={(e) => set('industry', e.target.value)} />
              <Select
                label="State"
                required
                placeholder="Select a state"
                options={STATES.map((s) => ({ value: s.id, label: s.name }))}
                value={values.state}
                onChange={(e) => set('state', e.target.value)}
                error={errors.state}
              />
              <Input label="Town / area" value={values.area} onChange={(e) => set('area', e.target.value)} />
              <Textarea
                label="About your business"
                rows={4}
                containerClassName="sm:col-span-2"
                value={values.about}
                onChange={(e) => set('about', e.target.value)}
                hint="What you produce and which materials you typically source."
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
          <Card padded className="text-center">
            <Avatar name={values.fullName || profile.fullName} size="lg" className="mx-auto" />
            <p className="mt-3 font-semibold">{values.businessName || profile.businessName}</p>
            <p className="text-sm text-muted">Buyer account</p>
            <p className="mt-3 text-xs text-subtle">Last updated {formatDateTime(profile.updatedAt)}</p>
          </Card>
          <Card padded>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="size-4 text-action" aria-hidden="true" />
              Your privacy
            </p>
            <p className="mt-2 text-sm text-muted">
              Sellers never see your phone number or email. HeyCileng handles all order communication through notifications and support.
            </p>
          </Card>
        </aside>
      </form>
    </>
  )
}
