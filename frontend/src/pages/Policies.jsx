import React from "react";
import { useParams, Link } from "react-router-dom";

export default function Policies() {
  const { policyType } = useParams();

  const getPolicyContent = () => {
    switch (policyType) {
      case "shipping":
        return {
          title: "Shipping & Delivery Policy",
          lastUpdated: "July 12, 2026",
          content: (
            <>
              <h3>1. Shipping Coverage</h3>
              <p>We ship nationwide across India. Currently, international dispatch services are not supported. All products are dispatched from our regional artisan cooperative warehouse hubs in Rajasthan, Telangana, and Jaipur.</p>
              <h3>2. Timelines and Schedules</h3>
              <p>Standard delivery timelines range between 3 to 5 business days for metropolitan regions, and up to 7 business days for remote pin codes. Express shipments are delivered in 1-2 business days.</p>
              <h3>3. Carrier Fees</h3>
              <p>Shipping is free for all order sub-totals exceeding ₹499. Orders below ₹499 carry a flat delivery convenience surcharge of ₹99. Express delivery options, when requested, carry a flat ₹150 surcharge.</p>
            </>
          )
        };
      case "returns":
        return {
          title: "Return &amp; Exchange Policy",
          lastUpdated: "July 12, 2026",
          content: (
            <>
              <h3>1. Return Window</h3>
              <p>We support a 7-day hassle-free return window for all unused items. Products must be returned in their original packaging with invoice tags intact.</p>
              <h3>2. Exclusions</h3>
              <p>Certain product categories such as customized paintings, custom sized apparel, and personal earrings/ornaments cannot be returned due to hygiene and custom craftsmanship rules.</p>
              <h3>3. Refund Schedule</h3>
              <p>Once reverse pickup is completed and quality checks pass at our center, refunds are processed back to your original source channel (UPI, Card, Wallet) within 5-7 working days.</p>
            </>
          )
        };
      case "privacy":
        return {
          title: "Privacy Policy",
          lastUpdated: "July 12, 2026",
          content: (
            <>
              <h3>1. Data We Collect</h3>
              <p>We collect basic billing names, contact numbers, email addresses, and shipping details to process orders, verify payments, and ship packages.</p>
              <h3>2. Data Security</h3>
              <p>Financial details, passwords, and transaction values are encrypted using secure PCI-DSS standards via Razorpay gateway tunnels. We never store credit/debit card numbers on our local databases.</p>
              <h3>3. Cookies</h3>
              <p>We use session cookies to remember shopping cart items, wishlist saves, and active profile logins.</p>
            </>
          )
        };
      case "terms":
        return {
          title: "Terms &amp; Conditions",
          lastUpdated: "July 12, 2026",
          content: (
            <>
              <h3>1. User Accounts</h3>
              <p>By creating an account on Me Nestham, you agree to provide truthful account names, contact numbers, and maintain active password security.</p>
              <h3>2. Handcrafted Variations</h3>
              <p>Every product is handcrafted. Natural variations in textile block-prints, color gradients, and clay molding shapes are native characteristics of heritage art, not defects.</p>
              <h3>3. Pricing &amp; Payments</h3>
              <p>Prices listed are inclusive of standard local taxes. We reserve the right to cancel orders arising from typographical clerical pricing errors in our listing databases.</p>
            </>
          )
        };
      default:
        return {
          title: "Policy Documents",
          lastUpdated: "July 12, 2026",
          content: <p>Please choose a policy document from the navigation sidebar menu.</p>
        };
    }
  };

  const currentPolicy = getPolicyContent();

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 font-accent flex flex-col text-left">
      {/* Breadcrumb */}
      <div className="text-xs text-brand-text-muted mb-8">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-brand-primary font-semibold">Policies</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side policy links */}
        <div className="flex flex-col gap-1 border-r border-brand-border/60 pr-4">
          <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider block mb-3 pl-4">Policy Hub</span>
          {[
            { slug: "shipping", label: "Shipping Policy" },
            { slug: "returns", label: "Returns & Exchanges" },
            { slug: "privacy", label: "Privacy Policy" },
            { slug: "terms", label: "Terms & Conditions" }
          ].map((doc) => (
            <Link
              key={doc.slug}
              to={`/policies/${doc.slug}`}
              className={`px-4 py-3.5 rounded-xl text-xs font-semibold transition-all ${
                policyType === doc.slug 
                  ? "bg-brand-primary text-white shadow-sm font-bold" 
                  : "text-brand-text hover:bg-brand-secondary hover:dark:bg-[#25211E]"
              }`}
            >
              {doc.label}
            </Link>
          ))}
        </div>

        {/* Right Side policy text */}
        <div className="lg:col-span-3 bg-brand-card border border-brand-border rounded-3xl p-6 md:p-8 shadow-sm text-xs leading-relaxed text-brand-text-muted">
          <span className="text-[9px] uppercase font-bold text-brand-primary tracking-widest block mb-1">Me Nestham Legal</span>
          <h1 className="font-serif text-2xl font-bold text-brand-text mb-1 leading-snug">{currentPolicy.title}</h1>
          <p className="text-[9px] text-brand-text-muted font-mono mb-6 border-b pb-4">Last Updated: {currentPolicy.lastUpdated}</p>

          <div className="prose dark:prose-invert max-w-none flex flex-col gap-4 text-xs md:text-sm">
            {currentPolicy.content}
          </div>
        </div>
      </div>
    </div>
  );
}
