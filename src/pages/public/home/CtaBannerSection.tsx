import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { Container } from '@/components/shared/Section'
import { LANDING_IMAGES } from '@/config/landingImages'
import { useAuthModal } from '@/hooks/useAuthModal'

/** Promotional banner: full-width photo with a dark overlay so the text stays readable on any image. */
export function CtaBannerSection() {
  const { openAuth } = useAuthModal()

  return (
    <section aria-labelledby="cta-heading" className="py-20 sm:py-24">
      <Container>
        <div className="relative isolate overflow-hidden rounded-3xl">
          <ImageSlot image={LANDING_IMAGES.cta} variant="background" className="-z-10" />
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-forest-950/85 via-forest-950/60 to-forest-950/20" aria-hidden="true" />
          <div className="max-w-xl px-6 py-14 sm:px-12 sm:py-20">
            <h2 id="cta-heading" className="text-3xl leading-tight font-bold text-white sm:text-4xl">
              Every harvest leaves something valuable behind.
            </h2>
            <p className="mt-4 text-lg text-forest-100/85">List your by-products or post what your business needs — HeyCileng handles the matching, logistics and support.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" variant="accent" onClick={() => openAuth('signup')} rightIcon={<ArrowRight className="size-4.5" />}>
                Get Started
              </Button>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => openAuth('login')}>
                Log in
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
