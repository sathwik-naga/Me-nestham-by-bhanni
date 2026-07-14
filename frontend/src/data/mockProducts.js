// Rich mock data seed for Me Nestham By Bhanni e-commerce web application.
// Contains premium products with variants, images, categories, reviews, coupons and FAQs.

export const mockCategories = [
  {
    id: "cat-1",
    name: "Handcrafted Jewelry",
    slug: "jewelry",
    description: "Elegant, artisan-crafted sterling silver, brass, and terracotta jewelry reflecting Indian heritage.",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80",
    productCount: 42
  },
  {
    id: "cat-2",
    name: "Artisanal Home Decor",
    slug: "home-decor",
    description: "Hand-painted pottery, brass lamps, and handcrafted wooden artifacts to warm up your living space.",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80",
    productCount: 35
  },
  {
    id: "cat-3",
    name: "Heritage Apparel",
    slug: "apparel",
    description: "Pure cotton hand-block print sarees, kurtas, and stoles crafted by master weavers.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
    productCount: 28
  },
  {
    id: "cat-4",
    name: "Traditional Fine Art",
    slug: "art",
    description: "Authentic Madhubani, Pattachitra, and Tanjore paintings handmade by certified national artisans.",
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80",
    productCount: 15
  }
];

export const mockProducts = [
  {
    id: "prod-1",
    name: "Handcrafted Terracotta Diya Set",
    slug: "handcrafted-terracotta-diyas",
    category: "home-decor",
    shortDescription: "A set of 6 traditional hand-carved organic terracotta clay diyas, perfect for festive celebrations.",
    description: "These organic clay diyas are hand-molded by local artisans in Telangana using high-density alluvial soil. They feature intricate leaf patterns and are baked in traditional wood-fired kilns. Ready to use with cotton wicks and oil/ghee, they hold up to 30ml of oil for long-lasting, smoke-free illumination.",
    price: 849,
    compareAtPrice: 1200,
    rating: 4.8,
    reviewCount: 34,
    images: [
      "https://images.unsplash.com/photo-1605886300898-1e42f9e4bd33?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=600&q=80"
    ],
    inStock: true,
    stockCount: 12,
    isNew: true,
    isBestseller: true,
    variants: [
      { id: "v1-1", type: "Color", name: "Natural Terracotta", price: 849, stock: 8 },
      { id: "v1-2", type: "Color", name: "Glazed Gold", price: 999, stock: 4 }
    ],
    specs: {
      "Material": "100% Organic Clay",
      "Set Count": "6 Diyas",
      "Dimensions": "3\" diameter x 1.5\" height",
      "Burning Capacity": "Approx. 4 hours per fill",
      "Origin": "Telangana, India"
    },
    reviews: [
      {
        id: "rev-1-1",
        userName: "Priya Sharma",
        userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        rating: 5,
        date: "2026-07-01",
        verified: true,
        comment: "Absolutely beautiful! They look stunning and burn for a really long time without absorbing too much oil. The packaging was also very safe."
      },
      {
        id: "rev-1-2",
        userName: "Karthik R.",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        rating: 4,
        date: "2026-06-20",
        verified: true,
        comment: "Very elegant traditional look. One of the diyas had a minor scratch, but nothing noticeable. Highly recommend for Diwali."
      }
    ]
  },
  {
    id: "prod-2",
    name: "Sterling Silver Jhumka Earrings",
    slug: "silver-jhumkas",
    category: "jewelry",
    shortDescription: "Delicate temple-style sterling silver filigree jhumkas adorned with natural ruby beads.",
    description: "Handcrafted in 92.5 sterling silver, these exquisite jhumka earrings showcase delicate filigree wirework. The dome features miniature floral motifs, while the bottom is fringed with natural ruby beads that sway gracefully. Coated with an antique oxidization layer to enhance the intricate details, they are lightweight and perfect for traditional occasions.",
    price: 1899,
    compareAtPrice: 2500,
    rating: 4.9,
    reviewCount: 45,
    images: [
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80"
    ],
    inStock: true,
    stockCount: 8,
    isNew: false,
    isBestseller: true,
    variants: [
      { id: "v2-1", type: "Gemstone", name: "Natural Ruby", price: 1899, stock: 5 },
      { id: "v2-2", type: "Gemstone", name: "Green Emerald", price: 1999, stock: 3 }
    ],
    specs: {
      "Metal Purity": "92.5% Sterling Silver",
      "Gemstone": "Natural Ruby Beads",
      "Weight": "14 grams (pair)",
      "Height": "2.1 inches",
      "Closure Type": "Push Back",
      "Origin": "Jaipur, Rajasthan"
    },
    reviews: [
      {
        id: "rev-2-1",
        userName: "Anjali Mehta",
        userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
        rating: 5,
        date: "2026-07-05",
        verified: true,
        comment: "Stunning craftsmanship! They look expensive and feel very authentic. They are comfortable to wear for long hours. Got so many compliments!"
      }
    ]
  },
  {
    id: "prod-3",
    name: "Hand-Block Print Indigo Cotton Saree",
    slug: "indigo-cotton-saree",
    category: "apparel",
    shortDescription: "Premium mulmul cotton saree hand-printed in organic indigo dyes by Dabu artisans.",
    description: "Woven in high-quality, breathable mulmul cotton, this saree is hand-blocked printed in traditional floral bootis using mud-resist Dabu printing and natural fermentation indigo vats. It comes with an unstitched running blouse piece. The fabric is extremely soft, light, and flows beautifully.",
    price: 2450,
    compareAtPrice: 3800,
    rating: 4.7,
    reviewCount: 22,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80"
    ],
    inStock: true,
    stockCount: 5,
    isNew: true,
    isBestseller: false,
    variants: [
      { id: "v3-1", type: "Fabric", name: "Mulmul Cotton", price: 2450, stock: 3 },
      { id: "v3-2", type: "Fabric", name: "Chanderi Silk Blend", price: 3499, stock: 2 }
    ],
    specs: {
      "Fabric Type": "100% Mulmul Cotton",
      "Saree Length": "5.5 meters",
      "Blouse Piece": "80 cm (Included)",
      "Dyeing Technique": "Hand-block Dabu Resist print with natural indigo",
      "Care Instructions": "Dry clean recommended for first wash, then gentle hand wash separately in cold water."
    },
    reviews: [
      {
        id: "rev-3-1",
        userName: "Saritha Rao",
        userAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
        rating: 5,
        date: "2026-06-25",
        verified: true,
        comment: "Incredibly soft saree. The blue is deep and has that authentic earthy smell of natural indigo. Very satisfied."
      }
    ]
  },
  {
    id: "prod-4",
    name: "Authentic Madhubani Tree of Life Painting",
    slug: "madhubani-tree-of-life",
    category: "art",
    shortDescription: "A beautiful handmade Madhubani painting showing the Tree of Life on handmade paper using natural dyes.",
    description: "An authentic Madhubani (Mithila) artwork created by a state-award-winning artisan using hand-ground natural dyes extracted from leaves, flowers, and tree bark. Drawn on handmade canvas paper using fine bamboo nib pens, it portrays the 'Tree of Life' with birds and forest elements, symbolizing prosperity and growth. Each stroke is hand-painted and unique.",
    price: 3899,
    compareAtPrice: 5500,
    rating: 5.0,
    reviewCount: 12,
    images: [
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=600&q=80"
    ],
    inStock: true,
    stockCount: 3,
    isNew: false,
    isBestseller: true,
    variants: [
      { id: "v4-1", type: "Size", name: "12\" x 18\" (Framed)", price: 3899, stock: 2 },
      { id: "v4-2", type: "Size", name: "18\" x 24\" (Framed)", price: 5499, stock: 1 }
    ],
    specs: {
      "Theme": "Tree of Life (Mithila Art)",
      "Medium": "Natural Dyes & Poster colors on handmade paper",
      "Framing": "Comes with a premium textured black composite frame and acrylic safety glass",
      "Artist Signature": "Yes, signed by master artisan",
      "Dimensions": "12\" W x 18\" H"
    },
    reviews: [
      {
        id: "rev-4-1",
        userName: "Vikram Sen",
        userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
        rating: 5,
        date: "2026-07-02",
        verified: true,
        comment: "A masterpiece! The details are mind-blowing. It came framed beautifully and serves as the centerpiece of my living room. Worth every rupee."
      }
    ]
  },
  {
    id: "prod-5",
    name: "Hand-Carved Brass Ganesha Idol",
    slug: "brass-ganesha-idol",
    category: "home-decor",
    shortDescription: "Premium solid brass Ganesha idol with antique finish, hand-finished by master metalworkers.",
    description: "Welcome positive energy into your home with this magnificent Ganesha idol. Sand-cast in solid brass and hand-finished with an antique yellow oxide wash, it depicts Ganesha seated on a lotus pedestal holding his traditional attributes. Features highly defined details from the crown to the modak in his hand.",
    price: 1599,
    compareAtPrice: 2200,
    rating: 4.6,
    reviewCount: 18,
    images: [
      "https://images.unsplash.com/photo-1609137144814-1d37df65ee1a?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&q=80"
    ],
    inStock: true,
    stockCount: 6,
    isNew: false,
    isBestseller: false,
    variants: [
      { id: "v5-1", type: "Finish", name: "Antique Yellow Brass", price: 1599, stock: 4 },
      { id: "v5-2", type: "Finish", name: "Verdigris Patina", price: 1799, stock: 2 }
    ],
    specs: {
      "Material": "Solid Sand-cast Brass",
      "Weight": "1.2 Kilograms",
      "Dimensions": "4.5\" width x 6\" height",
      "Care": "Clean with a dry cotton cloth. Do not use harsh chemicals."
    },
    reviews: [
      {
        id: "rev-5-1",
        userName: "Meera Nair",
        userAvatar: "https://images.unsplash.com/photo-1594744803329-e58b31de215f?auto=format&fit=crop&w=150&q=80",
        rating: 4,
        date: "2026-06-18",
        verified: true,
        comment: "Very heavy and beautifully cast. The facial details of Ganesha are very peaceful and well done. Good purchase."
      }
    ]
  },
  {
    id: "prod-6",
    name: "Gold-Plated Kundan Choker Set",
    slug: "kundan-choker-set",
    category: "jewelry",
    shortDescription: "22k gold plated bridal Kundan choker necklace with matching earrings and drop pearls.",
    description: "An elegant, traditional wedding choker set featuring hand-set Kundan stones (glass in foil setting) on a 22k gold-plated brass base. Embellished with small seed pearls and emerald-green enamel backings. The necklace features an adjustable drawstring (dori) to fit all neck sizes comfortably.",
    price: 3499,
    compareAtPrice: 5000,
    rating: 4.8,
    reviewCount: 29,
    images: [
      "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80"
    ],
    inStock: false,
    stockCount: 0,
    isNew: false,
    isBestseller: true,
    variants: [
      { id: "v6-1", type: "Gemstone Accent", name: "Green Emerald Beads", price: 3499, stock: 0 },
      { id: "v6-2", type: "Gemstone Accent", name: "Maroon Ruby Beads", price: 3499, stock: 0 }
    ],
    specs: {
      "Base Metal": "Brass",
      "Plating": "22k Yellow Gold Electroplated",
      "Stone Type": "Synthetic Kundan & Faux Pearls",
      "Set Includes": "1 Choker Necklace, 1 Pair of Earrings",
      "Origin": "Hyderabad, Telangana"
    },
    reviews: []
  }
];

