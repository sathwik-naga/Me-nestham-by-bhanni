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

      case "privacy":
        return {
          title: "Privacy Policy",
          lastUpdated: "August 1, 2026",
          content: (
            <div className="flex flex-col gap-6 text-brand-text text-xs md:text-sm leading-relaxed">
              <div>
                <p className="font-semibold text-brand-text"><strong>Effective Date:</strong> August 1, 2026</p>
                <p className="font-semibold text-brand-text"><strong>Last Updated:</strong> August 1, 2026</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">1. Introduction</h3>
                <p>Welcome to <strong>Me Nestham By Bhanni</strong> ("we," "our," or "us"). We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, store, and safeguard your information when you visit our website, create an account, or purchase our products.</p>
                <p className="mt-2">By using our website, you agree to the practices described in this Privacy Policy.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">2. Information We Collect</h3>
                <p className="mb-2">We may collect the following categories of information:</p>
                
                <h4 className="font-bold text-brand-text mt-3 mb-1">Personal Information</h4>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>Full Name</li>
                  <li>Email Address</li>
                  <li>Phone Number</li>
                  <li>Shipping Address</li>
                  <li>Billing Address</li>
                  <li>Order History</li>
                  <li>Account Credentials (encrypted authentication)</li>
                  <li>Customer Support Messages</li>
                </ul>

                <h4 className="font-bold text-brand-text mt-4 mb-1">Payment Information</h4>
                <p>Payments are securely processed through trusted third-party payment providers. We <strong>do not store</strong> your debit card, credit card, UPI PIN, CVV, or banking credentials on our servers.</p>

                <h4 className="font-bold text-brand-text mt-4 mb-1">Technical Information</h4>
                <p className="mb-2">When you use our website, we may automatically collect:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>IP Address</li>
                  <li>Browser Type</li>
                  <li>Device Information</li>
                  <li>Operating System</li>
                  <li>Pages Visited</li>
                  <li>Time Spent on Pages</li>
                  <li>Referring Website</li>
                  <li>Cookies and Similar Technologies</li>
                </ul>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">3. How We Use Your Information</h3>
                <p className="mb-2">We use your information to:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>Process and fulfill orders</li>
                  <li>Deliver purchased products</li>
                  <li>Verify payments</li>
                  <li>Create and manage your account</li>
                  <li>Provide customer support</li>
                  <li>Send order confirmations and shipping updates</li>
                  <li>Improve our products and services</li>
                  <li>Prevent fraud and unauthorized activity</li>
                  <li>Comply with applicable legal obligations</li>
                  <li>Respond to customer inquiries</li>
                  <li>Analyze website performance</li>
                </ul>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">4. Cookies and Tracking Technologies</h3>
                <p className="mb-2">We use cookies and similar technologies to:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>Keep you signed in</li>
                  <li>Remember your preferences</li>
                  <li>Improve website performance</li>
                  <li>Measure website traffic</li>
                  <li>Enhance user experience</li>
                </ul>
                <p className="mt-2">You may disable cookies through your browser settings; however, some website features may not function properly.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">5. How We Share Your Information</h3>
                <p className="mb-2">We do <strong>not sell</strong> your personal information.</p>
                <p className="mb-2">We may share information only with trusted service providers when necessary, including:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>Payment gateway providers</li>
                  <li>Shipping and logistics partners</li>
                  <li>Cloud hosting providers</li>
                  <li>Authentication providers</li>
                  <li>Customer support tools</li>
                  <li>Government or legal authorities when required by law</li>
                </ul>
                <p className="mt-2">These providers receive only the information necessary to perform their services.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">6. Data Security</h3>
                <p className="mb-2">We implement reasonable administrative, technical, and organizational safeguards to protect your information, including:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>HTTPS encryption</li>
                  <li>Secure authentication</li>
                  <li>Encrypted data transmission</li>
                  <li>Access controls</li>
                  <li>Regular security monitoring</li>
                </ul>
                <p className="mt-2">While we strive to protect your information, no online service can guarantee absolute security.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">7. Data Retention</h3>
                <p className="mb-2">We retain personal information only for as long as necessary to:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>Complete your orders</li>
                  <li>Maintain your account</li>
                  <li>Meet legal and tax obligations</li>
                  <li>Resolve disputes</li>
                  <li>Enforce our agreements</li>
                </ul>
                <p className="mt-2">When data is no longer required, it is securely deleted or anonymized where appropriate.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">8. Your Privacy Rights</h3>
                <p className="mb-2">Depending on applicable law, you may have the right to:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your data</li>
                  <li>Withdraw consent where applicable</li>
                  <li>Object to certain processing activities</li>
                  <li>Request a copy of your personal information</li>
                  <li>Close your account</li>
                </ul>
                <p className="mt-2">To exercise these rights, contact us using the details below.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">9. Children's Privacy</h3>
                <p>Our website is not intended for children under the age of 18. We do not knowingly collect personal information from children. If we become aware that such information has been collected, we will take appropriate steps to remove it.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">10. Third-Party Services & Authentication Providers</h3>
                <p>Our website integrates with trusted third-party service providers for payment processing, authentication, hosting, analytics, and logistics:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1 mt-2">
                  <li><strong>Authentication:</strong> Users may sign in using Google OAuth or Email/Password handled securely via Supabase Auth.</li>
                  <li><strong>Analytics:</strong> We use Google Analytics and performance monitoring tools to measure traffic and optimize website usability.</li>
                  <li><strong>Payment Gateways:</strong> Payments are processed via PCI-DSS compliant providers (e.g. Razorpay).</li>
                </ul>
                <p className="mt-2">These third-party providers have their own independent privacy policies, and we encourage you to review them.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">11. Email Communications & Marketing Choices</h3>
                <p className="mb-2"><strong>Transactional Communications:</strong> Essential order confirmations, shipping updates, password reset links, and 2FA verification codes are sent regardless of your marketing preferences to ensure order fulfillment and account security.</p>
                <p><strong>Marketing Communications:</strong> If you receive promotional emails or newsletters, you may opt out at any time by clicking the "Unsubscribe" link in the email or by contacting us.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">12. Data Breach Response</h3>
                <p>We maintain technical security controls to prevent data loss. In the unlikely event of a qualifying security incident or data breach that affects your personal information, we will notify affected users and relevant authorities where required by applicable law in a timely manner.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">13. User Account Deletion & Data Retention</h3>
                <p>You may request the permanent deletion of your user account and personal data at any time by submitting a request to <a href="mailto:funnycolours123@gmail.com" className="text-brand-primary font-bold hover:underline">funnycolours123@gmail.com</a>. Upon verification, your account profile and credentials will be removed. Please note that certain order history and financial transaction records must be retained for mandatory statutory tax and accounting retention periods as required by Indian tax laws.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">14. Business Transfers</h3>
                <p>In the event that <strong>Me Nestham By Bhanni</strong> undergoes a merger, acquisition, reorganization, bankruptcy, or sale of company assets, customer personal information may be transferred as part of the business transaction to the acquiring entity, subject to the commitments made in this Privacy Policy.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">15. International Data Transfers</h3>
                <p>Your information may be processed or stored using secure cloud infrastructure located in different jurisdictions. We take reasonable steps to ensure appropriate technical safeguards are in place for such transfers.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">16. Legal Compliance & Governing Law</h3>
                <p className="mb-2">This Privacy Policy is governed by and construed in accordance with the <strong>laws of India</strong>.</p>
                <p>We may disclose personal information when required to comply with applicable statutory laws, law enforcement warrants, or court orders in India.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">17. Changes to This Privacy Policy</h3>
                <p>We may update this Privacy Policy from time to time to reflect changes in our business, technology, legal requirements, or services.</p>
                <p className="mt-2">When significant changes are made, the updated policy will be posted on this page with a revised <strong>Last Updated</strong> date. Continued use of our website after changes become effective constitutes acceptance of the revised policy.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">18. Contact Us</h3>
                <p className="mb-2">If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us:</p>
                <div className="p-4 bg-brand-secondary/60 border border-brand-border rounded-2xl flex flex-col gap-1">
                  <p><strong>Business Name:</strong> Me Nestham By Bhanni</p>
                  <p><strong>Email:</strong> <a href="mailto:funnycolours123@gmail.com" className="text-brand-primary font-bold hover:underline">funnycolours123@gmail.com</a></p>
                </div>
                <p className="mt-2">We will make reasonable efforts to respond to privacy-related requests in a timely manner.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">19. Consent</h3>
                <p>By accessing or using our website, creating an account, or placing an order, you acknowledge that you have read, understood, and agreed to this Privacy Policy.</p>
              </div>
            </div>
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
            { slug: "privacy", label: "Privacy Policy" },
            { slug: "terms", label: "Terms & Conditions" }
          ].map((doc) => (
            <Link
              key={doc.slug}
              to={`/policies/${doc.slug}`}
              className={`px-4 py-3.5 rounded-xl text-xs font-semibold transition-all ${
                policyType === doc.slug 
                  ? "bg-brand-primary text-white shadow-sm font-bold" 
                  : "text-brand-text hover:bg-brand-secondary"
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
