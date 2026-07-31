export interface CategoryDef {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageCrop?: {
    page: number;
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface CropBox {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  isFeatured?: boolean;
  label?: string; // variant or gallery details
}

export interface VariantDef {
  skuSuffix: string;
  size?: string;
  color?: string;
  priceOffset: number;
  stock: number;
}

export interface ProductDef {
  id?: string;
  name: string;
  slug: string;
  categorySlug: string;
  basePrice: number;
  shortDescription: string;
  description: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  featured: boolean;
  bestseller: boolean;
  crops: CropBox[];
  variants?: VariantDef[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    name: 'Foam Flowers',
    slug: 'foam-flowers',
    description: 'Vibrant, soft-touch premium foam flower packs for garland making and home accents.',
    imageCrop: { page: 2, x: 20, y: 340, w: 1150, h: 620 }
  },
  {
    name: 'Artificial Flowers',
    slug: 'artificial-flowers',
    description: 'Realistic satin roses and ribbon flower separators with stems for garland craft.',
    imageCrop: { page: 8, x: 0, y: 20, w: 1190, h: 1250 }
  },
  {
    name: 'Decorative Balls',
    slug: 'decorative-balls',
    description: 'Gold thread wrapped zari balls in small and large sizes to add a majestic shine.',
    imageCrop: { page: 12, x: 40, y: 330, w: 1110, h: 1000 }
  },
  {
    name: 'Bells',
    slug: 'bells',
    description: 'Metallic conical filigree bells with hollow designs for traditional hangings.',
    imageCrop: { page: 4, x: 20, y: 260, w: 1150, h: 1000 }
  },
  {
    name: 'Beads',
    slug: 'beads',
    description: 'Ribbed barrel and pumpkin white plastic spacer beads for structuring garlands.',
    imageCrop: { page: 6, x: 20, y: 280, w: 550, h: 1100 }
  },
  {
    name: 'Decorative Items',
    slug: 'decorative-items',
    description: 'MDF felt-backed lotus hangings and hand-painted Kamadhenu cow pairs for festivals.',
    imageCrop: { page: 7, x: 40, y: 130, w: 1110, h: 1200 }
  },
  {
    name: 'Plastic Flower Parts',
    slug: 'plastic-flower-parts',
    description: 'Snowflake, jasmine, lily, and cup-shaped plastic backings and separators for garland framing.',
    imageCrop: { page: 15, x: 100, y: 300, w: 990, h: 500 }
  },
  {
    name: 'Threads',
    slug: 'threads',
    description: 'Break-resistant cotton garland threads for heavy flower and bead threading.',
    imageCrop: { page: 16, x: 200, y: 150, w: 800, h: 1100 }
  }
];

export const PRODUCTS: ProductDef[] = [
  {
    name: 'Premium Foam Flowers Pack (100pcs)',
    slug: 'premium-foam-flowers-pack',
    categorySlug: 'foam-flowers',
    basePrice: 150,
    shortDescription: 'Pack of 100 premium artificial foam flowers for garland making.',
    description: 'Premium high-density soft foam flowers, designed for long-lasting visual appeal. Perfect for garland making, wedding decorations, and festive home styling. Durable, vibrant, and soft-touch.',
    tags: ['Foam', 'Garland', 'Decoration', 'Wedding', 'DIY', 'Artificial', 'Festival', 'Craft', 'Temple', 'Home Decor'],
    seoTitle: 'Buy Premium Foam Flowers Pack of 100 | Me Nestham',
    seoDescription: 'Purchase high-quality artificial foam flowers for garland making & home decor. Available in 19 vibrant colors with bulk pricing at Me Nestham.',
    seoKeywords: 'foam flowers, artificial flowers, garland materials, wedding decor, DIY craft, festive supplies',
    featured: true,
    bestseller: true,
    crops: [
      { page: 2, x: 20, y: 340, w: 1150, h: 620, isFeatured: true, label: 'collage' },
      { page: 2, x: 20, y: 20, w: 260, h: 300, label: 'white' },
      { page: 2, x: 310, y: 20, w: 260, h: 300, label: 'red-orange' },
      { page: 2, x: 600, y: 20, w: 260, h: 300, label: 'dark-blue' },
      { page: 2, x: 900, y: 20, w: 260, h: 300, label: 'aqua' },
      { page: 2, x: 20, y: 340, w: 260, h: 300, label: 'magenta' },
      { page: 2, x: 310, y: 340, w: 260, h: 300, label: 'teal' },
      { page: 2, x: 600, y: 340, w: 260, h: 300, label: 'lavender' },
      { page: 2, x: 900, y: 340, w: 260, h: 300, label: 'dark-green' },
      { page: 2, x: 20, y: 660, w: 260, h: 300, label: 'silver' },
      { page: 2, x: 310, y: 660, w: 260, h: 300, label: 'yellow' },
      { page: 2, x: 600, y: 660, w: 260, h: 300, label: 'maroon' },
      { page: 2, x: 900, y: 660, w: 260, h: 300, label: 'peach' },
      { page: 2, x: 20, y: 980, w: 260, h: 300, label: 'coral' },
      { page: 2, x: 310, y: 980, w: 260, h: 300, label: 'gold' },
      { page: 2, x: 600, y: 980, w: 260, h: 300, label: 'pink' },
      { page: 2, x: 900, y: 980, w: 260, h: 300, label: 'orange' },
      { page: 2, x: 20, y: 1300, w: 260, h: 300, label: 'light-blue' },
      { page: 2, x: 310, y: 1300, w: 260, h: 300, label: 'lime-green' },
      { page: 2, x: 600, y: 1300, w: 260, h: 300, label: 'purple' }
    ],
    variants: [
      { skuSuffix: 'WHT', color: 'White', priceOffset: 0, stock: 100 },
      { skuSuffix: 'RDO', color: 'Red-Orange', priceOffset: 0, stock: 100 },
      { skuSuffix: 'DBL', color: 'Dark Blue', priceOffset: 0, stock: 100 },
      { skuSuffix: 'AQU', color: 'Aqua', priceOffset: 0, stock: 100 },
      { skuSuffix: 'MAG', color: 'Magenta', priceOffset: 0, stock: 100 },
      { skuSuffix: 'TEA', color: 'Teal', priceOffset: 0, stock: 100 },
      { skuSuffix: 'LAV', color: 'Lavender', priceOffset: 0, stock: 100 },
      { skuSuffix: 'DGR', color: 'Dark Green', priceOffset: 0, stock: 100 },
      { skuSuffix: 'SLV', color: 'Silver', priceOffset: 0, stock: 100 },
      { skuSuffix: 'YEL', color: 'Yellow', priceOffset: 0, stock: 100 },
      { skuSuffix: 'MAR', color: 'Maroon', priceOffset: 0, stock: 100 },
      { skuSuffix: 'PCH', color: 'Peach', priceOffset: 0, stock: 100 },
      { skuSuffix: 'CRL', color: 'Coral', priceOffset: 0, stock: 100 },
      { skuSuffix: 'GLD', color: 'Gold', priceOffset: 0, stock: 100 },
      { skuSuffix: 'PNK', color: 'Pink', priceOffset: 0, stock: 100 },
      { skuSuffix: 'ORG', color: 'Orange', priceOffset: 0, stock: 100 },
      { skuSuffix: 'LBL', color: 'Light Blue', priceOffset: 0, stock: 100 },
      { skuSuffix: 'LGR', color: 'Lime Green', priceOffset: 0, stock: 100 },
      { skuSuffix: 'PRP', color: 'Purple', priceOffset: 0, stock: 100 }
    ]
  },
  {
    name: 'Handcrafted Small Gold Zari Balls (10pcs)',
    slug: 'handcrafted-small-gold-zari-balls',
    categorySlug: 'decorative-balls',
    basePrice: 80,
    shortDescription: 'Set of 10 small gold zari balls for traditional garland crafting.',
    description: 'Exquisite handcrafted small gold zari balls (~3cm diameter) wrapped with high-quality gold thread. Adds a premium traditional touch to garlands, wall hanging crafts, and festive backdrops.',
    tags: ['Gold', 'Zari', 'Ball', 'Garland', 'Decoration', 'Wedding', 'DIY', 'Craft', 'Temple', 'Home Decor'],
    seoTitle: 'Handcrafted Small Gold Zari Balls (Pack of 10) | Me Nestham',
    seoDescription: 'Shop beautiful 3cm gold zari balls for garland making & crafts. Pack of 10 at the best price. Authentic festive decor supplies.',
    seoKeywords: 'gold zari balls, small zari balls, garland accessories, craft balls, indian decoration',
    featured: false,
    bestseller: false,
    crops: [
      { page: 3, x: 40, y: 80, w: 1110, h: 1000, isFeatured: true, label: 'main' }
    ]
  },
  {
    name: 'Conical Golden Filigree Bells (10pcs)',
    slug: 'conical-golden-filigree-bells',
    categorySlug: 'bells',
    basePrice: 90,
    shortDescription: 'Pack of 10 elegant conical golden filigree bells for decorations.',
    description: 'High-quality conical golden filigree bells. Features beautiful metallic patterns that reflect light brilliantly, perfect for wedding garlands, door hangings, and decorative crafts.',
    tags: ['Bells', 'Gold', 'Filigree', 'Garland', 'Decoration', 'Wedding', 'DIY', 'Craft', 'Temple', 'Home Decor'],
    seoTitle: 'Conical Golden Filigree Bells (Pack of 10) | Me Nestham',
    seoDescription: 'Premium quality golden filigree bells for garland making and traditional hangings. Pack of 10 bells at ₹90 only.',
    seoKeywords: 'golden bells, filigree bells, conical bells, garland bells, decorative bells',
    featured: false,
    bestseller: false,
    crops: [
      { page: 4, x: 20, y: 260, w: 1150, h: 1000, isFeatured: true, label: 'main' }
    ]
  },
  {
    name: 'Metallic Gold Ribbon Flowers',
    slug: 'metallic-gold-ribbon-flowers',
    categorySlug: 'artificial-flowers',
    basePrice: 10,
    shortDescription: 'Shiny metallic gold ribbon flowers for garland separators and crafts.',
    description: 'Elegant golden artificial ribbon flowers with a subtle green stem. Very versatile for garland separators, wrapping accents, and floral jewelry making.',
    tags: ['Gold', 'Ribbon', 'Flower', 'Garland', 'Artificial', 'Decoration', 'DIY', 'Craft', 'Temple', 'Home Decor'],
    seoTitle: 'Metallic Gold Ribbon Flowers (Pack of 10/100) | Me Nestham',
    seoDescription: 'Purchase shiny golden ribbon flowers with green stems. Perfect separator beads for making garland garlands. Packs of 10 and 100 available.',
    seoKeywords: 'gold ribbon flowers, artificial gold flowers, garland flowers, flower spacers',
    featured: false,
    bestseller: false,
    crops: [
      { page: 5, x: 40, y: 40, w: 1110, h: 1100, isFeatured: true, label: 'main' }
    ],
    variants: [
      { skuSuffix: '10P', size: 'Pack of 10', priceOffset: 0, stock: 100 },
      { skuSuffix: '100P', size: 'Pack of 100', priceOffset: 85, stock: 100 }
    ]
  },
  {
    name: 'Ribbed Barrel Plastic Spacer Beads',
    slug: 'ribbed-barrel-plastic-spacer-beads',
    categorySlug: 'beads',
    basePrice: 40,
    shortDescription: 'Ribbed barrel white plastic beads for garland spacer separators.',
    description: 'High-quality white plastic beads in a ribbed barrel shape. Extremely durable, lightweight, and smooth-edged, ideal as garland-making spacer beads.',
    tags: ['Beads', 'Plastic', 'Barrel', 'Spacer', 'Garland', 'DIY', 'Craft', 'Temple', 'Home Decor'],
    seoTitle: 'Ribbed Barrel Plastic Spacer Beads | Me Nestham',
    seoDescription: 'Buy premium white ribbed barrel plastic beads by weight. Ideal for garland making, DIY decorations, and crafts. 100g and 250g options.',
    seoKeywords: 'barrel beads, ribbed spacer beads, white plastic beads, garland spacer beads',
    featured: false,
    bestseller: false,
    crops: [
      { page: 6, x: 20, y: 280, w: 550, h: 1100, isFeatured: true, label: 'main' }
    ],
    variants: [
      { skuSuffix: '100G', size: '100 grams', priceOffset: 0, stock: 100 },
      { skuSuffix: '250G', size: '250 grams', priceOffset: 60, stock: 100 }
    ]
  },
  {
    name: 'Ribbed Pumpkin Plastic Spacer Beads',
    slug: 'ribbed-pumpkin-plastic-spacer-beads',
    categorySlug: 'beads',
    basePrice: 40,
    shortDescription: 'Ribbed pumpkin white plastic beads for garland spacer separators.',
    description: 'Elegant white plastic beads in a ribbed pumpkin shape. Adds texture and class to handmade garlands, torans, and traditional backdrops.',
    tags: ['Beads', 'Plastic', 'Pumpkin', 'Spacer', 'Garland', 'DIY', 'Craft', 'Temple', 'Home Decor'],
    seoTitle: 'Ribbed Pumpkin Plastic Spacer Beads | Me Nestham',
    seoDescription: 'Elegant white pumpkin-shaped ribbed beads. High-quality plastic spacer beads for traditional garlands. Available in 100g and 250g packs.',
    seoKeywords: 'pumpkin beads, ribbed pumpkin beads, plastic beads, spacer beads',
    featured: false,
    bestseller: false,
    crops: [
      { page: 6, x: 620, y: 280, w: 550, h: 1100, isFeatured: true, label: 'main' }
    ],
    variants: [
      { skuSuffix: '100G', size: '100 grams', priceOffset: 0, stock: 100 },
      { skuSuffix: '250G', size: '250 grams', priceOffset: 60, stock: 100 }
    ]
  },
  {
    name: 'MDF Laser Cut Red Lotus Wall Hangings (10pcs)',
    slug: 'mdf-laser-cut-red-lotus-wall-hangings',
    categorySlug: 'decorative-items',
    basePrice: 190,
    shortDescription: 'Pack of 10 MDF laser-cut red felt lotus wall hanging cutouts.',
    description: 'Beautiful laser-cut wooden MDF lotus flower shapes backed with premium red fabric/felt. Perfect for festive wall decor, backdrop styling, and DIY housewarming hangings.',
    tags: ['Lotus', 'MDF', 'Wooden', 'Wall Hanging', 'Decoration', 'DIY', 'Wedding', 'Festival', 'Home Decor'],
    seoTitle: 'MDF Laser Cut Red Lotus Wall Hangings (Pack of 10) | Me Nestham',
    seoDescription: 'Festive red fabric-backed wooden MDF lotus cutouts. Pack of 10 lotuses for ₹190. Elegant traditional home decor accessory.',
    seoKeywords: 'mdf lotus cutouts, wood lotus shapes, red felt lotus, backdrop flower cutouts',
    featured: true,
    bestseller: false,
    crops: [
      { page: 7, x: 40, y: 130, w: 1110, h: 1200, isFeatured: true, label: 'main' }
    ]
  },
  {
    name: 'Artificial Satin Rose Flowers',
    slug: 'artificial-satin-rose-flowers',
    categorySlug: 'artificial-flowers',
    basePrice: 80,
    shortDescription: 'Pack of 10 premium artificial satin roses for garland making.',
    description: 'Premium artificial satin roses for garland making and floral crafts. Features natural-looking layered petals, available in classic vibrant colors.',
    tags: ['Rose', 'Satin', 'Flower', 'Artificial', 'Garland', 'DIY', 'Craft', 'Wedding', 'Decoration', 'Home Decor'],
    seoTitle: 'Premium Artificial Satin Rose Flowers (Pack of 10) | Me Nestham',
    seoDescription: 'High-quality satin rose flowers in Red, Yellow, White, and Pink. Pack of 10 roses for garland separators & wedding decor.',
    seoKeywords: 'satin roses, artificial roses, craft rose flowers, garland making roses',
    featured: true,
    bestseller: true,
    crops: [
      { page: 8, x: 0, y: 20, w: 1190, h: 1250, isFeatured: true, label: 'collage' },
      { page: 8, x: 100, y: 140, w: 400, h: 400, label: 'yellow' },
      { page: 8, x: 550, y: 340, w: 500, h: 400, label: 'white' },
      { page: 8, x: 450, y: 240, w: 300, h: 150, label: 'pink' },
      { page: 8, x: 350, y: 580, w: 450, h: 400, label: 'red' }
    ],
    variants: [
      { skuSuffix: 'RED', color: 'Red', priceOffset: 0, stock: 100 },
      { skuSuffix: 'YEL', color: 'Yellow', priceOffset: 0, stock: 100 },
      { skuSuffix: 'WHT', color: 'White', priceOffset: 0, stock: 100 },
      { skuSuffix: 'PNK', color: 'Pink', priceOffset: 0, stock: 100 }
    ]
  },
  {
    name: 'Snowflake Plastic Flower Separators',
    slug: 'snowflake-plastic-flower-separators',
    categorySlug: 'plastic-flower-parts',
    basePrice: 200,
    shortDescription: 'Snowflake shape white plastic flower separators for garland backing.',
    description: 'Durable white plastic flower separators in a classic 8-arm snowflake design. Widely used in professional garland crafting to give structure, balance, and volume.',
    tags: ['Plastic', 'Separators', 'Snowflake', 'Garland', 'Spacer', 'DIY', 'Craft', 'Festival', 'Home Decor'],
    seoTitle: 'Snowflake Plastic Flower Separators for Garlands | Me Nestham',
    seoDescription: 'Traditional 8-arm white snowflake plastic separators for garland backing. High quality, light weight. 250g, 500g, and 1kg options available.',
    seoKeywords: 'snowflake separator, plastic separator, garland backing, spacer, flower parts',
    featured: false,
    bestseller: false,
    crops: [
      { page: 9, x: 250, y: 40, w: 900, h: 1200, isFeatured: true, label: 'main' },
      { page: 14, x: 100, y: 100, w: 990, h: 1400, label: 'packaging' }
    ],
    variants: [
      { skuSuffix: '250G', size: '250 grams', priceOffset: 0, stock: 100 },
      { skuSuffix: '500G', size: '500 grams', priceOffset: 200, stock: 100 },
      { skuSuffix: '1KG', size: '1kg', priceOffset: 600, stock: 100 }
    ]
  },
  {
    name: 'Six-Arm Cup Plastic Flower Separators',
    slug: 'six-arm-cup-plastic-flower-separators',
    categorySlug: 'plastic-flower-parts',
    basePrice: 200,
    shortDescription: '6-arm cup shape white plastic flower separators for professional garland making.',
    description: 'Structured 6-arm plastic flower cup separators. Features mini cups at the tips of the arms to hold flower petals or beads securely in place.',
    tags: ['Plastic', 'Separators', 'Cup', 'Garland', 'Spacer', 'DIY', 'Craft', 'Festival', 'Home Decor'],
    seoTitle: 'Six-Arm Cup Plastic Flower Separators | Me Nestham',
    seoDescription: 'Professional 6-arm cup design plastic flower separators for garland making. Available in 250g, 500g, and 1kg bags. Best prices online.',
    seoKeywords: 'six-arm cup separator, plastic separators, garland spacer, flower cup',
    featured: false,
    bestseller: false,
    crops: [
      { page: 10, x: 100, y: 320, w: 990, h: 1000, isFeatured: true, label: 'main' },
      { page: 13, x: 40, y: 330, w: 1110, h: 1000, label: 'closeup' }
    ],
    variants: [
      { skuSuffix: '250G', size: '250 grams', priceOffset: 0, stock: 100 },
      { skuSuffix: '500G', size: '500 grams', priceOffset: 200, stock: 100 },
      { skuSuffix: '1KG', size: '1kg', priceOffset: 600, stock: 100 }
    ]
  },
  {
    name: 'MDF Hand-Painted Kamadhenu Cow Cutouts (Pair)',
    slug: 'mdf-hand-painted-kamadhenu-cow-cutouts',
    categorySlug: 'decorative-items',
    basePrice: 75,
    shortDescription: 'Pair of MDF hand-painted Kamadhenu cow wall cutouts.',
    description: 'Traditional hand-painted white Kamadhenu cow cutouts made on premium MDF board. Depicts the sacred cow with gold and red accents, perfect as a pair for door frames and home altars.',
    tags: ['Cow', 'Kamadhenu', 'MDF', 'Wall Hanging', 'Pair', 'Wedding', 'Festival', 'Home Decor'],
    seoTitle: 'MDF Hand-Painted Kamadhenu Cow Cutouts (Pair) | Me Nestham',
    seoDescription: 'Traditional pair of hand-painted MDF Kamadhenu cow cutouts for festive decorations and door side hangings. Shop online at ₹75 only.',
    seoKeywords: 'kamadhenu cow cutout, mdf cow cutouts, hand-painted cow decor, side door hangings',
    featured: false,
    bestseller: false,
    crops: [
      { page: 11, x: 40, y: 330, w: 1110, h: 900, isFeatured: true, label: 'main' }
    ]
  },
  {
    name: 'Handcrafted Large Gold Zari Balls (10pcs)',
    slug: 'handcrafted-large-gold-zari-balls',
    categorySlug: 'decorative-balls',
    basePrice: 160,
    shortDescription: 'Set of 10 large gold zari balls for heavy garland crafting.',
    description: 'Large handcrafted gold zari balls (~4cm diameter). Wrapped with glittering gold threads, ideal for heavy wedding garlands and majestic festival hanging decor.',
    tags: ['Gold', 'Zari', 'Ball', 'Large', 'Garland', 'Decoration', 'Wedding', 'Festival', 'Home Decor'],
    seoTitle: 'Handcrafted Large Gold Zari Balls (Pack of 10) | Me Nestham',
    seoDescription: 'Premium 4cm large gold zari balls wrapped in thread. Pack of 10 balls for heavy garlands and grand festive decor. Buy online.',
    seoKeywords: 'gold zari balls, large zari balls, heavy zari balls, garland accessories',
    featured: false,
    bestseller: false,
    crops: [
      { page: 12, x: 40, y: 330, w: 1110, h: 1000, isFeatured: true, label: 'main' }
    ]
  },
  {
    name: 'Trumpet Lily Shape Plastic Flower Separators',
    slug: 'trumpet-lily-shape-plastic-flower-separators',
    categorySlug: 'plastic-flower-parts',
    basePrice: 200,
    shortDescription: 'Lily trumpet shape plastic separators for garland borders.',
    description: 'Delicate white plastic flower separators in a lily/trumpet shape. Fits snugly at the ends of garland segments to hold details together.',
    tags: ['Plastic', 'Separators', 'Lily', 'Trumpet', 'Garland', 'Spacer', 'DIY', 'Craft'],
    seoTitle: 'Trumpet/Lily Shape Plastic Garland Separators | Me Nestham',
    seoDescription: 'Flower trumpet/lily shaped plastic separators for garland endings. High durability, lightweight. Available in 250g, 500g, and 1kg.',
    seoKeywords: 'lily separator, trumpet separator, plastic separators, garland end cap',
    featured: false,
    bestseller: false,
    crops: [
      { page: 15, x: 150, y: 350, w: 200, h: 200, isFeatured: true, label: 'main' }
    ],
    variants: [
      { skuSuffix: '250G', size: '250 grams', priceOffset: 0, stock: 100 },
      { skuSuffix: '500G', size: '500 grams', priceOffset: 200, stock: 100 },
      { skuSuffix: '1KG', size: '1kg', priceOffset: 600, stock: 100 }
    ]
  },
  {
    name: 'Eight-Pointed Bud Plastic Flower Separators',
    slug: 'eight-pointed-bud-plastic-flower-separators',
    categorySlug: 'plastic-flower-parts',
    basePrice: 200,
    shortDescription: '8-pointed star bud shape plastic separators for garlands.',
    description: 'Eight-pointed star bud plastic separators. Excellent spacer components that provide multi-directional support and volume for garlands.',
    tags: ['Plastic', 'Separators', 'Bud', 'Star', 'Garland', 'Spacer', 'DIY', 'Craft'],
    seoTitle: '8-Pointed Bud Plastic Garland Separators | Me Nestham',
    seoDescription: 'Standard 8-pointed star bud plastic spacer separators for garland volume. Shop 250g, 500g, and 1kg options at Me Nestham.',
    seoKeywords: 'star bud separators, 8-pointed separators, plastic flower backing, spacer',
    featured: false,
    bestseller: false,
    crops: [
      { page: 15, x: 150, y: 500, w: 200, h: 200, isFeatured: true, label: 'main' }
    ],
    variants: [
      { skuSuffix: '250G', size: '250 grams', priceOffset: 0, stock: 100 },
      { skuSuffix: '500G', size: '500 grams', priceOffset: 200, stock: 100 },
      { skuSuffix: '1KG', size: '1kg', priceOffset: 600, stock: 100 }
    ]
  },
  {
    name: 'Six-Arm Bell Plastic Flower Separators',
    slug: 'six-arm-bell-plastic-flower-separators',
    categorySlug: 'plastic-flower-parts',
    basePrice: 200,
    shortDescription: '6-arm bell shape plastic separators for blossom garlands.',
    description: 'Traditional six-arm bell shaped plastic separators. Ideal for spacer backings that give a flared blossom look to artificial garland arrangements.',
    tags: ['Plastic', 'Separators', 'Bell', 'Garland', 'Spacer', 'DIY', 'Craft'],
    seoTitle: 'Six-Arm Bell Plastic Garland Separators | Me Nestham',
    seoDescription: 'Premium six-arm bell shaped plastic separators for floral garland crafts. Weight options: 250g, 500g, 1kg. High-quality production.',
    seoKeywords: 'bell separators, 6-arm bell, plastic spacer, blossom separators',
    featured: false,
    bestseller: false,
    crops: [
      { page: 15, x: 400, y: 500, w: 220, h: 220, isFeatured: true, label: 'main' }
    ],
    variants: [
      { skuSuffix: '250G', size: '250 grams', priceOffset: 0, stock: 100 },
      { skuSuffix: '500G', size: '500 grams', priceOffset: 200, stock: 100 },
      { skuSuffix: '1KG', size: '1kg', priceOffset: 600, stock: 100 }
    ]
  },
  {
    name: 'Jasmine Shape Plastic Flower Separators',
    slug: 'jasmine-shape-plastic-flower-separators',
    categorySlug: 'plastic-flower-parts',
    basePrice: 200,
    shortDescription: '6-petal jasmine shape plastic flower separators for crafts.',
    description: 'Elegant six-petal jasmine shape plastic flower separators. Perfect backing shapes for recreating jasmine and bud garland patterns.',
    tags: ['Plastic', 'Separators', 'Jasmine', 'Garland', 'Spacer', 'DIY', 'Craft'],
    seoTitle: 'Jasmine Shape Plastic Garland Separators | Me Nestham',
    seoDescription: 'Six-petal jasmine design plastic separators for traditional Indian garlands. Buy online in 250g, 500g, and 1kg packs.',
    seoKeywords: 'jasmine separators, six-petal jasmine, plastic spacer, jasmine garland parts',
    featured: false,
    bestseller: false,
    crops: [
      { page: 15, x: 640, y: 500, w: 220, h: 220, isFeatured: true, label: 'main' }
    ],
    variants: [
      { skuSuffix: '250G', size: '250 grams', priceOffset: 0, stock: 100 },
      { skuSuffix: '500G', size: '500 grams', priceOffset: 200, stock: 100 },
      { skuSuffix: '1KG', size: '1kg', priceOffset: 600, stock: 100 }
    ]
  },
  {
    name: 'Kit Cotton Garland Thread No. 10',
    slug: 'kit-cotton-garland-thread-no-10',
    categorySlug: 'threads',
    basePrice: 30,
    shortDescription: 'Heavy duty white cotton garland making thread No. 10.',
    description: 'Premium cotton garland making thread (No. 10 size). Strong, smooth, and highly break-resistant. Trusted by professional garland makers across India.',
    tags: ['Threads', 'Cotton', 'Garland', 'Strength', 'DIY', 'Craft', 'Garland Making'],
    seoTitle: 'Kit Cotton Garland Thread No. 10 (1 Roll) | Me Nestham',
    seoDescription: 'Buy strong, break-resistant No. 10 white cotton thread for garland making. Best quality for heavy festive garlands. Only ₹30 per roll.',
    seoKeywords: 'garland thread, cotton thread, thread roll, no 10 thread, heavy duty thread',
    featured: false,
    bestseller: false,
    crops: [
      { page: 16, x: 200, y: 150, w: 800, h: 1100, isFeatured: true, label: 'main' }
    ]
  }
];
