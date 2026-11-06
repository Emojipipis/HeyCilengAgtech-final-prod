import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)} {...props} />
}

interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: 'default' | 'muted' | 'brand'
}

/** Landing-page section with consistent vertical rhythm and an offset for the sticky navbar. */
export function Section({ tone = 'default', className, children, ...props }: SectionProps) {
  return (
    <section
      className={cn(
        'scroll-mt-16 py-20 sm:py-24 lg:py-28',
        tone === 'muted' && 'bg-surface-muted',
        tone === 'brand' && 'bg-forest-900 text-white dark:bg-forest-950',
        className,
      )}
      {...props}
    >
      <Container>{children}</Container>
    </section>
  )
}

interface SectionHeadingProps {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  /** For use on the dark brand-tone section. */
  inverted?: boolean
  className?: string
}

export function SectionHeading({ eyebrow, title, description, align = 'center', inverted = false, className }: SectionHeadingProps) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && (
        <p
          className={cn(
            'text-sm font-semibold tracking-[0.14em] uppercase',
            inverted ? 'text-ochre-300' : 'text-ochre-600 dark:text-ochre-300',
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2 className={cn('mt-3 text-3xl leading-tight font-bold sm:text-4xl', inverted && 'text-white')}>{title}</h2>
      {description && (
        <p className={cn('mt-4 text-base leading-relaxed sm:text-lg', inverted ? 'text-forest-100/80' : 'text-muted')}>
          {description}
        </p>
      )}
    </div>
  )
}
