import { cn } from '@/lib/cn'

const palette = [
  'bg-forest-100 text-forest-800 dark:bg-forest-400/20 dark:text-forest-100',
  'bg-ochre-100 text-ochre-800 dark:bg-ochre-400/20 dark:text-ochre-100',
  'bg-leaf-100 text-leaf-800 dark:bg-leaf-500/20 dark:text-leaf-100',
  'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-100',
]

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const colour = palette[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % palette.length]
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none',
        size === 'sm' && 'size-8 text-xs',
        size === 'md' && 'size-10 text-sm',
        size === 'lg' && 'size-14 text-lg',
        colour,
        className,
      )}
    >
      {initials(name) || '?'}
    </span>
  )
}
