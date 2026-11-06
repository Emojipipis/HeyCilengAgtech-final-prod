import { Bell, Boxes, Ellipsis, Package, Pencil, Plus, Trash, Truck } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Accordion } from '@/components/ui/Accordion'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { Dropdown } from '@/components/ui/Dropdown'
import { FilterChips } from '@/components/ui/FilterChips'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { ProgressSteps } from '@/components/ui/ProgressSteps'
import { SearchBar } from '@/components/ui/SearchBar'
import { Select } from '@/components/ui/Select'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState, ErrorState, LoadingState, Skeleton, Spinner } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/ui/Table'
import { Tabs } from '@/components/ui/Tabs'
import { Textarea } from '@/components/ui/Textarea'
import { Container } from '@/components/shared/Section'
import { STATUS_META } from '@/config/statuses'
import { AuthSuccess } from '@/features/auth/AuthParts'
import { OtpVerification, type OtpFeedback } from '@/features/auth/OtpVerification'
import { useDisclosure } from '@/hooks/useDisclosure'
import { usePagination } from '@/hooks/usePagination'
import { useToast } from '@/hooks/useToast'
import { services } from '@/services'
import type { OrderStatus } from '@/types/status'

/**
 * Living reference for the design system. Rows below are placeholder samples used only
 * to demonstrate components — they are not marketplace data.
 */

interface SampleRow {
  id: string
  name: string
  category: string
  quantity: number
  status: OrderStatus
}

const categories = ['Husks & Shells', 'Peels & Pulp', 'Crop Residues']
const orderStatuses = Object.keys(STATUS_META.order) as OrderStatus[]
const SAMPLE_ROWS: SampleRow[] = Array.from({ length: 23 }, (_, i) => ({
  id: `sample-${i + 1}`,
  name: `Sample item ${String(i + 1).padStart(2, '0')}`,
  category: categories[i % categories.length],
  quantity: ((i * 7) % 20) + 1,
  status: orderStatuses[i % orderStatuses.length],
}))

type OtpGalleryState = 'entry' | 'invalid' | 'expired' | 'resent' | 'verified'

const OTP_GALLERY_FEEDBACK: Record<Exclude<OtpGalleryState, 'verified'>, OtpFeedback> = {
  entry: { kind: 'none' },
  invalid: { kind: 'error', error: { code: 'invalid_otp', message: '' } },
  expired: { kind: 'error', error: { code: 'expired_otp', message: '' } },
  resent: { kind: 'resent', email: 'sample.user@example.com' },
}

