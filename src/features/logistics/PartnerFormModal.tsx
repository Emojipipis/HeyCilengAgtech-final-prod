import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FilterChips } from '@/components/ui/FilterChips'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { STATES } from '@/config/locations'
import { isPhone } from '@/lib/validation'
import type { ServiceError } from '@/services'
import type { LogisticsPartner, LogisticsPartnerInput } from '@/types/logistics'

interface PartnerFormModalProps {
  open: boolean
  partner?: LogisticsPartner
  onClose: () => void
  onSubmit: (input: LogisticsPartnerInput) => Promise<{ ok: true } | { ok: false; error: ServiceError }>
}

export function PartnerFormModal(props: PartnerFormModalProps) {
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      size="lg"
      title={props.partner ? 'Edit logistics partner' : 'Add logistics partner'}
      description="Partner contact details are internal to HeyCileng and never shown to buyers or sellers."
    >
      {props.open && <PartnerForm key={props.partner?.id ?? 'new'} {...props} />}
    </Modal>
  )
}

function PartnerForm({ partner, onClose, onSubmit }: PartnerFormModalProps) {
  const [values, setValues] = useState<LogisticsPartnerInput>({
    name: partner?.name ?? '',
    coverageStates: partner?.coverageStates ?? [],
    vehicleTypes: partner?.vehicleTypes ?? '',
    contactName: partner?.contactName ?? '',
    contactPhone: partner?.contactPhone ?? '',
    notes: partner?.notes ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof LogisticsPartnerInput, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<ServiceError | null>(null)

  const set = <K extends keyof LogisticsPartnerInput>(key: K, value: LogisticsPartnerInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next = {
      name: values.name.trim().length >= 2 ? undefined : 'Enter the partner’s registered name.',
      coverageStates: values.coverageStates.length ? undefined : 'Choose at least one state.',
      contactPhone: !values.contactPhone.trim() || isPhone(values.contactPhone) ? undefined : 'Enter a valid phone number.',
    }
    setErrors(next)
    if (next.name || next.coverageStates || next.contactPhone) return
    setSubmitting(true)
    setError(null)
    const result = await onSubmit({ ...values, name: values.name.trim(), vehicleTypes: values.vehicleTypes.trim(), contactName: values.contactName.trim(), contactPhone: values.contactPhone.trim(), notes: values.notes.trim() })
    setSubmitting(false)
    if (result.ok) onClose()
    else setError(result.error)
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Partner name" required containerClassName="sm:col-span-2" value={values.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
        <Input label="Vehicles / capacity" value={values.vehicleTypes} onChange={(e) => set('vehicleTypes', e.target.value)} placeholder="e.g. 10–20 t flatbeds" containerClassName="sm:col-span-2" />
        <Input label="Operations contact" value={values.contactName} onChange={(e) => set('contactName', e.target.value)} />
        <Input label="Contact phone" type="tel" value={values.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} error={errors.contactPhone} />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          Coverage <span className="text-red-600 dark:text-red-400">*</span>
        </legend>
        <FilterChips label="States covered" multiple options={STATES.map((s) => ({ value: s.id, label: s.name }))} value={values.coverageStates} onChange={(v) => set('coverageStates', v)} />
        {errors.coverageStates && (
          <p role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
            {errors.coverageStates}
          </p>
        )}
      </fieldset>
      <Textarea label="Internal notes" rows={2} value={values.notes} onChange={(e) => set('notes', e.target.value)} />
      {error && <Alert tone={error.code === 'not_connected' ? 'warning' : 'error'}>{error.message}</Alert>}
      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {partner ? 'Save partner' : 'Add partner'}
        </Button>
      </div>
    </form>
  )
}