export const mockCoupons = [
  {
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    minOrderValue: 500,
    description: "Get 10% off on your first order. Minimum order of ₹500 required."
  },
  {
    code: "FESTIVE25",
    type: "percentage",
    value: 25,
    minOrderValue: 2000,
    description: "Celebrate the festive season with 25% off! Minimum purchase of ₹2000."
  },
  {
    code: "FREE500",
    type: "fixed",
    value: 500,
    minOrderValue: 3000,
    description: "Get a flat ₹500 off on order totals above ₹3000."
  }
];

export const mockFAQs = [
  {
    id: "faq-1",
    category: "orders",
    question: "How do I trace my order status?",
    answer: "Once your order is placed successfully, you will receive an confirmation email with your order ID. You can go to the 'My Orders' section in your Profile page, select the specific order, and click 'Track Order' to see a real-time progress tracker. You can also visit `/orders/:orderId/track` directly."
  },
  {
    id: "faq-2",
    category: "shipping",
    question: "Do you ship internationally?",
    answer: "Currently, Me Nestham By Bhanni only ships within India. Standard shipping takes 3-5 business days, and express shipping takes 1-2 business days depending on your location."
  },
  {
    id: "faq-3",
    category: "returns",
    question: "What is your return and refund policy?",
    answer: "We support a hassle-free 7-day return policy for unused products in their original packaging. Returns can be initiated from the customer dashboard under 'My Orders' settings. Once approved, reverse pick up is scheduled and the refund is credited to your bank account/source payment within 5-7 working days."
  },
  {
    id: "faq-4",
    category: "payments",
    question: "Is it safe to pay online with Razorpay?",
    answer: "Yes, we integrate with Razorpay, India's leading secure payment gateway. Your transaction details are fully encrypted and compliant with PCI-DSS security standards. We accept UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and major mobile wallets."
  },
  {
    id: "faq-5",
    category: "products",
    question: "Are these items genuinely handmade?",
    answer: "Absolutely. Me Nestham is dedicated to sustaining traditional craftsmanship. Every product listed in our Catalog is procured directly from rural artisan cooperatives, master craftspeople, and certified makers who practice legacy art forms. Minor variations in texture, color and printing are characteristic of their handcrafted authenticity."
  }
];
