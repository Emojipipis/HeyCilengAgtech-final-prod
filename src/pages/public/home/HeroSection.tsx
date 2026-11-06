import { ArrowRight, Lock, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { Container } from '@/components/shared/Section'
import { LANDING_IMAGES } from '@/config/landingImages'
import { useAuthModal } from '@/hooks/useAuthModal'

const highlights = [
  { icon: Sparkles, label: 'Two-sided smart matching' },
  { icon: ShieldCheck, label: 'Managed logistics' },
  { icon: Lock, label: 'Private contact details' },
]

export function HeroSection() {
  const { openAuth } = useAuthModal()

  return (
    <section id="top" className="pt-10 pb-20 sm:pt-14 lg:pt-16 lg:pb-24">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="animate-slide-up">
          <p className="text-sm font-semibold tracking-[0.14em] text-ochre-600 uppercase dark:text-ochre-300">Agricultural by-product marketplace</p>
          <h1 className="mt-5 text-[2.5rem] leading-[1.05] font-extrabold tracking-tight sm:text-6xl lg:text-[3.9rem]">
            Turning Agricultural Waste Into{' '}
            <span className="relative whitespace-nowrap text-forest-700 dark:text-leaf-400">
              Valuable
              <svg viewBox="0 0 200 12" className="absolute -bottom-1.5 left-0 h-3 w-full" aria-hidden="true" preserveAspectRatio="none">
                <path d="M2 9 C50 2 140 2 198 7" strokeWidth="4" strokeLinecap="round" fill="none" className="stroke-ochre-400" />
              </svg>
            </span>{' '}
            Opportunities.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            HeyCileng connects farmers, cooperatives and agro-processors who have by-products like husks, peels, stalks and bran with
            the businesses that use them as raw materials — with smart matching, managed logistics and support built in.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/marketplace" size="lg" variant="primary" rightIcon={<ArrowRight className="size-4.5" />}>
              Explore Marketplace
            </ButtonLink>
            <Button size="lg" variant="outline" onClick={() => openAuth('signup')}>
              Get Started
            </Button>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {highlights.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm text-muted">
                <Icon className="size-4 text-action" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <ImageSlot image={LANDING_IMAGES.hero} aspect="aspect-[4/3] lg:aspect-[4/5]" priority className="w-full">
          <div className="absolute bottom-4 left-4 flex items-center gap-2.5 rounded-full bg-surface/95 py-2 pr-4 pl-2 backdrop-blur">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-fg">
              <Truck className="size-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold text-fg">Delivery coordinated by HeyCileng</span>
          </div>
        </ImageSlot>
      </Container>
    </section>
  )
}
