import { ImageUp } from 'lucide-react'
import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface FileDropzoneProps {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  className?: string
}

/** Click-or-drop file picker. Validation of type/size is left to the caller. */
export function FileDropzone({ onFiles, accept, multiple = true, disabled, label = 'Upload files', hint, error, className }: FileDropzoneProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    if (disabled) return
    const files = Array.from(event.dataTransfer.files)
    if (files.length) onFiles(multiple ? files : files.slice(0, 1))
  }

  return (
    <div className={className}>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
          dragging ? 'border-action bg-leaf-50 dark:bg-leaf-500/10' : error ? 'border-red-400' : 'border-border-strong hover:border-action hover:bg-surface-muted',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-leaf-100 text-leaf-700 dark:bg-leaf-500/15 dark:text-leaf-300">
          <ImageUp className="size-5" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold text-fg">{label}</span>
        <span className="text-xs text-muted">
          Drag and drop, or <span className="font-semibold text-action">browse</span>
        </span>
        {hint && <span className="text-xs text-subtle">{hint}</span>}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          aria-invalid={error ? true : undefined}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])
            if (files.length) onFiles(files)
            // Allow choosing the same file again later.
            if (inputRef.current) inputRef.current.value = ''
          }}
        />
      </label>
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
