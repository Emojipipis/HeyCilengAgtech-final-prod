import { Section, SectionHeading } from '@/components/shared/Section'
import { WHY_US } from './content'

export function WhyUsSection() {
  return (
    <Section id="why-heycileng" tone="brand">
      <SectionHeading
        inverted
        eyebrow="Why HeyCileng"
        title="A marketplace built on trust, privacy and transparency"
        description="Everything about HeyCileng is designed so buyers and sellers can transact with confidence."
      />
      <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {WHY_US.map(({ icon: Icon, title, description }) => (
          <li key={title} className="bg-forest-900 p-7 dark:bg-forest-950">
            <Icon className="size-6 text-ochre-300" aria-hidden="true" />
            <h3 className="mt-5 font-sans text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-forest-100/75">{description}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
