import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useScrollLock } from '@/hooks/useScrollLock'
import { cn } from '@/lib/cn'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  /** Visually hide the title (still announced to screen readers). */
  hideTitle?: boolean
  size?: ModalSize
  footer?: ReactNode
  children?: ReactNode
  /** Prevent closing by Escape / backdrop, e.g. while a request is in flight. */
  dismissible?: boolean
  className?: string
  bodyClassName?: string
}

/** Open modals, innermost last — only the top one reacts to Escape. */
const modalStack: string[] = []

const sizes: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-3xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  hideTitle = false,
  size = 'md',
  footer,
  children,
  dismissible = true,
  className,
  bodyClassName,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) return
    modalStack.push(titleId)
    return () => {
      modalStack.splice(modalStack.indexOf(titleId), 1)
    }
  }, [open, titleId])

  useScrollLock(open)
  useFocusTrap(panelRef, open)
  useEscapeKey(() => {
    if (dismissible && modalStack[modalStack.length - 1] === titleId) onClose()
  }, open)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-overlay backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={() => dismissible && onClose()}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full animate-scale-in flex-col rounded-t-2xl border border-border bg-surface shadow-overlay outline-none sm:rounded-2xl',
          sizes[size],
          className,
        )}
      >
        {(title || dismissible) && (
          <div className={cn('flex items-start gap-4 px-5 pt-5 sm:px-6 sm:pt-6', hideTitle && 'absolute top-0 right-0 z-10')}>
            {title && (
              <div className={cn('min-w-0 flex-1', hideTitle && 'sr-only')}>
                <h2 id={titleId} className="text-xl font-bold">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="mt-1 text-sm text-muted">
                    {description}
                  </p>
                )}
              </div>
            )}
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="-mt-1 -mr-2 ml-auto inline-flex size-9 shrink-0 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-sunken hover:text-fg"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        )}
        <div className={cn('overflow-y-auto px-5 py-5 sm:px-6', bodyClassName)}>{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
