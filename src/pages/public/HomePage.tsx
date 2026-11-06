import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AboutSection } from './home/AboutSection'
import { BenefitsSection } from './home/BenefitsSection'
import { CategoriesSection } from './home/CategoriesSection'
import { ContactSection } from './home/ContactSection'
import { CtaBannerSection } from './home/CtaBannerSection'
import { FaqSection } from './home/FaqSection'
import { HeroSection } from './home/HeroSection'
import { HowItWorksSection } from './home/HowItWorksSection'
import { WhyUsSection } from './home/WhyUsSection'

export function HomePage() {
  const { hash } = useLocation()

  // Honour /#section links arriving from other pages.
  useEffect(() => {
    if (!hash) return
    const target = document.getElementById(decodeURIComponent(hash.slice(1)))
    if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }))
  }, [hash])

  return (
    <>
      <HeroSection />
      <AboutSection />
      <HowItWorksSection />
      <CategoriesSection />
      <BenefitsSection />
      <WhyUsSection />
      <CtaBannerSection />
      <FaqSection />
      <ContactSection />
    </>
  )
}
