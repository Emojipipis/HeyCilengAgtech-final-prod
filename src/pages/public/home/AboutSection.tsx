import { ArrowRight } from 'lucide-react'
import { ImageSlot } from '@/components/ui/ImageSlot'
import { Section, SectionHeading } from '@/components/shared/Section'
import { LANDING_IMAGES } from '@/config/landingImages'
import { ABOUT_PILLARS } from './content'

const FLOW = ['Farms & processors', 'HeyCileng', 'Industry']

export function AboutSection() {
  return (
    <Section id="about" tone="muted">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading
            align="left"
            eyebrow="About HeyCileng"
            title="By-products are raw materials, not waste."
            description="Every harvest and processing run leaves behind husks, peels, shells, stalks and bran. Too often they are burned or dumped. HeyCileng gives these materials a trusted market, so producers earn more and industries source sustainably."
          />
          <ul className="mt-10 space-y-6">
            {ABOUT_PILLARS.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-4">
                <Icon className="mt-0.5 size-5 shrink-0 text-action" aria-hidden="true" />
                <div>
                  <h3 className="font-sans text-base font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <figure>
          <ImageSlot image={LANDING_IMAGES.about} aspect="aspect-[4/3]" />
          {/* How value flows through the platform */}
          <figcaption className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-medium text-muted">
            {FLOW.map((step, index) => (
              <span key={step} className="inline-flex items-center gap-3">
                <span className={index === 1 ? 'font-semibold text-forest-700 dark:text-leaf-300' : undefined}>{step}</span>
                {index < FLOW.length - 1 && <ArrowRight className="size-4 text-subtle" aria-hidden="true" />}
              </span>
            ))}
          </figcaption>
        </figure>
      </div>
    </Section>
  )
}
