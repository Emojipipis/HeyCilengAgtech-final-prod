import { useState, type FormEvent, type ReactNode } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ErrorState, LoadingState } from '@/components/ui/States'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { Textarea } from '@/components/ui/Textarea'
import { CRITERION_LABELS } from '@/config/matching'
import { useAsync } from '@/hooks/useAsync'
import { useViewer } from '@/hooks/useSession'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'
import { isEmail } from '@/lib/validation'
import { services, type ServiceError } from '@/services'
import type { PlatformSettings } from '@/types/admin'

type Section = 'commission' | 'marketplace' | 'matching' | 'notifications' | 'platform'
const TAB_PREFIX = 'settings'
type WeightKey = keyof PlatformSettings['matching']['weights']

function Group({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="space-y-5">{children}</CardBody>
    </Card>
  )
}

export function AdminSettingsPage() {
  const settings = useAsync(() => services.settings.get(), 'settings')
  if (settings.loading && !settings.data) return <LoadingState label="Loading settings…" />
  if (settings.error || !settings.data) return <ErrorState description={settings.error?.message} onRetry={settings.reload} />
  return <SettingsForm key={JSON.stringify(settings.data)} initial={settings.data} onSaved={settings.setData} />
}

function SettingsForm({ initial, onSaved }: { initial: PlatformSettings; onSaved: (s: PlatformSettings) => void }) {
  const { isDemo } = useViewer()
  const { toast } = useToast()
  const [section, setSection] = useState<Section>('commission')
  const [values, setValues] = useState<PlatformSettings>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)
  const dirty = JSON.stringify(values) !== JSON.stringify(initial)
  const weightTotal = Object.values(values.matching.weights).reduce((sum, w) => sum + w, 0)
  const emailInvalid = values.platform.supportEmail.trim() !== '' && !isEmail(values.platform.supportEmail)

  const update = <K extends keyof PlatformSettings>(key: K, patch: Partial<PlatformSettings[K]>) => setValues((v) => ({ ...v, [key]: { ...v[key], ...patch } }))
  const num = (raw: string) => (raw.trim() === '' ? 0 : Number(raw.replace(/[^\d.]/g, '')))

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (weightTotal !== 100) {
      setSection('matching')
      return
    }
    if (emailInvalid) {
      setSection('platform')
      return
    }
    setSaving(true)
    setError(null)
    const result = await services.settings.update(values)
    setSaving(false)
    if (result.ok) {
      onSaved(result.data)
      toast({ tone: 'success', title: 'Settings saved', description: 'Recorded in the audit log.' })
    } else {
      setError(result.error)
    }
  }

  return (
    <form noValidate onSubmit={save}>
      <PageHeader
        eyebrow={isDemo ? <DemoBadge label="Demo settings — reset when the tab reloads" /> : undefined}
        title="Platform settings"
        description="Business rules for commissions, the marketplace, matching and notifications. Changes are audited."
        actions={
          <>
            <Button variant="outline" disabled={!dirty || saving} onClick={() => setValues(initial)}>
              Discard
            </Button>
            <Button type="submit" loading={saving} disabled={!dirty}>
              Save settings
            </Button>
          </>
        }
      />

      {error && <Alert tone="error" className="mb-4">{error.message}</Alert>}

      <Tabs
        label="Settings sections"
        idPrefix={TAB_PREFIX}
        value={section}
        onChange={setSection}
        className="mb-6"
        items={[
          { value: 'commission', label: 'Commission' },
          { value: 'marketplace', label: 'Marketplace' },
          { value: 'matching', label: 'Matching' },
          { value: 'notifications', label: 'Notifications' },
          { value: 'platform', label: 'Platform info' },
        ]}
      />

      <TabPanel idPrefix={TAB_PREFIX} value={section} key={section} className="max-w-3xl">
        {section === 'commission' && (
          <Group title="Commission" description="HeyCileng’s revenue: a percentage of each completed order’s material value.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Commission rate (%)" inputMode="decimal" value={String(values.commission.ratePercent)} onChange={(e) => update('commission', { ratePercent: num(e.target.value) })} hint="Between 0% and 30%." />
              <Select
                label="Charged to"
                // Payments deduct commission from the seller's payout; charging buyers isn't supported yet.
                options={[{ value: 'seller', label: 'Seller (deducted from payout)' }]}
                value={values.commission.chargedTo}
                onChange={(e) => update('commission', { chargedTo: e.target.value as 'seller' | 'buyer' })}
              />
            </div>
            <p className="text-xs text-subtle">The rate is shown to users before they commit. It’s recorded on each order when the buyer pays and deducted from the seller’s payout.</p>
          </Group>
        )}

        {section === 'marketplace' && (
          <Group title="Marketplace">
            <Checkbox
              label="Review new listings before they go live"
              description="When off, sellers’ new listings appear in the marketplace immediately."
              checked={values.marketplace.requireListingReview}
              onChange={(e) => update('marketplace', { requireListingReview: e.target.checked })}
            />
            <Input label="Maximum images per listing" inputMode="numeric" value={String(values.marketplace.maxImagesPerListing)} onChange={(e) => update('marketplace', { maxImagesPerListing: num(e.target.value) })} containerClassName="max-w-xs" />
          </Group>
        )}

        {section === 'matching' && (
          <Group title="Matching" description="Weights decide how much each criterion counts. Material compatibility stays a hard restriction regardless of weight.">
            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(values.matching.weights) as WeightKey[]).map((key) => (
                <Input
                  key={key}
                  label={`${CRITERION_LABELS[key]} (%)`}
                  inputMode="numeric"
                  value={String(values.matching.weights[key])}
                  onChange={(e) => update('matching', { weights: { ...values.matching.weights, [key]: num(e.target.value) } })}
                />
              ))}
            </div>
            <p className={cn('text-sm font-semibold', weightTotal === 100 ? 'text-leaf-700 dark:text-leaf-300' : 'text-red-600 dark:text-red-400')} role="status">
              Total: {weightTotal}% {weightTotal === 100 ? '✓' : '— must add up to 100%'}
            </p>
            <Input label="Minimum recommended score" inputMode="numeric" value={String(values.matching.minRecommendedScore)} onChange={(e) => update('matching', { minRecommendedScore: num(e.target.value) })} hint="Matches below this score aren’t shown." containerClassName="max-w-xs" />
          </Group>
        )}

        {section === 'notifications' && (
          <Group title="Email notifications" description="In-app notifications are always on.">
            <Alert tone="warning">Email delivery isn’t connected yet. These preferences are saved and will apply once an email provider is set up.</Alert>
            <Checkbox label="Order and delivery updates" checked={values.notifications.emailOrderUpdates} onChange={(e) => update('notifications', { emailOrderUpdates: e.target.checked })} />
            <Checkbox label="New match alerts" checked={values.notifications.emailMatchAlerts} onChange={(e) => update('notifications', { emailMatchAlerts: e.target.checked })} />
            <Checkbox label="Platform announcements" checked={values.notifications.emailAnnouncements} onChange={(e) => update('notifications', { emailAnnouncements: e.target.checked })} />
          </Group>
        )}

        {section === 'platform' && (
          <Group title="Platform information">
            <Input label="Platform name" value={values.platform.name} onChange={(e) => update('platform', { name: e.target.value })} />
            <Input
              label="Support email"
              type="email"
              value={values.platform.supportEmail}
              onChange={(e) => update('platform', { supportEmail: e.target.value })}
              error={emailInvalid ? 'Enter a valid email address.' : undefined}
              hint="HeyCileng’s own support address. Leave empty until it’s set up."
            />
            <Textarea label="Tagline" rows={2} value={values.platform.tagline} onChange={(e) => update('platform', { tagline: e.target.value })} />
          </Group>
        )}
      </TabPanel>
    </form>
  )
}
