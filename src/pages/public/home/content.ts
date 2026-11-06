import {
  BadgeCheck,
  ChartColumn,
  Coins,
  HeartHandshake,
  LifeBuoy,
  Lock,
  PackageSearch,
  Percent,
  Recycle,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Truck,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'

/** Marketing copy for the landing page. Not demo data — no records, figures or partners are claimed. */

export interface Step {
  title: string
  description: string
}

export const SELLER_STEPS: Step[] = [
  { title: 'Create a seller account', description: 'Register your farm, cooperative or processing business and verify your email.' },
  { title: 'List your by-products', description: 'Add quantity, unit, price, location, quality details and photos. Listings are reviewed before going live.' },
  { title: 'Respond to order requests', description: 'Accept or decline requests from buyers. You also see buyer requirements that match your stock.' },
  { title: 'Fulfil with HeyCileng', description: 'HeyCileng coordinates delivery or collection and keeps both sides updated through notifications.' },
]

export const BUYER_STEPS: Step[] = [
  { title: 'Create a buyer account', description: 'Sign up as a business that uses agricultural by-products as raw materials.' },
  { title: 'Browse or post a requirement', description: 'Search the marketplace or describe the material, quantity, budget and quality you need.' },
  { title: 'Review recommended matches', description: 'See listings scored against your requirement, with clear reasons and any limitations.' },
  { title: 'Request an order', description: 'Send a request to the seller. Once accepted, HeyCileng manages logistics and updates.' },
]

export interface Benefit {
  title: string
  description: string
  icon: LucideIcon
}

export const SELLER_BENEFITS: Benefit[] = [
  { icon: Coins, title: 'Earn from what you used to discard', description: 'Turn husks, peels, stalks and other residues into a new income stream.' },
  { icon: Target, title: 'See real demand', description: 'Matched buyer requirements show you who needs your materials and in what quantity.' },
  { icon: Warehouse, title: 'Clear inventory tracking', description: 'Listed, reserved, sold and available stock — always shown separately and accurately.' },
  { icon: Lock, title: 'Your contact details stay private', description: 'Buyers see your business profile, never your phone number or email.' },
]

export const BUYER_BENEFITS: Benefit[] = [
  { icon: PackageSearch, title: 'Find materials faster', description: 'Search and filter by category, location, price and quantity across many suppliers.' },
  { icon: Sparkles, title: 'Requirements that work for you', description: 'Post what you need once and get recommended listings, with reasons for every match.' },
  { icon: Truck, title: 'Logistics handled for you', description: 'HeyCileng assigns delivery partners and shows fees, payer and estimated dates up front.' },
  { icon: LifeBuoy, title: 'One place for support', description: 'Order issues and disputes go to HeyCileng support, with a full response history.' },
]

export const WHY_US: Benefit[] = [
  { icon: Sparkles, title: 'Two-sided smart matching', description: 'Buyers get matched listings and sellers see matched requirements. Scores are recommendations — you stay in control.' },
  { icon: ShieldCheck, title: 'Privacy by design', description: 'No direct buyer–seller contact. All order communication flows through platform notifications and HeyCileng support.' },
  { icon: BadgeCheck, title: 'Reviewed listings', description: 'Listings can be reviewed by HeyCileng before they appear in the marketplace.' },
  { icon: Truck, title: 'Managed logistics', description: 'Our team assigns logistics partners and keeps delivery status, fees and tracking in one place.' },
  { icon: Percent, title: 'Transparent commission', description: 'HeyCileng earns a clear commission on completed orders — no hidden listing fees.' },
  { icon: HeartHandshake, title: 'Built for sustainability', description: 'Every completed order keeps by-products out of open burning and landfill.' },
]

export const ABOUT_PILLARS: Benefit[] = [
  { icon: Recycle, title: 'Circular agriculture', description: 'Residues become inputs for feed, energy, fertiliser and manufacturing.' },
  { icon: Scale, title: 'Fair value for producers', description: 'Farmers and processors earn from materials that were previously a cost.' },
  { icon: ChartColumn, title: 'Reliable supply for industry', description: 'Businesses access consistent, well-described raw materials.' },
]

export const FAQS: { id: string; question: string; answer: string }[] = [
  {
    id: 'what',
    question: 'What is HeyCileng Agtech?',
    answer:
      'HeyCileng is a marketplace for agricultural by-products. Farmers, cooperatives and agro-processors list materials such as husks, peels, stalks and bran, and businesses that use them as raw materials can find, request and receive them through the platform.',
  },
  {
    id: 'who-sells',
    question: 'Who can sell on HeyCileng?',
    answer:
      'Any farm, cooperative or agro-processing business with by-products to sell can register as a seller. You’ll provide your business name, location and a short description, and verify your email address.',
  },
  {
    id: 'matching',
    question: 'How does matchmaking work?',
    answer:
      'Buyers describe what they need, and HeyCileng scores seller listings on material, quantity, location, price, intended application and quality. Sellers see matching buyer requirements in the same way. Scores are recommendations only — matching never places an order, reserves stock or contacts anyone on your behalf.',
  },
  {
    id: 'contact',
    question: 'Can I contact the buyer or seller directly?',
    answer:
      'No. To protect everyone’s privacy, buyers and sellers don’t see each other’s phone numbers or email addresses. Order updates are sent as platform notifications, and any questions go to HeyCileng support, who coordinate with the other party.',
  },
  {
    id: 'reserve',
    question: 'Does an order request reserve the seller’s stock?',
    answer:
      'No. An order request is sent to the seller for review. Stock is only reserved once the seller accepts the order, so the quantity you see is always what is actually available.',
  },
  {
    id: 'delivery',
    question: 'How are deliveries handled?',
    answer:
      'The HeyCileng team assigns a logistics partner to each delivery order and records the delivery fee, who pays it, the estimated date and any tracking reference. For collection orders, you’ll be notified when the order is ready for collection.',
  },
  {
    id: 'payments',
    question: 'How do payments work?',
    answer:
      'Buyers pay HeyCileng securely through Paystack once the seller has accepted the order and any delivery fee is confirmed. HeyCileng then arranges dispatch or collection, and pays the seller after the order is complete, minus HeyCileng’s commission.',
  },
  {
    id: 'fees',
    question: 'What does HeyCileng charge?',
    answer:
      'HeyCileng earns a commission on completed orders. The commission rate is shown clearly before you commit to a transaction.',
  },
]
