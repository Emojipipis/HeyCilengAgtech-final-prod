import type { CategoryId } from '@/types/catalog'

/**
 * Every landing-page image in one place.
 *
 * To add a photo, save it in `public/images/landing/` using the exact `file` name below.
 * Until a file exists, the page shows a labelled placeholder in its place.
 * Using a different name or format (e.g. .webp)? Change `file` here — nothing else needs editing.
 */
export interface LandingImage {
  /** Filename inside public/images/landing/. */
  file: string
  /** Describes the photo for screen readers. Update it to match your actual image. */
  alt: string
  /** Placeholder title shown until the image is added. */
  label: string
  /** Recommended export size (keeps the aspect ratio of the slot). */
  recommended: string
}

export const LANDING_IMAGE_DIR = '/images/landing'

export const landingImageSrc = (image: LandingImage) => `${LANDING_IMAGE_DIR}/${image.file}`

const image = (file: string, label: string, alt: string, recommended: string): LandingImage => ({ file, label, alt, recommended })

export const LANDING_IMAGES = {
  hero: image('hero-main.jpg', 'Hero image', 'Agricultural by-products being prepared for buyers on a Nigerian farm', '1200 × 1500 px (4:5)'),

  about: image('about-farm-to-industry.jpg', 'About image', 'Farm workers handling crop residues that will become raw materials for industry', '1600 × 1200 px (4:3)'),

  howItWorks: {
    sellers: [
      image('how-seller-01-create-account.jpg', 'Seller step 1 — Create account', 'Farmer registering a business on HeyCileng', '900 × 600 px (3:2)'),
      image('how-seller-02-list-byproducts.jpg', 'Seller step 2 — List by-products', 'Pile of rice husks ready to be listed', '900 × 600 px (3:2)'),
      image('how-seller-03-respond-to-orders.jpg', 'Seller step 3 — Respond to orders', 'Farmer checking maize in a field of dry stalks', '900 × 600 px (3:2)'),
      image('how-seller-04-fulfil-with-heycileng.jpg', 'Seller step 4 — Fulfil with HeyCileng', 'Farmers carrying bundles of maize stalks from the field', '900 × 600 px (3:2)'),
    ],
    buyers: [
      image('how-buyer-01-create-account.jpg', 'Buyer step 1 — Create account', 'Business buyer creating a HeyCileng account', '900 × 600 px (3:2)'),
      image('how-buyer-02-browse-or-post.jpg', 'Buyer step 2 — Browse or post a requirement', 'Buyer browsing agricultural by-product listings', '900 × 600 px (3:2)'),
      image('how-buyer-03-review-matches.jpg', 'Buyer step 3 — Review matches', 'Buyer comparing recommended listings', '900 × 600 px (3:2)'),
      image('how-buyer-04-request-order.jpg', 'Buyer step 4 — Request an order', 'Delivery of raw materials arriving at a processing facility', '900 × 600 px (3:2)'),
    ],
  },

  categories: {
    crop_residues: image('category-crop-residues.jpg', 'Crop residues', 'Farmer standing among dry maize stalks after harvest', '800 × 600 px (4:3)'),
    husks_shells: image('category-husks-shells.jpg', 'Husks & shells', 'Groundnut pods and empty shells', '800 × 600 px (4:3)'),
    peels_pulp: image('category-peels-pulp.jpg', 'Peels & pulp', 'Women peeling cassava, with peels piled on the ground', '800 × 600 px (4:3)'),
    cobs_bagasse: image('category-cobs-bagasse.jpg', 'Cobs & bagasse', 'Pile of shredded sugarcane bagasse', '800 × 600 px (4:3)'),
    tree_crop: image('category-tree-crop-byproducts.jpg', 'Tree crop by-products', 'Cocoa pod husks and coconut husks', '800 × 600 px (4:3)'),
    processing: image('category-processing-byproducts.jpg', 'Processing by-products', 'Heap of cassava peels left over from processing', '800 × 600 px (4:3)'),
    livestock: image('category-livestock-byproducts.jpg', 'Livestock by-products', 'Poultry farmer with young chickens in a wooden coop', '800 × 600 px (4:3)'),
    fibre: image('category-fibre-residues.jpg', 'Fibre residues', 'Plantain and sisal fibres drying', '800 × 600 px (4:3)'),
  } satisfies Record<CategoryId, LandingImage>,

  benefits: {
    sellers: image('benefits-sellers.jpg', 'Seller benefits image', 'Farmers carrying bundles of harvested rice across a field', '1400 × 1050 px (4:3)'),
    buyers: image('benefits-buyers.jpg', 'Buyer benefits image', 'Feed mill or factory receiving agricultural raw materials', '1400 × 1050 px (4:3)'),
  },

  cta: image('cta-banner.jpg', 'Call-to-action banner', 'Wide view of green farmland under a blue sky', '2400 × 1000 px (12:5)'),
}
