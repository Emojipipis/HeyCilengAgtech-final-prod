import { Accordion } from '@/components/ui/Accordion'
import { Section, SectionHeading } from '@/components/shared/Section'
import { SectionLink } from '@/components/layout/SectionLink'
import { FAQS } from './content'

export function FaqSection() {
  return (
    <Section id="faq">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <SectionHeading
            align="left"
            eyebrow="FAQ"
            title="Frequently asked questions"
            description="Everything you need to know about buying and selling on HeyCileng."
          />
          <p className="mt-6 text-sm text-muted">
            Can’t find your answer?{' '}
            <SectionLink section="contact" className="font-semibold text-action underline-offset-4 hover:underline">
              Contact our team
            </SectionLink>
            .
          </p>
        </div>
        <Accordion
          defaultOpen={FAQS[0].id}
          items={FAQS.map((faq) => ({ id: faq.id, title: faq.question, content: faq.answer }))}
        />
      </div>
    </Section>
  )
}
