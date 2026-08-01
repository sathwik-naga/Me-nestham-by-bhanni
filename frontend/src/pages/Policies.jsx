import React from "react";
import { useParams, Link } from "react-router-dom";

export default function Policies() {
  const { policyType } = useParams();

  const getPolicyContent = () => {
    switch (policyType) {
      case "shipping":
        return {
          title: "Shipping & Delivery Policy",
          lastUpdated: "August 1, 2026",
          content: (
            <div className="flex flex-col gap-6 text-brand-text text-xs md:text-sm leading-relaxed">
              <div>
                <p className="font-semibold text-brand-text"><strong>Effective Date:</strong> August 1, 2026</p>
                <p className="font-semibold text-brand-text"><strong>Last Updated:</strong> August 1, 2026</p>
              </div>

              <div>
                <p>Thank you for shopping with <strong>Me Nestham By Bhanni</strong>. We are committed to delivering your orders safely and as quickly as possible. Please read this Shipping Policy carefully before placing an order.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">1. Order Processing</h3>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>Orders are processed after successful payment confirmation.</li>
                  <li>Orders are typically processed within <strong>1–3 business days</strong>.</li>
                  <li>Orders are not processed on Sundays or public holidays.</li>
                  <li>During sales, festivals, or periods of high demand, processing times may be longer.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">2. Shipping</h3>
                <p className="mb-2">We currently ship across <strong>India</strong> through trusted courier partners.</p>
                <p>Shipping charges, if applicable, will be displayed during checkout before you complete your purchase.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">3. Estimated Delivery Time</h3>
                <p className="mb-2">Estimated delivery times are:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li><strong>Metro Cities:</strong> 2–5 business days</li>
                  <li><strong>Other Cities &amp; Towns:</strong> 3–7 business days</li>
                  <li><strong>Remote Locations:</strong> 5–10 business days</li>
                </ul>
                <p className="mt-2 text-brand-text-muted text-[11px]">These are estimated delivery times and may vary depending on courier operations, weather conditions, public holidays, or other circumstances beyond our control.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">4. Order Tracking</h3>
                <p>Once your order has been shipped, you will receive tracking details via email, SMS, or WhatsApp (where available), allowing you to monitor the delivery status of your package.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">5. Delivery Attempts</h3>
                <p className="mb-2">Our courier partners may make multiple delivery attempts. If delivery cannot be completed due to an incorrect address, repeated unavailability, or refusal to accept the package, the order may be returned to us.</p>
                <p>Additional shipping charges may apply if re-delivery is requested.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">6. Incorrect Shipping Information</h3>
                <p className="mb-2">Customers are responsible for providing accurate shipping information.</p>
                <p>We are not responsible for delays or failed deliveries resulting from incorrect or incomplete addresses, incorrect phone numbers, or other inaccurate information provided during checkout.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">7. Damaged or Lost Shipments</h3>
                <p className="mb-2">If your package arrives visibly damaged or appears to be lost during transit, please contact us within <strong>48 hours</strong> of the expected delivery date with your order details and supporting photographs (if applicable).</p>
                <p>Reporting a damaged or lost shipment allows us to investigate the issue with the courier partner. Any resolution will be determined after verification and in accordance with applicable law.</p>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-2xl">
                <h3 className="font-serif text-base font-bold text-amber-600 mb-2">8. No Return, No Refund, and No Exchange Policy</h3>
                <p className="font-bold text-brand-text uppercase tracking-wider mb-2">All sales are final.</p>
                <p className="mb-2">Due to the nature of our products, <strong>Me Nestham By Bhanni does not accept returns, refunds, or exchanges</strong> once an order has been placed and shipped.</p>
                <p className="mb-2 text-brand-text font-semibold">Products that are damaged due to misuse, improper handling, or normal wear and tear after delivery are not eligible for replacement, return, or refund.</p>
                <p className="mb-2">Please review your order carefully before completing your purchase, including:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1 text-brand-text">
                  <li>Product selection</li>
                  <li>Quantity</li>
                  <li>Size or variant (if applicable)</li>
                  <li>Shipping address</li>
                  <li>Contact information</li>
                </ul>
                <p className="mt-2">Orders cannot be cancelled after they have been processed or dispatched. This policy does not affect any statutory rights you may have under applicable consumer protection laws.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">9. Delays Beyond Our Control</h3>
                <p className="mb-2">We are not responsible for delivery delays caused by natural disasters, severe weather conditions, public holidays, government restrictions, transportation disruptions, courier service delays, or force majeure events.</p>
                <p>We appreciate your patience in such situations.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">10. Contact Us</h3>
                <p className="mb-2">If you have any questions regarding shipping or your order, please contact us:</p>
                <div className="p-4 bg-brand-secondary/60 border border-brand-border rounded-2xl flex flex-col gap-1">
                  <p><strong>Business Name:</strong> Me Nestham By Bhanni</p>
                  <p><strong>Email:</strong> <a href="mailto:funnycolours123@gmail.com" className="text-brand-primary font-bold hover:underline">funnycolours123@gmail.com</a></p>
                </div>
                <p className="mt-2">We will make reasonable efforts to assist you with shipping-related inquiries.</p>
              </div>
            </div>
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
          title: "Terms & Conditions",
          lastUpdated: "August 1, 2026",
          content: (
            <div className="flex flex-col gap-6 text-brand-text text-xs md:text-sm leading-relaxed">
              <div>
                <p className="font-semibold text-brand-text"><strong>Effective Date:</strong> August 1, 2026</p>
                <p className="font-semibold text-brand-text"><strong>Last Updated:</strong> August 1, 2026</p>
              </div>

              <div>
                <p>Welcome to <strong>Me Nestham By Bhanni</strong> ("Company," "we," "our," or "us"). These Terms & Conditions ("Terms") govern your access to and use of our website, products, and services.</p>
                <p className="mt-2">By accessing or using our website, creating an account, or placing an order, you agree to be bound by these Terms. If you do not agree, please do not use our website.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">1. Eligibility</h3>
                <p className="mb-2">To use our website, you must:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>Be at least 18 years old or use the website under the supervision of a parent or legal guardian.</li>
                  <li>Provide accurate and complete information when creating an account or placing an order.</li>
                  <li>Comply with all applicable laws and regulations.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">2. Account Registration</h3>
                <p className="mb-2">You may create an account to access certain features. You agree to:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>Keep your login credentials confidential.</li>
                  <li>Be responsible for all activities under your account.</li>
                  <li>Notify us immediately of any unauthorized access or suspected security breach.</li>
                  <li>Ensure your account information remains accurate and up to date.</li>
                </ul>
                <p className="mt-2">We reserve the right to suspend or terminate accounts that violate these Terms.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">3. Products</h3>
                <p className="mb-2">We make reasonable efforts to ensure that product descriptions, images, specifications, pricing, and availability are accurate. However:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>Product colors may vary depending on your device display.</li>
                  <li>Handmade or decorative products may have slight natural art variations.</li>
                  <li>Product availability may change without prior notice.</li>
                  <li>We reserve the right to discontinue products at any time.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">4. Pricing</h3>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>All prices are displayed in Indian Rupees (INR).</li>
                  <li>Prices are subject to change without prior notice.</li>
                  <li>Applicable taxes will be included or displayed during checkout, where required.</li>
                  <li>Pricing errors may be corrected even after an order is placed. If an error affects your order, you will be notified and offered the option to proceed with the corrected price or cancel the order.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">5. Orders</h3>
                <p className="mb-2">After placing an order, you will receive an order confirmation. Order acceptance occurs only after we verify payment and confirm product availability.</p>
                <p className="mb-2">We reserve the right to:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>Cancel fraudulent or suspicious orders.</li>
                  <li>Refuse orders that violate these Terms.</li>
                  <li>Limit purchase quantities.</li>
                  <li>Cancel orders due to pricing, inventory, or technical errors.</li>
                </ul>
                <p className="mt-2">If an order is cancelled after payment, any eligible refund will be processed through the original payment method.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">6. Payments</h3>
                <p className="mb-2">Payments are processed through secure third-party payment providers. We do not store your credit or debit card details, CVV, UPI PIN, or net banking credentials.</p>
                <p>Payment processing is subject to the terms and policies of the respective payment provider.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">7. Shipping and Delivery</h3>
                <p className="mb-2">Shipping timelines are estimates and may vary depending on delivery location, courier availability, public holidays, weather conditions, or unforeseen circumstances.</p>
                <p>Risk of loss transfers to the customer upon successful delivery to the shipping address provided during checkout.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">8. Returns, Refunds, and Cancellations</h3>
                <p className="mb-2">Please refer to our separate Published Policies for complete details. Where permitted:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>Return and cancellation requests must follow the published policy.</li>
                  <li>Refunds, if approved, will be processed to the original payment method.</li>
                  <li>Certain products may not be eligible for return due to their nature.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">9. User Responsibilities</h3>
                <p className="mb-2">You agree not to:</p>
                <ul className="list-disc pl-5 flex flex-col gap-1">
                  <li>Use the website for unlawful purposes.</li>
                  <li>Attempt unauthorized access to our systems.</li>
                  <li>Upload malicious software or harmful code.</li>
                  <li>Interfere with website functionality.</li>
                  <li>Copy, reproduce, or misuse website content without permission.</li>
                  <li>Engage in fraudulent or deceptive activities.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">10. Intellectual Property</h3>
                <p className="mb-2">All content on this website—including logos, product images, graphics, text, website design, icons, branding, and source content—is owned by or licensed to <strong>Me Nestham By Bhanni</strong> and is protected by applicable intellectual property laws.</p>
                <p>No content may be copied, reproduced, distributed, or used without prior written permission.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">11. Limitation of Liability</h3>
                <p className="mb-2">To the maximum extent permitted by law, <strong>Me Nestham By Bhanni</strong> shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from use or inability to use the website, product delays, service interruptions, technical issues, third-party services, or unauthorized access to user accounts.</p>
                <p>Our total liability shall not exceed the amount paid for the applicable order giving rise to the claim, except where prohibited by law.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">12. Third-Party Services</h3>
                <p>Our website may integrate with third-party providers for services such as payment processing, authentication, shipping and logistics, cloud hosting, and analytics. These services are governed by their own terms and privacy policies.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">13. Privacy</h3>
                <p>Your use of our website is also governed by our <Link to="/policies/privacy" className="text-brand-primary font-bold hover:underline">Privacy Policy</Link>, which explains how we collect, use, store, and protect your personal information.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">14. Termination</h3>
                <p>We reserve the right to suspend or terminate access to the website without prior notice if these Terms are violated, fraudulent activity is suspected, required by law, or necessary to protect our business, customers, or systems.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">15. Force Majeure</h3>
                <p>We shall not be liable for delays or failures caused by events beyond our reasonable control, including but not limited to natural disasters, pandemics, strikes, internet outages, government actions, or other unforeseen circumstances.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">16. Governing Law and Jurisdiction</h3>
                <p className="mb-2">These Terms shall be governed by and interpreted in accordance with the laws of <strong>India</strong>.</p>
                <p>Any disputes arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Andhra Pradesh, India</strong>, unless otherwise required by applicable law.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">17. Changes to These Terms</h3>
                <p>We may update these Terms from time to time to reflect changes in our business, legal requirements, or services.</p>
                <p className="mt-2">The updated version will be posted on this page with a revised <strong>Last Updated</strong> date. Continued use of the website after changes become effective constitutes acceptance of the revised Terms.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">18. Contact Information</h3>
                <p className="mb-2">For questions regarding these Terms & Conditions, please contact:</p>
                <div className="p-4 bg-brand-secondary/60 border border-brand-border rounded-2xl flex flex-col gap-1">
                  <p><strong>Business Name:</strong> Me Nestham By Bhanni</p>
                  <p><strong>Email:</strong> <a href="mailto:funnycolours123@gmail.com" className="text-brand-primary font-bold hover:underline">funnycolours123@gmail.com</a></p>
                </div>
                <p className="mt-2">We will make reasonable efforts to respond to your inquiries promptly.</p>
              </div>

              <div>
                <h3 className="font-serif text-base font-bold text-brand-text mb-2">19. Entire Agreement</h3>
                <p>These Terms & Conditions, together with our Privacy Policy, Shipping Policy, and Refund & Cancellation Policy, constitute the entire agreement between you and <strong>Me Nestham By Bhanni</strong> regarding your use of the website and supersede any prior understandings relating to the same.</p>
              </div>
            </div>
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
