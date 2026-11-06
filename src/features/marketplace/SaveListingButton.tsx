import { Heart } from 'lucide-react'
import { cn } from '@/lib/cn'

export function SaveListingButton({
  saved,
  onToggle,
  label,
  className,
  variant = 'overlay',
}: {
  saved: boolean
  onToggle: () => void
  label: string
  className?: string
  variant?: 'overlay' | 'outline'
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onToggle()
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${label} from saved listings` : `Save ${label}`}
      title={saved ? 'Saved' : 'Save listing'}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-colors',
        variant === 'overlay'
          ? 'size-9 rounded-full bg-surface/90 shadow-card backdrop-blur hover:bg-surface'
          : 'h-11 rounded-md border border-border-strong bg-surface px-4 text-sm font-semibold text-fg hover:bg-surface-muted',
        className,
      )}
    >
      <Heart className={cn('size-4.5', saved ? 'fill-red-500 text-red-500' : 'text-muted')} aria-hidden="true" />
      {variant === 'outline' && (saved ? 'Saved' : 'Save')}
    </button>
  )
}
