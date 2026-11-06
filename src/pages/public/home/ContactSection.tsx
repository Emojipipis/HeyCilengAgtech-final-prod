import { Handshake, LifeBuoy, Mail, Send, Store } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Section, SectionHeading } from '@/components/shared/Section'
import { hasErrors, isEmail, type Errors } from '@/lib/validation'
import { services, type ServiceError } from '@/services'
import type { ContactMessageInput, ContactTopic } from '@/types/contact'

const TOPICS: { value: ContactTopic; label: string }[] = [
  { value: 'general', label: 'General enquiry' },
  { value: 'selling', label: 'Selling on HeyCileng' },
  { value: 'buying', label: 'Buying on HeyCileng' },
  { value: 'partnership', label: 'Partnerships & logistics' },
  { value: 'press', label: 'Press & media' },
]

const EMPTY: ContactMessageInput = { name: '', email: '', organisation: '', topic: 'general', message: '' }

const reasons = [
  { icon: Store, title: 'Seller onboarding', description: 'Questions about listing by-products or registering your business.' },
  { icon: Handshake, title: 'Partnerships', description: 'Logistics providers, cooperatives and industry partners.' },
  { icon: LifeBuoy, title: 'Existing orders', description: 'Signed-in users should open a support ticket from their dashboard for faster help.' },
]

function validate(values: ContactMessageInput): Errors<ContactMessageInput> {
  return {
    name: values.name.trim() ? undefined : 'Please enter your name.',
    email: !values.email.trim() ? 'Please enter your email address.' : isEmail(values.email) ? undefined : 'Enter a valid email address.',
    message:
      values.message.trim().length < 20 ? 'Please tell us a little more (at least 20 characters).' : undefined,
  }
}

export function ContactSection() {
  const [values, setValues] = useState<ContactMessageInput>(EMPTY)
  const [errors, setErrors] = useState<Errors<ContactMessageInput>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: true; reference: string } | { ok: false; error: ServiceError } | null>(null)

  const set = <K extends keyof ContactMessageInput>(key: K, value: ContactMessageInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setResult(null)
    if (hasErrors(nextErrors)) return

    setSubmitting(true)
    const response = await services.contact.submitMessage(values)
    setSubmitting(false)
    if (response.ok) {
      setResult({ ok: true, reference: response.data.reference })
      setValues(EMPTY)
    } else {
      setResult({ ok: false, error: response.error })
    }
  }

  return (
    <Section id="contact" tone="muted">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Contact"
            title="Let’s talk about your by-products"
            description="Whether you produce agricultural residues or need them as raw materials, our team is here to help."
          />
          <ul className="mt-10 space-y-5">
            {reasons.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-4">
                <Icon className="mt-0.5 size-5 shrink-0 text-action" aria-hidden="true" />
                <div>
                  <h3 className="font-sans text-base font-semibold">{title}</h3>
                  <p className="mt-0.5 text-sm text-muted">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <form noValidate onSubmit={onSubmit} className="rounded-2xl border border-border bg-surface p-6 sm:p-8" aria-labelledby="contact-form-title">
          <div className="flex items-center gap-3">
            <Mail className="size-5 text-action" aria-hidden="true" />
            <h3 id="contact-form-title" className="text-xl font-bold">
              Send us a message
            </h3>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Input label="Full name" required autoComplete="name" value={values.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
            <Input
              label="Email address"
              type="email"
              required
              autoComplete="email"
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
              error={errors.email}
            />
            <Input
              label="Organisation"
              hint="Optional"
              autoComplete="organization"
              value={values.organisation}
              onChange={(e) => set('organisation', e.target.value)}
            />
            <Select label="Topic" options={TOPICS} value={values.topic} onChange={(e) => set('topic', e.target.value as ContactTopic)} />
            <Textarea
              containerClassName="sm:col-span-2"
              label="Message"
              required
              rows={5}
              value={values.message}
              onChange={(e) => set('message', e.target.value)}
              error={errors.message}
              placeholder="Tell us about the materials you have or need…"
            />
          </div>

          {result && (
            <div className="mt-5">
              {result.ok ? (
                <Alert tone="success" title="Message sent" onDismiss={() => setResult(null)}>
                  Thanks — our team will reply by email. Reference: {result.reference}
                </Alert>
              ) : (
                <Alert
                  tone={result.error.code === 'not_connected' ? 'warning' : 'error'}
                  title={result.error.code === 'not_connected' ? 'Message not sent' : 'Something went wrong'}
                  onDismiss={() => setResult(null)}
                >
                  {result.error.message}
                </Alert>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-subtle">We only use your details to respond to this message.</p>
            <Button type="submit" loading={submitting} rightIcon={<Send className="size-4" />} className="w-full sm:w-auto">
              {submitting ? 'Sending…' : 'Send message'}
            </Button>
          </div>
        </form>
      </div>
    </Section>
  )
}
