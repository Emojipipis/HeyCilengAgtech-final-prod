import { CircleCheckBig, CircleExclamationPoint, Info, TriangleExclamationPoint, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { ToastContext, type Toast, type ToastInput, type ToastTone } from './toast-context'

const icons: Record<ToastTone, { Icon: typeof Info; className: string }> = {
  success: { Icon: CircleCheckBig, className: 'text-leaf-600 dark:text-leaf-400' },
  error: { Icon: CircleExclamationPoint, className: 'text-red-600 dark:text-red-400' },
  warning: { Icon: TriangleExclamationPoint, className: 'text-amber-600 dark:text-amber-400' },
  info: { Icon: Info, className: 'text-sky-600 dark:text-sky-400' },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const { Icon, className } = icons[toast.tone]

  useEffect(() => {
    if (toast.duration === 0) return
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => window.clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex w-full animate-slide-up gap-3 rounded-lg border border-border bg-surface p-4 shadow-raised"
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', className)} aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-fg">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-muted">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="-m-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-subtle hover:bg-surface-sunken hover:text-fg"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const toast = useCallback((input: ToastInput) => {
    const id = nextId.current++
    // Keep at most four on screen.
    setToasts((list) => [...list.slice(-3), { tone: 'info', duration: 5000, ...input, id }])
    return id
  }, [])

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
        >
          <div className="flex w-full max-w-sm flex-col gap-2">
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
            ))}
          </div>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
