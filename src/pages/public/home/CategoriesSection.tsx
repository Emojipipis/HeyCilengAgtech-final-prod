import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '@/components/ui/Button'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { Section, SectionHeading } from '@/components/shared/Section'
import { CATEGORIES } from '@/config/catalog'
import { LANDING_IMAGES } from '@/config/landingImages'

export function CategoriesSection() {
  return (
    <Section id="marketplace" tone="muted">
      <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
        <SectionHeading
          align="left"
          eyebrow="Marketplace categories"
          title="Agricultural by-products, organised for industry"
          description="Browse materials by category and see the applications they are commonly used for."
        />
        <ButtonLink to="/marketplace" variant="outline" rightIcon={<ArrowRight className="size-4" />}>
          Browse the marketplace
        </ButtonLink>
      </div>

      <ul className="mt-12 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map(({ id, name, examples, uses }) => (
          <li key={id} className="group relative rounded-xl has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-ring">
            <ImageSlot image={LANDING_IMAGES.categories[id]} aspect="aspect-[4/3]" className="rounded-xl" compact />
            <h3 className="mt-4 font-sans text-base font-semibold">
              {/* The link covers the whole card. */}
              <Link to={`/marketplace?category=${id}`} className="after:absolute after:inset-0 group-hover:text-action focus-visible:outline-none">
                {name}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-muted">{examples.join(' · ')}</p>
            <p className="mt-2 text-xs text-subtle">
              <span className="font-semibold text-muted">Uses:</span> {uses.join(', ')}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
