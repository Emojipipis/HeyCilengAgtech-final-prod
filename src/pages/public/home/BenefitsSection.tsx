import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { Section } from '@/components/shared/Section'
import { LANDING_IMAGES, type LandingImage } from '@/config/landingImages'
import { useAuthModal } from '@/hooks/useAuthModal'
import { cn } from '@/lib/cn'
import { BUYER_BENEFITS, SELLER_BENEFITS, type Benefit } from './content'

interface AudienceRowProps {
  id: string
  eyebrow: string
  title: string
  description: string
  benefits: Benefit[]
  image: LandingImage
  cta: string
  ctaVariant: 'primary' | 'accent'
  reversed?: boolean
}

function AudienceRow({ id, eyebrow, title, description, benefits, image, cta, ctaVariant, reversed }: AudienceRowProps) {
  const { openAuth } = useAuthModal()

  return (
    <div id={id} className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <ImageSlot image={image} aspect="aspect-[4/3]" className={cn(reversed && 'lg:order-2')} />
      <div>
        <p className="text-sm font-semibold tracking-[0.14em] text-ochre-600 uppercase dark:text-ochre-300">{eyebrow}</p>
        <h2 className="mt-3 text-3xl leading-tight font-bold sm:text-4xl">{title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-muted">{description}</p>
        <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {benefits.map(({ icon: Icon, title: benefitTitle, description: benefitDescription }) => (
            <li key={benefitTitle}>
              <Icon className="size-5 text-action" aria-hidden="true" />
              <h3 className="mt-3 font-sans text-base font-semibold">{benefitTitle}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{benefitDescription}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
          <Button variant={ctaVariant} size="lg" onClick={() => openAuth('signup')}>
            {cta}
          </Button>
          <p className="flex items-center gap-1.5 text-sm text-subtle">
            <Check className="size-4 shrink-0 text-action" aria-hidden="true" />
            Free to register — commission only on completed orders.
          </p>
        </div>
      </div>
    </div>
  )
}

export function BenefitsSection() {
  return (
    <Section aria-label="Benefits for sellers and buyers">
      <div className="space-y-24 lg:space-y-32">
        <AudienceRow
          id="sellers"
          eyebrow="For sellers"
          title="Get paid for the by-products you produce"
          description="Farms, cooperatives and agro-processors reach businesses that need their residues — without chasing buyers or sharing private contact details."
          benefits={SELLER_BENEFITS}
          image={LANDING_IMAGES.benefits.sellers}
          cta="Start selling"
          ctaVariant="primary"
        />
        <AudienceRow
          id="buyers"
          eyebrow="For buyers"
          title="Source the raw materials your business runs on"
          description="Feed mills, energy producers and manufacturers find consistent, well-described supply — and get matched to listings that fit their requirements."
          benefits={BUYER_BENEFITS}
          image={LANDING_IMAGES.benefits.buyers}
          cta="Start sourcing"
          ctaVariant="accent"
          reversed
        />
      </div>
    </Section>
  )
}
