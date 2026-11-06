import { ShieldCheck, ShoppingBasket, Store } from 'lucide-react'
import { useState } from 'react'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { Section, SectionHeading } from '@/components/shared/Section'
import { TabPanel, Tabs } from '@/components/ui/Tabs'
import { LANDING_IMAGES } from '@/config/landingImages'
import { BUYER_STEPS, SELLER_STEPS } from './content'

type Track = 'sellers' | 'buyers'
const TAB_PREFIX = 'how-it-works'

export function HowItWorksSection() {
  const [track, setTrack] = useState<Track>('sellers')
  const steps = track === 'sellers' ? SELLER_STEPS : BUYER_STEPS
  const images = LANDING_IMAGES.howItWorks[track]

  return (
    <Section id="how-it-works">
      <SectionHeading
        eyebrow="How it works"
        title="From farm residue to factory input in four steps"
        description="HeyCileng sits between buyers and sellers, so listings, orders, logistics and support all happen in one trusted place."
      />

      <div className="mt-10 flex justify-center">
        <Tabs
          label="Choose your role"
          variant="pill"
          idPrefix={TAB_PREFIX}
          value={track}
          onChange={setTrack}
          items={[
            { value: 'sellers', label: 'For sellers', icon: <Store /> },
            { value: 'buyers', label: 'For buyers', icon: <ShoppingBasket /> },
          ]}
        />
      </div>

      <TabPanel idPrefix={TAB_PREFIX} value={track} key={track} className="mt-12">
        <ol className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ title, description }, index) => (
            <li key={title}>
              <ImageSlot image={images[index]} aspect="aspect-[3/2]" className="rounded-xl" compact />
              <p className="mt-5 text-xs font-semibold tracking-[0.14em] text-ochre-600 uppercase dark:text-ochre-300">Step {index + 1}</p>
              <h3 className="mt-1.5 font-sans text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
            </li>
          ))}
        </ol>
      </TabPanel>

      <p className="mx-auto mt-12 max-w-2xl text-center text-sm text-muted">
        <ShieldCheck className="mr-1.5 inline size-4.5 align-[-4px] text-action" aria-hidden="true" />
        <span className="font-semibold text-fg">No direct contact between buyers and sellers.</span> Updates arrive as platform notifications, and
        HeyCileng support handles questions on both sides.
      </p>
    </Section>
  )
}
