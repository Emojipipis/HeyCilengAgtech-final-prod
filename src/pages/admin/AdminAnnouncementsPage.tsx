import { Megaphone, Send } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DemoBadge } from '@/components/ui/DemoBadge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { Textarea } from '@/components/ui/Textarea'
import { useAsync } from '@/hooks/useAsync'
import { useViewer } from '@/hooks/useSession'
import { useToast } from '@/hooks/useToast'
import { formatDateTime } from '@/lib/format'
import { services, type ServiceError } from '@/services'
import type { AnnouncementAudience } from '@/types/admin'

const AUDIENCE: Record<AnnouncementAudience, string> = { all: 'All buyers and sellers', buyers: 'Buyers only', sellers: 'Sellers only' }

export function AdminAnnouncementsPage() {
  const { isDemo } = useViewer()
  const { toast } = useToast()
  const list = useAsync(() => services.announcements.list(), 'announcements')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<AnnouncementAudience>('all')
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({})
  const [confirming, setConfirming] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)

  const review = (event: FormEvent) => {
    event.preventDefault()
    const next = {
      title: title.trim().length >= 5 ? undefined : 'Add a title of at least 5 characters.',
      body: body.trim().length >= 20 ? undefined : 'Write at least 20 characters.',
    }
    setErrors(next)
    if (!next.title && !next.body) setConfirming(true)
  }

  const publish = async () => {
    setPublishing(true)
    setError(null)
    const result = await services.announcements.publish({ title, body, audience })
    setPublishing(false)
    setConfirming(false)
    if (result.ok) {
      list.setData((items) => [result.data, ...(items ?? [])])
      setTitle('')
      setBody('')
      toast({ tone: 'success', title: 'Announcement published', description: `Sent to ${AUDIENCE[audience].toLowerCase()} as a platform notification.` })
    } else {
      setError(result.error)
    }
  }

  return (
    <>
      <PageHeader eyebrow={isDemo ? <DemoBadge /> : undefined} title="Announcements" description="Platform-wide updates, delivered to users’ notification centres." />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr] *:min-w-0">
        <Card>
          <CardHeader title="New announcement" />
          <CardBody>
            <form noValidate onSubmit={review} className="space-y-4">
              <Input label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} />
              <Textarea label="Message" required rows={5} value={body} onChange={(e) => setBody(e.target.value)} error={errors.body} />
              <Select label="Audience" options={Object.entries(AUDIENCE).map(([value, label]) => ({ value, label }))} value={audience} onChange={(e) => setAudience(e.target.value as AnnouncementAudience)} />
              <p className="text-xs text-subtle">Suspended accounts don’t receive announcements. Email delivery isn’t connected yet — announcements appear in-app only.</p>
              {error && <Alert tone="error">{error.message}</Alert>}
              <Button type="submit" leftIcon={<Send className="size-4" />}>
                Review and publish
              </Button>
            </form>
          </CardBody>
        </Card>

        <section aria-labelledby="sent-heading">
          <h2 id="sent-heading" className="mb-3 text-lg font-bold">
            Published
          </h2>
          {list.loading ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : list.error ? (
            <ErrorState description={list.error.message} onRetry={list.reload} />
          ) : (list.data ?? []).length === 0 ? (
            <Card>
              <EmptyState compact icon={<Megaphone />} title="No announcements yet" />
            </Card>
          ) : (
            <ul className="space-y-3">
              {(list.data ?? []).map((a) => (
                <li key={a.id}>
                  <Card padded>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{a.title}</p>
                      <Badge tone="neutral">{AUDIENCE[a.audience]}</Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-muted">{a.body}</p>
                    <p className="mt-2 text-xs text-subtle">
                      {formatDateTime(a.publishedAt)} · {a.publishedBy}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void publish()}
        title="Publish this announcement?"
        description={`“${title.trim()}” will be sent to ${AUDIENCE[audience].toLowerCase()}. It can’t be unsent.`}
        confirmLabel="Publish"
        loading={publishing}
      />
    </>
  )
}