function Block({ title, children, description }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="scroll-mt-20" id={title.toLowerCase().replace(/\s+/g, '-')}>
      <h2 className="text-xl font-bold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function DesignSystemPage() {
  const { toast } = useToast()
  const modal = useDisclosure()
  const confirm = useDisclosure()
  const [confirming, setConfirming] = useState(false)
  const [tab, setTab] = useState<'overview' | 'orders' | 'alerts'>('overview')
  const [query, setQuery] = useState('')
  const [chips, setChips] = useState<string[]>([])
  const [stateView, setStateView] = useState<'loading' | 'empty' | 'error'>('empty')
  const [step, setStep] = useState(1)
  const [otpState, setOtpState] = useState<OtpGalleryState>('entry')

  const filtered = useMemo(
    () =>
      SAMPLE_ROWS.filter(
        (row) =>
          (chips.length === 0 || chips.includes(row.category)) && row.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [chips, query],
  )
  const pagination = usePagination(filtered, 5)

  const columns: Column<SampleRow>[] = [
    { key: 'name', header: 'Item', render: (row) => <span className="font-medium text-fg">{row.name}</span> },
    { key: 'category', header: 'Category', render: (row) => row.category, hideOnMobile: true },
    { key: 'qty', header: 'Quantity', align: 'right', render: (row) => <span className="tabular-nums">{row.quantity} t</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge kind="order" status={row.status} /> },
  ]

  return (
    <Container className="py-12 sm:py-16">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold sm:text-4xl">Design system</h1>
        <DemoBadge label="Component samples" />
      </div>
      <p className="mt-2 max-w-2xl text-muted">
        Reusable building blocks for HeyCileng. Toggle the theme in the header to check both modes.
      </p>

      <div className="mt-12 space-y-16">
        <Block title="Buttons">
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="action">Action</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger" leftIcon={<Trash className="size-4" />}>
              Delete
            </Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm" leftIcon={<Plus className="size-4" />}>
              Small
            </Button>
            <Button size="lg">Large</Button>
            <Button size="icon" variant="outline" aria-label="Notifications">
              <Bell className="size-4.5" />
            </Button>
          </div>
        </Block>

        <Block title="Form controls">
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Business name" placeholder="e.g. Green Valley Cooperative" hint="Shown to buyers on your listings." />
            <Input label="Email" type="email" defaultValue="not-an-email" error="Enter a valid email address." required />
            <PasswordInput label="Password" placeholder="••••••••" />
            <Select
              label="Material category"
              placeholder="Select a category"
              options={categories.map((c) => ({ value: c, label: c }))}
            />
            <Textarea label="Description" placeholder="Describe the material…" containerClassName="md:col-span-2" />
            <Checkbox label="I accept the terms and conditions" description="Required to create an account." />
            <Checkbox label="Remember this device" defaultChecked />
          </div>
        </Block>

        <Block title="Badges" description="Status badges read their label and colour from a single registry.">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(['neutral', 'info', 'success', 'warning', 'danger', 'brand', 'accent'] as const).map((tone) => (
                <Badge key={tone} tone={tone}>
                  {tone}
                </Badge>
              ))}
              <DemoBadge />
            </div>
            <div className="flex flex-wrap gap-2">
              {orderStatuses.map((status) => (
                <StatusBadge key={status} kind="order" status={status} />
              ))}
            </div>
          </div>
        </Block>

        <Block title="Alerts">
          <div className="grid gap-3 md:grid-cols-2">
            <Alert tone="success" title="Listing submitted">It will appear after review.</Alert>
            <Alert tone="info" title="Matches are advisory">Scores never place orders or reserve stock.</Alert>
            <Alert tone="warning" title="Backend not connected">Nothing was sent or saved.</Alert>
            <Alert tone="error" title="Couldn’t load orders">Check your connection and try again.</Alert>
          </div>
        </Block>

        <Block title="Cards and stats">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Active listings" value="12" icon={<Package />} hint="Sample value" />
            <StatCard label="Available stock" value="48 t" icon={<Boxes />} tone="accent" hint="Sample value" />
            <StatCard label="In transit" value="3" icon={<Truck />} tone="info" hint="Sample value" />
            <Card>
              <CardHeader title="Card" description="Header, body, footer" />
              <CardBody className="text-sm text-muted">Composable card sections.</CardBody>
              <CardFooter>
                <Button size="sm" variant="outline">
                  Action
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Block>

        <Block title="Tabs, dropdown and progress">
          <div className="space-y-8">
            <Tabs
              label="Sample tabs"
              value={tab}
              onChange={setTab}
              items={[
                { value: 'overview', label: 'Overview' },
                { value: 'orders', label: 'Orders', count: 4 },
                { value: 'alerts', label: 'Alerts', count: 2 },
              ]}
            />
            <div className="flex flex-wrap items-center gap-6">
              <Dropdown
                align="start"
                header={
                  <div className="flex items-center gap-2.5">
                    <Avatar name="Sample User" size="sm" />
                    <span className="text-sm font-medium">Sample User</span>
                  </div>
                }
                trigger={(props) => (
                  <Button {...props} variant="outline" rightIcon={<Ellipsis className="size-4" />}>
                    Actions
                  </Button>
                )}
                items={[
                  { key: 'edit', label: 'Edit', icon: <Pencil />, onSelect: () => toast({ title: 'Edit selected', tone: 'info' }) },
                  { key: 'delete', label: 'Delete', icon: <Trash />, tone: 'danger', onSelect: confirm.open },
                ]}
              />
              <div className="flex items-center gap-2">
                <Avatar name="Amina Bello" />
                <Avatar name="Kwame Mensah" />
                <Avatar name="Chidi Okafor" />
              </div>
            </div>
            <div className="max-w-xl space-y-3">
              <ProgressSteps steps={['Account type', 'Details', 'Verify email']} current={step} />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                  Back
                </Button>
                <Button size="sm" onClick={() => setStep((s) => Math.min(2, s + 1))}>
                  Next
                </Button>
              </div>
            </div>
          </div>
        </Block>

        <Block title="Search, filters, table and pagination">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <SearchBar value={query} onChange={setQuery} placeholder="Search sample items" className="md:w-80" />
              <FilterChips
                label="Category"
                allLabel="All"
                multiple
                options={categories.map((c) => ({ value: c, label: c }))}
                value={chips}
                onChange={setChips}
              />
            </div>
            <DataTable
              caption="Sample items"
              columns={columns}
              rows={pagination.pageItems}
              rowKey={(row) => row.id}
              onRowClick={(row) => toast({ title: row.name, description: 'Row clicked', tone: 'info' })}
              empty={<EmptyState compact title="No items match" description="Try a different search or filter." />}
            />
            <Pagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              onPageChange={pagination.setPage}
              rangeStart={pagination.rangeStart}
              rangeEnd={pagination.rangeEnd}
              total={pagination.total}
            />
          </div>
        </Block>

        <Block title="Overlays and notifications">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={modal.open}>
              Open modal
            </Button>
            <Button variant="outline" onClick={confirm.open}>
              Open confirm dialog
            </Button>
            <Button variant="outline" onClick={() => toast({ tone: 'success', title: 'Saved', description: 'Your changes were saved.' })}>
              Success toast
            </Button>
            <Button variant="outline" onClick={() => toast({ tone: 'error', title: 'Request failed', description: 'Please try again.' })}>
              Error toast
            </Button>
          </div>
        </Block>

        <Block title="Loading, empty and error states">
          <Tabs
            label="State examples"
            variant="pill"
            value={stateView}
            onChange={setStateView}
            items={[
              { value: 'loading', label: 'Loading' },
              { value: 'empty', label: 'Empty' },
              { value: 'error', label: 'Error' },
            ]}
          />
          <Card className="mt-4">
            {stateView === 'loading' && <LoadingState label="Loading listings…" />}
            {stateView === 'empty' && (
              <EmptyState
                icon={<Package />}
                title="No listings yet"
                description="Create your first listing to start receiving order requests."
                action={<Button leftIcon={<Plus className="size-4" />}>Create listing</Button>}
              />
            )}
            {stateView === 'error' && <ErrorState onRetry={() => toast({ title: 'Retrying…', tone: 'info' })} />}
          </Card>
          <div className="mt-4 flex items-center gap-4">
            <Spinner />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </Block>

        <Block
          title="Auth screens"
          description="The real OTP component shown in each state. In the live flow, invalid, expired and verified states appear only when the auth backend returns them."
        >
          <Tabs
            label="OTP states"
            variant="pill"
            value={otpState}
            onChange={setOtpState}
            items={[
              { value: 'entry', label: 'Entry' },
              { value: 'invalid', label: 'Invalid code' },
              { value: 'expired', label: 'Expired code' },
              { value: 'resent', label: 'Code resent' },
              { value: 'verified', label: 'Verified' },
            ]}
          />
          <Card className="mt-4 max-w-md p-6">
            {otpState === 'verified' ? (
              <AuthSuccess
                title="Email verified"
                description="Your buyer account is ready. Log in to browse the marketplace and post your first requirement."
                actionLabel="Continue to log in"
                onAction={() => toast({ title: 'Sample action', tone: 'info' })}
              />
            ) : (
              <OtpVerification
                key={otpState}
                email="sample.user@example.com"
                initialCode={otpState === 'invalid' || otpState === 'expired' ? '482913' : ''}
                initialCooldown={otpState === 'resent' ? 60 : 0}
                initialFeedback={OTP_GALLERY_FEEDBACK[otpState]}
                onVerify={(code) => services.auth.verifySignupOtp('sample.user@example.com', code)}
                onResend={() => services.auth.resendOtp('sample.user@example.com', 'signup')}
                onVerified={() => setOtpState('verified')}
              />
            )}
          </Card>
        </Block>

        <Block title="Accordion">
          <Accordion
            items={[
              { id: 'a', title: 'Does an order request reserve stock?', content: 'No — stock is reserved only after the seller accepts.' },
              { id: 'b', title: 'Can buyers message sellers?', content: 'No. Communication goes through notifications and HeyCileng support.' },
            ]}
          />
        </Block>
      </div>

      <Modal
        open={modal.isOpen}
        onClose={modal.close}
        title="Sample modal"
        description="Press Escape, click the backdrop or use the close button."
        footer={
          <>
            <Button variant="outline" onClick={modal.close}>
              Cancel
            </Button>
            <Button onClick={modal.close}>Done</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Sample field" placeholder="Focus is trapped inside the dialog" />
          <Button variant="outline" onClick={confirm.open}>
            Open nested confirm
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.isOpen}
        onClose={confirm.close}
        tone="danger"
        title="Delete this item?"
        description="This sample action can’t be undone."
        confirmLabel="Delete"
        loading={confirming}
        onConfirm={() => {
          setConfirming(true)
          window.setTimeout(() => {
            setConfirming(false)
            confirm.close()
            toast({ tone: 'success', title: 'Sample item deleted' })
          }, 900)
        }}
      />
    </Container>
  )
}
