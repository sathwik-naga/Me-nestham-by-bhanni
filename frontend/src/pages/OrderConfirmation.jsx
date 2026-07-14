import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../services/db";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { CheckCircle2, ShoppingBag, Download, ArrowRight, Mail, Calendar, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapBackendStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Placed';
      case 'confirmed': return 'Confirmed';
      case 'processing': return 'Packed';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Placed';
    }
  };

  const mapBackendOrderToFrontend = (b) => {
    if (!b) return null;
    return {
      id: b.id,
      date: b.created_at,
      subtotal: Number(b.subtotal),
      discount: Number(b.discount),
      shipping: Number(b.shipping),
      total: Number(b.grand_total),
      status: mapBackendStatus(b.status),
      paymentStatus: b.payment_status,
      shippingAddress: {
        fullName: b.shipping_address?.full_name || "Customer",
        phone: b.shipping_address?.phone || "",
        addressLine1: b.shipping_address?.address_line1 || "",
        addressLine2: b.shipping_address?.address_line2 || "",
        city: b.shipping_address?.city || "",
        state: b.shipping_address?.state || "",
        pincode: b.shipping_address?.postal_code || "",
      },
      items: (b.items || []).map(item => ({
        name: item.product_name || "Product",
        quantity: item.quantity,
        price: Number(item.unit_price),
        image: item.featured_image || "/placeholder.png",
        variant: "",
      }))
    };
  };

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.get(`/orders/${orderId}`);
        setOrder(mapBackendOrderToFrontend(result.data.order));
      } catch (err) {
        console.error("Error loading order confirmation:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center font-accent">
        <h2 className="font-serif text-2xl font-bold text-brand-text mb-4 font-bold">Loading order...</h2>
        <p className="text-xs text-brand-text-muted mb-6">Please wait while we retrieve your order confirmation details.</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center font-accent">
        <h2 className="font-serif text-2xl font-bold text-brand-text mb-4 font-bold">Failed to load order</h2>
        <p className="text-xs text-brand-text-muted mb-6">{error || `No order with ID "${orderId}" was found in our database records.`}</p>
        <Link to="/" className="bg-brand-primary text-white text-xs font-semibold px-6 py-3 rounded-xl hover:bg-brand-accent">
          Go Home
        </Link>
      </div>
    );
  }

  // Calculate delivery date estimates (4 days from order date)
  const orderDate = new Date(order.date);
  orderDate.setDate(orderDate.getDate() + 4);
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  const formattedDeliveryDate = orderDate.toLocaleDateString('en-US', options);

  const handleDownloadInvoice = () => {
    alert("Simulating Invoice PDF download... 'invoice_" + orderId + ".pdf' download initiated.");
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 font-accent flex flex-col text-left">
      {/* Success checkmark banner */}
      <div className="text-center flex flex-col items-center gap-4 mb-10">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="text-brand-success"
        >
          <CheckCircle2 size={64} fill="currentColor" className="text-white dark:text-[#1A1714]" />
        </motion.div>
        
        <h1 className="font-serif text-3xl font-extrabold text-brand-text">Thank You for Your Order!</h1>
        <p className="text-xs md:text-sm text-brand-text-muted max-w-md leading-relaxed">
          Namaste, {order.shippingAddress.fullName}! Your order <span className="font-mono font-bold text-brand-primary">#{order.id}</span> has been processed successfully. A confirmation email has been dispatched to <span className="font-semibold underline">{user?.email || "your email address"}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Left Column details */}
        <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          <h3 className="font-serif font-bold text-base text-brand-text border-b border-brand-border pb-3 flex items-center gap-1.5">
            <ShoppingBag size={14} className="text-brand-primary" /> Purchased Items
          </h3>
          
          <div className="flex flex-col gap-3.5 max-h-72 overflow-y-auto pr-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex gap-4 p-2 bg-brand-secondary/30 rounded-xl border border-brand-border/40">
                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-md border" />
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-serif font-bold text-xs text-brand-text truncate">{item.name}</h4>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">Qty: {item.quantity} {item.variant ? `(${item.variant})` : ""}</p>
                </div>
                <span className="font-mono text-xs font-bold text-brand-primary">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 pt-3 border-t border-brand-border text-xs text-brand-text-muted">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono font-semibold">₹{order.subtotal}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-brand-success font-semibold">
                <span>Discount applied</span>
                <span className="font-mono">-₹{order.discount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Fulfillment Shipping</span>
              <span className="font-mono font-semibold">{order.shipping === 0 ? "FREE" : `₹${order.shipping}`}</span>
            </div>
            <div className="flex justify-between items-baseline font-bold text-sm text-brand-text pt-2 border-t border-brand-border/60">
              <span>Grand Total Paid</span>
              <span className="font-mono text-base text-brand-primary">₹{order.total}</span>
            </div>
          </div>
        </div>

        {/* Right Column delivery metadata */}
        <div className="flex flex-col gap-6">
          {/* Estimated Schedule */}
          <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm flex flex-col gap-3">
            <span className="font-bold text-brand-text text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="text-brand-primary" size={14} /> Estimated Arrival
            </span>
            <p className="font-serif text-lg font-bold text-brand-success">{formattedDeliveryDate}</p>
            <p className="text-[10px] text-brand-text-muted leading-relaxed">
              Our courier partners (Delhivery, BlueDart) will text you a tracking reference update once the package is dispatched.
            </p>
          </div>

          {/* Delivery Address summary */}
          <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm flex flex-col gap-3 text-xs">
            <span className="font-bold text-brand-text uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="text-brand-primary" size={14} /> Shipping Destination
            </span>
            <div className="flex flex-col gap-1 text-brand-text-muted leading-relaxed">
              <span className="font-bold text-brand-text">{order.shippingAddress.fullName}</span>
              <span>{order.shippingAddress.addressLine1}</span>
              {order.shippingAddress.addressLine2 && <span>{order.shippingAddress.addressLine2}</span>}
              <span>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</span>
              <span className="text-[10px] font-bold text-brand-text mt-1">📞 {order.shippingAddress.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer navigation actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link
          to={`/orders/${orderId}/track`}
          className="w-full sm:w-auto bg-brand-primary hover:bg-brand-accent text-white font-semibold text-xs px-8 py-4 rounded-xl shadow-md transition-all active:scale-95 text-center flex items-center justify-center gap-1.5"
        >
          Track Your Package <ArrowRight size={14} />
        </Link>
        
        <button
          onClick={handleDownloadInvoice}
          className="w-full sm:w-auto border border-brand-border hover:bg-brand-secondary text-brand-text font-semibold text-xs px-8 py-4 rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <Download size={14} /> Download Receipt PDF
        </button>

        <Link
          to="/shop"
          className="text-xs font-semibold text-brand-accent hover:underline"
        >
          Continue Shopping &rarr;
        </Link>
      </div>
    </div>
  );
}
