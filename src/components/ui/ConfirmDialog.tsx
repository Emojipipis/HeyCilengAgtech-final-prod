import { CircleQuestionMark, TriangleExclamationPoint } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'
import { Modal } from './Modal'

export interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  /** Shows a spinner on the confirm button and blocks dismissal. */
  loading?: boolean
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  loading = false,
  children,
}: ConfirmDialogProps) {
  const danger = tone === 'danger'
  const Icon = danger ? TriangleExclamationPoint : CircleQuestionMark

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      dismissible={!loading}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full',
            danger ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' : 'bg-leaf-100 text-leaf-700 dark:bg-leaf-500/15 dark:text-leaf-300',
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold">{title}</h2>
          {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </Modal>
  )
}
