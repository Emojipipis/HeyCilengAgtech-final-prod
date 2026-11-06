import { Container } from '@/components/shared/Section'
import { LogoMark } from '@/components/shared/Logo'
import { useAuthModal } from '@/hooks/useAuthModal'
import { SectionLink } from './SectionLink'

const columns: { title: string; links: { label: string; section: string }[] }[] = [
  {
    title: 'Platform',
    links: [
      { label: 'How It Works', section: 'how-it-works' },
      { label: 'By-product Categories', section: 'marketplace' },
      { label: 'Why HeyCileng', section: 'why-heycileng' },
    ],
  },
  {
    title: 'For You',
    links: [
      { label: 'For Sellers', section: 'sellers' },
      { label: 'For Buyers', section: 'buyers' },
      { label: 'FAQ', section: 'faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', section: 'about' },
      { label: 'Contact', section: 'contact' },
    ],
  },
]

const YEAR = new Date().getFullYear()

export function Footer() {
  const { openAuth } = useAuthModal()
  const linkClass = 'text-sm text-forest-100/70 transition-colors hover:text-white'

  return (
    <footer className="bg-forest-950 text-forest-100">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <LogoMark tone="onDark" />
              <span className="font-display text-lg font-bold text-white">HeyCileng Agtech</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-forest-100/70">
              A marketplace that turns agricultural by-products into valuable raw materials — connecting the farms and processors
              that produce them with the businesses that need them.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openAuth('signup')}
                className="rounded-md bg-ochre-400 px-4 py-2 text-sm font-semibold text-forest-950 transition-colors hover:bg-ochre-300"
              >
                Get Started
              </button>
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Login
              </button>
            </div>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="font-sans text-sm font-semibold text-white">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.section}>
                    <SectionLink section={link.section} className={linkClass}>
                      {link.label}
                    </SectionLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-forest-100/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {YEAR} HeyCileng Agtech. All rights reserved.</p>
          <p>Buyers and sellers communicate only through HeyCileng — your contact details stay private.</p>
        </div>
      </Container>
    </footer>
  )
}
