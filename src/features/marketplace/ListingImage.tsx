import { CATEGORY_BY_ID } from '@/config/catalog'
import { cn } from '@/lib/cn'
import type { CategoryId } from '@/types/catalog'
import type { ListingImage as ListingImageType } from '@/types/listing'

const tones = {
  ochre: { bg: 'from-ochre-100 to-ochre-200 dark:from-ochre-400/20 dark:to-ochre-600/25', icon: 'text-ochre-700 dark:text-ochre-200', dot: 'fill-ochre-400/35' },
  amber: { bg: 'from-amber-100 to-ochre-100 dark:from-amber-500/15 dark:to-ochre-500/20', icon: 'text-amber-800 dark:text-amber-200', dot: 'fill-amber-500/30' },
  leaf: { bg: 'from-leaf-100 to-leaf-200 dark:from-leaf-500/15 dark:to-leaf-700/25', icon: 'text-leaf-800 dark:text-leaf-200', dot: 'fill-leaf-500/30' },
  forest: { bg: 'from-forest-100 to-forest-200 dark:from-forest-500/20 dark:to-forest-700/30', icon: 'text-forest-800 dark:text-forest-100', dot: 'fill-forest-500/30' },
}

interface ListingImageProps {
  image?: ListingImageType
  category: CategoryId
  /** Varies the generated artwork between images of the same listing. */
  variant?: number
  className?: string
  showLabel?: boolean
}

/** Shows the listing photo, or a generated category illustration when no photo exists (demo listings). */
export function ListingImage({ image, category, variant = 0, className, showLabel = true }: ListingImageProps) {
  if (image?.url) {
    return <img src={image.url} alt={image.alt} className={cn('size-full object-cover', className)} loading="lazy" />
  }

  const meta = CATEGORY_BY_ID[category]
  const tone = tones[meta.tone]
  const Icon = meta.icon
  const positions = [
    [18, 22],
    [82, 30],
    [70, 80],
    [26, 74],
    [50, 14],
  ]

  return (
    <div role="img" aria-label={image?.alt ?? `${meta.name} illustration`} className={cn('relative size-full overflow-hidden bg-linear-to-br', tone.bg, className)}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
        {positions.map(([x, y], i) => (
          <circle key={i} cx={(x + variant * 23) % 100} cy={(y + variant * 17) % 100} r={6 + ((i + variant) % 3) * 5} className={tone.dot} />
        ))}
        <path d={`M0 ${78 - variant * 4} C30 ${68 + variant * 3} 60 ${88 - variant * 2} 100 ${72 + variant * 2} V100 H0Z`} className={tone.dot} />
      </svg>
      <Icon
        className={cn('absolute top-1/2 left-1/2 size-[34%]', tone.icon)}
        strokeWidth={1.4}
        style={{ transform: `translate(-50%, -50%) rotate(${(variant - 1) * 8}deg)` }}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="absolute bottom-2 left-2 rounded-full bg-surface/85 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase backdrop-blur">
          Illustration
        </span>
      )}
    </div>
  )
}
