import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, Send, MessageCircle, Clock, Loader2 } from "lucide-react";
import { api, showToast } from "../services/api";
import SEO from "../components/SEO/SEO";
import { generateBreadcrumbSchema } from "../utils/seo";
import { trackLead, trackWhatsAppClick, trackPhoneClick, trackEmailClick } from "../services/analytics/analytics";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Order Issue",
    message: "",
    honeypot: ""
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const validateField = (name, value) => {
    let error = "";
    const cleanValue = value ? value.trim() : "";

    if (name === "name") {
      if (!cleanValue) {
        error = "Name is required";
      }
    } else if (name === "email") {
      if (!cleanValue) {
        error = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanValue)) {
        error = "Please enter a valid email address";
      }
    } else if (name === "phone") {
      const cleanPhone = value.replace(/^\+91/, "").replace(/[\s-]/g, "");
      if (!cleanPhone) {
        error = "Phone number is required";
      } else if (!/^\d{10}$/.test(cleanPhone)) {
        error = "Phone number must be 10 digits";
      }
    } else if (name === "subject") {
      if (!cleanValue) {
        error = "Subject is required";
      }
    } else if (name === "message") {
      if (!cleanValue) {
        error = "Message is required";
      } else if (cleanValue.length < 10) {
        error = "Message must be at least 10 characters";
      }
    }
    return error;
  };

  const validateForm = () => {
    const newErrors = {};
    const fields = ["name", "email", "phone", "subject", "message"];
    fields.forEach((field) => {
      const error = validateField(field, form[field]);
      if (error) {
        newErrors[field] = error;
      }
    });
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value)
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");

    const allTouched = {
      name: true,
      email: true,
      phone: true,
      subject: true,
      message: true
    };
    setTouched(allTouched);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast("Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/contact", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        honeypot: form.honeypot || ""
      });

      const successMsg = response?.message || "Thank you! Your message has been sent successfully.";
      setSuccess(successMsg);
      showToast(successMsg);
      trackLead("contact_page_form");

      // Reset form on success
      setForm({ name: "", email: "", phone: "", subject: "Order Issue", message: "", honeypot: "" });
      setErrors({});
      setTouched({});

      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });

      setTimeout(() => setSuccess(""), 6000);
    } catch (err) {
      const errorMsg = err?.message || "Failed to send message. Please try again later.";
      showToast(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Contact Us", url: "/contact" }
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 font-accent flex flex-col text-left">
      <SEO
        title="Contact Us &amp; Customer Support"
        description="Get in touch with Me Nestham by Bhanni customer support via email, phone, or WhatsApp for product inquiries and bulk order questions."
        keywords="Contact Me Nestham, Customer Support, Bhanni Support, WhatsApp Support"
        jsonLd={breadcrumbsSchema}
      />
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs text-brand-text-muted mb-8">
        <Link to="/" className="hover:text-brand-primary transition-colors">Home</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-brand-primary font-semibold">Contact Us</span>
      </nav>

      {/* Header text */}
      <div className="text-center max-w-xl mx-auto mb-12">
        <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-brand-text mb-3">Get in Touch</h1>
        <p className="text-xs md:text-sm text-brand-text-muted leading-relaxed">
          Have questions about your order, custom artisan dimensions, or bulk wedding decorations? Our support team is here to assist.
        </p>
      </div>

      {success && (
        <div className="max-w-xl mx-auto w-full mb-8 bg-brand-success/15 border border-brand-success text-brand-success p-4 rounded-2xl text-xs font-semibold text-center">
          {success}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Support Options column */}
        <div className="flex flex-col gap-6">
          <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-sm flex items-start gap-4">
            <div className="p-3 bg-brand-secondary rounded-xl shrink-0">
              <Mail className="text-brand-primary" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-brand-text text-sm mb-1">Email Support</h4>
              <a
                href="mailto:funnycolours123@gmail.com"
                onClick={trackEmailClick}
                className="text-xs text-brand-text-muted hover:text-brand-primary transition-colors block font-medium"
                aria-label="Email support at funnycolours123@gmail.com"
              >
                funnycolours123@gmail.com
              </a>
              <p className="text-[10px] text-brand-text-muted mt-1">Average response: 12 Hours</p>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-sm flex items-start gap-4">
            <div className="p-3 bg-brand-secondary rounded-xl shrink-0">
              <Phone className="text-brand-primary" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-brand-text text-sm mb-1">Call Support</h4>
              <a
                href="tel:+919949345197"
                onClick={trackPhoneClick}
                className="text-xs text-brand-text-muted hover:text-brand-primary transition-colors block font-medium"
                aria-label="Call support at +91 99493 45197"
              >
                +91 99493 45197
              </a>
              <p className="text-[10px] text-brand-text-muted mt-1">Mon-Sat, 9 AM - 6 PM IST</p>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-sm flex items-start gap-4">
            <div className="p-3 bg-brand-secondary rounded-xl shrink-0">
              <Clock className="text-brand-primary" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-brand-text text-sm mb-1">Business Hours</h4>
              <p className="text-xs text-brand-text-muted leading-relaxed">Monday to Saturday</p>
              <p className="text-[10px] text-brand-text-muted mt-1">Closed on Sundays &amp; National Holidays</p>
            </div>
          </div>

          <a
            href="https://wa.me/919949345197?text=Hi%20Me%20Nestham%20by%20Bhanni,%20I%20have%20a%20question%20about%20your%20products."
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackWhatsAppClick}
            className="bg-brand-success text-white py-4 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow hover:opacity-90 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-success focus:ring-offset-2"
            aria-label="Chat on WhatsApp with Me Nestham by Bhanni"
          >
            <MessageCircle size={16} /> Chat on WhatsApp
          </a>
        </div>

        {/* Contact Form column */}
        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-3xl p-6 md:p-8 shadow-md">
          <h3 className="font-serif font-bold text-lg text-brand-text border-b border-brand-border pb-3 mb-6">
            Leave a Message
          </h3>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 text-xs">
            {/* Honeypot hidden input for anti-bot spam protection */}
            <input
              type="text"
              name="honeypot"
              value={form.honeypot}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-name" className="font-semibold text-brand-text">
                  Your Name
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-required="true"
                  aria-invalid={!!(touched.name && errors.name)}
                  aria-describedby={touched.name && errors.name ? "name-error" : undefined}
                  className={`bg-brand-secondary border ${
                    touched.name && errors.name ? "border-red-500" : "border-brand-border"
                  } px-4 py-3 rounded-xl outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-brand-text transition-colors`}
                />
                {touched.name && errors.name && (
                  <span id="name-error" className="text-red-500 text-[11px]">
                    {errors.name}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-email" className="font-semibold text-brand-text">
                  Email Address
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-required="true"
                  aria-invalid={!!(touched.email && errors.email)}
                  aria-describedby={touched.email && errors.email ? "email-error" : undefined}
                  className={`bg-brand-secondary border ${
                    touched.email && errors.email ? "border-red-500" : "border-brand-border"
                  } px-4 py-3 rounded-xl outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-brand-text transition-colors`}
                />
                {touched.email && errors.email && (
                  <span id="email-error" className="text-red-500 text-[11px]">
                    {errors.email}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-phone" className="font-semibold text-brand-text">
                  Phone Number
                </label>
                <input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  placeholder="10-digit number"
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={!!(touched.phone && errors.phone)}
                  aria-describedby={touched.phone && errors.phone ? "phone-error" : undefined}
                  className={`bg-brand-secondary border ${
                    touched.phone && errors.phone ? "border-red-500" : "border-brand-border"
                  } px-4 py-3 rounded-xl outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-brand-text transition-colors`}
                />
                {touched.phone && errors.phone && (
                  <span id="phone-error" className="text-red-500 text-[11px]">
                    {errors.phone}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="contact-subject" className="font-semibold text-brand-text">
                  Subject Topic
                </label>
                <select
                  id="contact-subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-invalid={!!(touched.subject && errors.subject)}
                  aria-describedby={touched.subject && errors.subject ? "subject-error" : undefined}
                  className={`bg-brand-secondary border ${
                    touched.subject && errors.subject ? "border-red-500" : "border-brand-border"
                  } px-4 py-3 rounded-xl outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-brand-text transition-colors`}
                >
                  <option value="Order Issue">📦 Order Issue &amp; Tracking</option>
                  <option value="Product Query">🔍 Product Specs &amp; Variants</option>
                  <option value="General Inquiry">ℹ️ General Inquiry</option>
                  <option value="Partnership">🤝 Artisan &amp; Business Partnerships</option>
                </select>
                {touched.subject && errors.subject && (
                  <span id="subject-error" className="text-red-500 text-[11px]">
                    {errors.subject}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-message" className="font-semibold text-brand-text">
                Message Description
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                placeholder="Details of your request..."
                value={form.message}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-required="true"
                aria-invalid={!!(touched.message && errors.message)}
                aria-describedby={touched.message && errors.message ? "message-error" : undefined}
                className={`w-full bg-brand-secondary border ${
                  touched.message && errors.message ? "border-red-500" : "border-brand-border"
                } p-4 rounded-xl outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-brand-text transition-colors`}
              />
              {touched.message && errors.message && (
                <span id="message-error" className="text-red-500 text-[11px]">
                  {errors.message}
                </span>
              )}
            </div>

            {success && (
              <p className="p-3.5 bg-brand-success/15 border border-brand-success/30 text-brand-success font-semibold rounded-xl text-[10px] leading-relaxed">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-label={loading ? "Sending..." : "Send Message"}
              className="bg-brand-primary hover:bg-brand-accent text-white font-semibold py-4 rounded-xl shadow-md transition-all active:scale-95 text-xs text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
            >
              {loading ? (
                <>
                  Sending... <Loader2 size={12} className="animate-spin" />
                </>
              ) : (
                <>
                  Send Message <Send size={12} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


