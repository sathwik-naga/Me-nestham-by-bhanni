/**
 * Catalog Seed Definitions
 * All previous test/mock products and categories have been cleared as part of the clean catalog reset.
 * Replacement catalog data will be dynamically loaded from Supabase.
 */

export const mockCategories = [];

export const mockProducts = [];

export const mockCoupons = [];

export const mockFAQs = [
  {
    id: "faq-1",
    category: "orders",
    question: "How do I trace my order status?",
    answer: "Once your order is placed successfully, you will receive a confirmation email with your order ID. You can go to the 'My Orders' section in your Profile page, select the specific order, and click 'Track Order' to see a real-time progress tracker. You can also visit `/orders/:orderId/track` directly."
  },
  {
    id: "faq-2",
    category: "shipping",
    question: "Do you ship internationally?",
    answer: "Currently, Me Nestham By Bhanni only ships within India. Standard shipping takes 3-5 business days, and express shipping takes 1-2 business days depending on your location."
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
