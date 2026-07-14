import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "Order Issue", message: "" });
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess("");
    setLoading(true);

    setTimeout(() => {
      setSuccess("Thank you! Your ticket reference has been logged. Support agent will email you back within 12-24 hours.");
      setForm({ name: "", email: "", phone: "", subject: "Order Issue", message: "" });
      setLoading(false);
      setTimeout(() => setSuccess(""), 5000);
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 font-accent flex flex-col text-left">
      {/* Breadcrumbs */}
      <div className="text-xs text-brand-text-muted mb-8">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-brand-primary font-semibold">Contact Us</span>
      </div>

      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-primary block mb-3">Connect With Us</span>
        <h1 className="font-serif text-3xl md:text-5xl font-extrabold text-brand-text mb-4 leading-tight">We Are Here to Help</h1>
        <p className="text-xs md:text-sm text-brand-text-muted leading-relaxed">
          Questions about sizing, custom paintings, bulk orders, or order status? Choose a channel below to get in touch.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start mb-16">
        {/* Contact Info column */}
        <div className="flex flex-col gap-6">
          <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-sm flex items-start gap-4">
            <div className="p-3 bg-brand-secondary dark:bg-[#201D1B] rounded-xl shrink-0">
              <Mail className="text-brand-primary" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-brand-text text-sm mb-1">Email Support</h4>
              <p className="text-xs text-brand-text-muted leading-relaxed">support@bhanni.com</p>
              <p className="text-[10px] text-brand-text-muted mt-1">Average response: 12 Hours</p>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-sm flex items-start gap-4">
            <div className="p-3 bg-brand-secondary dark:bg-[#201D1B] rounded-xl shrink-0">
              <Phone className="text-brand-primary" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-brand-text text-sm mb-1">Call Support</h4>
              <p className="text-xs text-brand-text-muted leading-relaxed">+91 99999 99999</p>
              <p className="text-[10px] text-brand-text-muted mt-1">Mon-Sat, 9 AM - 6 PM IST</p>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-sm flex items-start gap-4">
            <div className="p-3 bg-brand-secondary dark:bg-[#201D1B] rounded-xl shrink-0">
              <Clock className="text-brand-primary" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-brand-text text-sm mb-1">Business Hours</h4>
              <p className="text-xs text-brand-text-muted leading-relaxed">Monday to Saturday</p>
              <p className="text-[10px] text-brand-text-muted mt-1">Closed on Sundays &amp; National Holidays</p>
            </div>
          </div>

          <a
            href="https://wa.me/919999999999"
            target="_blank"
            rel="noreferrer"
            className="bg-brand-success text-white py-4 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow hover:bg-[#3D694B] transition-colors"
          >
            <MessageCircle size={16} /> Chat on WhatsApp
          </a>
        </div>

        {/* Contact Form column */}
        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-3xl p-6 md:p-8 shadow-md">
          <h3 className="font-serif font-bold text-lg text-brand-text border-b border-brand-border pb-3 mb-6">
            Leave a Message
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-brand-text">Your Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-brand-secondary border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary text-brand-text"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-brand-text">Email Address</span>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-brand-secondary border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary text-brand-text"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-brand-text">Phone Number</span>
                <input
                  type="tel"
                  placeholder="10-digit number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-brand-secondary border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary text-brand-text"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-brand-text">Subject Topic</span>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="bg-brand-secondary border border-brand-border px-4 py-3 rounded-xl outline-none text-brand-text"
                >
                  <option value="Order Issue">📦 Order Issue &amp; Tracking</option>
                  <option value="Product Query">🔍 Product Specs &amp; Variants</option>
                  <option value="General Inquiry">ℹ️ General Inquiry</option>
                  <option value="Partnership">🤝 Artisan &amp; Business Partnerships</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-brand-text">Message Description</span>
              <textarea
                required
                rows={5}
                placeholder="Details of your request..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-brand-secondary border border-brand-border p-4 rounded-xl outline-none focus:border-brand-primary text-brand-text"
              />
            </div>

            {success && (
              <p className="p-3.5 bg-brand-success/15 border border-brand-success/30 text-brand-success font-semibold rounded-xl text-[10px] leading-relaxed">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-brand-primary hover:bg-brand-accent text-white font-semibold py-4 rounded-xl shadow-md transition-all active:scale-95 text-xs text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
            >
              Send Message <Send size={12} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
