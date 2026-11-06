import { ImageIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { landingImageSrc, type LandingImage } from '@/config/landingImages'
import { cn } from '@/lib/cn'

interface ImageSlotProps {
  image: LandingImage
  /** Tailwind aspect classes, e.g. "aspect-[4/3] lg:aspect-[4/5]". Not used by the `background` variant. */
  aspect?: string
  className?: string
  /** Above-the-fold images load eagerly. */
  priority?: boolean
  /** Rendered over the image (and the placeholder), e.g. a caption chip. */
  children?: ReactNode
  /** `background` fills its parent and uses a darker placeholder for text overlays. */
  variant?: 'framed' | 'background'
  /** Hide the placeholder's filename hint (for very small slots). */
  compact?: boolean
}

/**
 * Responsive image container with a fixed aspect ratio and object-fit: cover.
 * Shows the photo once the file exists in public/images/landing/; until then, a named placeholder.
 */
export function ImageSlot({ image, aspect, className, priority = false, children, variant = 'framed', compact = false }: ImageSlotProps) {
  const src = landingImageSrc(image)
  const [state, setState] = useState<{ src: string; status: 'loading' | 'loaded' | 'missing' }>({ src, status: 'loading' })
  // Reset if the slot is pointed at a different file.
  const status = state.src === src ? state.status : 'loading'
  const background = variant === 'background'

  return (
    <div
      className={cn(
        // Positioning is chosen exclusively: combining `relative` and `absolute` lets one silently win.
        'overflow-hidden',
        background ? 'absolute inset-0' : cn('relative rounded-2xl', aspect),
        status !== 'loaded' && (background ? 'bg-forest-900' : 'bg-surface-sunken'),
        className,
      )}
      data-image-slot={image.file}
      data-image-status={status}
    >
      <img
        src={src}
        alt={image.alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...(priority ? { fetchPriority: 'high' as const } : {})}
        onLoad={() => setState({ src, status: 'loaded' })}
        onError={() => setState({ src, status: 'missing' })}
        className={cn('absolute inset-0 size-full object-cover transition-opacity duration-500', status === 'loaded' ? 'opacity-100' : 'opacity-0')}
      />

      {status === 'missing' && background && (
        <div className="absolute inset-0 bg-linear-to-br from-forest-800 to-forest-950" aria-hidden="true">
          <span className="absolute right-4 bottom-3 flex items-center gap-1.5 text-[11px] text-forest-100/55">
            <ImageIcon className="size-3.5" strokeWidth={1.5} />
            {image.label} · images/landing/{image.file} · {image.recommended}
          </span>
        </div>
      )}

      {status === 'missing' && !background && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[inherit] border border-dashed border-border-strong bg-linear-to-br from-surface-muted to-surface-sunken p-4 text-center text-subtle"
          aria-hidden="true"
        >
          <ImageIcon className="size-7 text-border-strong" strokeWidth={1.5} />
          <span className="text-sm font-semibold text-muted">{image.label}</span>
          {!compact && (
            <span className="text-[11px] leading-snug">
              images/landing/{image.file}
              <br />
              {image.recommended}
            </span>
          )}
        </div>
      )}

      {children}
    </div>
  )
}
