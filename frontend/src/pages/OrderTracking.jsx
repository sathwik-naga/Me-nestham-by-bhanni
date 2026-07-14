import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../services/db";
import { api } from "../services/api";
import { 
  Package, CheckCircle2, ChevronRight, PhoneCall, AlertTriangle, 
  Trash2, ExternalLink, Calendar, MapPin, Truck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState(false);

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

  const getDynamicHistory = (ord) => {
    const history = [];
    const createdDate = new Date(ord.created_at || ord.date || new Date());
    
    history.push({
      status: "Placed",
      date: createdDate.toISOString(),
      note: "Order details received and pending verification."
    });

    const statusLower = ord.status?.toLowerCase();
    
    if (statusLower === 'cancelled') {
      history.push({
        status: "Cancelled",
        date: (ord.updated_at ? new Date(ord.updated_at) : new Date()).toISOString(),
        note: "Order has been cancelled."
      });
      return history;
    }

    if (['confirmed', 'packed', 'shipped', 'delivered'].includes(statusLower)) {
      const confirmDate = new Date(createdDate.getTime() + 15 * 60 * 1000);
      history.push({
        status: "Confirmed",
        date: confirmDate.toISOString(),
        note: "Payment verification cleared."
      });
    }

    if (['packed', 'shipped', 'delivered'].includes(statusLower)) {
      const packDate = new Date(createdDate.getTime() + 2 * 60 * 60 * 1000);
      history.push({
        status: "Packed",
        date: packDate.toISOString(),
        note: "Stock boxed and sealed."
      });
    }

    if (['shipped', 'delivered'].includes(statusLower)) {
      const shipDate = new Date(createdDate.getTime() + 24 * 60 * 60 * 1000);
      history.push({
        status: "Shipped",
        date: shipDate.toISOString(),
        note: "In transit with courier."
      });
    }

    if (statusLower === 'delivered') {
      const deliverDate = new Date(ord.updated_at || (createdDate.getTime() + 3 * 24 * 60 * 60 * 1000));
      history.push({
        status: "Delivered",
        date: deliverDate.toISOString(),
        note: "Doorstep delivery completed."
      });
    }

    return history;
  };

  const mapBackendOrderToFrontend = (b) => {
    if (!b) return null;
    const mappedStatus = mapBackendStatus(b.status);
    return {
      id: b.id,
      date: b.created_at,
      subtotal: Number(b.subtotal),
      discount: Number(b.discount),
      shipping: Number(b.shipping),
      total: Number(b.grand_total),
      status: mappedStatus,
      paymentStatus: b.payment_status,
      trackingNumber: b.razorpay_order_id || ("TRK-" + b.id.split("-")[0].toUpperCase()),
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
        id: item.product_id,
        name: item.product_name || "Product",
        quantity: item.quantity,
        price: Number(item.unit_price),
        image: item.featured_image || "/placeholder.png",
        variant: "",
      })),
      history: getDynamicHistory({ ...b, status: mappedStatus })
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
        console.error("Error loading tracking details:", err);
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
        <h2 className="font-serif text-2xl font-bold text-brand-text mb-4">Loading tracker...</h2>
        <p className="text-xs text-brand-text-muted mb-6">Retrieving live status of your order.</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center font-accent">
        <h2 className="font-serif text-2xl font-bold text-brand-text mb-4 font-bold">No order found</h2>
        <p className="text-xs text-brand-text-muted mb-6">{error || `Fulfillment data for order reference "${orderId}" does not exist.`}</p>
        <Link to="/profile?tab=orders" className="bg-brand-primary text-white text-xs font-semibold px-6 py-3 rounded-xl hover:bg-brand-accent">
          Go to My Orders
        </Link>
      </div>
    );
  }

  // Stepper nodes
  const steps = [
    { label: "Placed", desc: "Order details received." },
    { label: "Confirmed", desc: "Payment verification cleared." },
    { label: "Packed", desc: "Stock boxed and sealed." },
    { label: "Shipped", desc: "In transit with courier." },
    { label: "Delivered", desc: "Doorstep delivery completed." }
  ];

  const getStepIndex = (status) => {
    if (status === "Cancelled") return -1;
    const idx = steps.findIndex(s => s.label === status);
    return idx >= 0 ? idx : 0;
  };

  const currentStepIdx = getStepIndex(order.status);

  // Cancellation window (only allow cancel if Placed or Confirmed)
  const isCancellable = order.status === "Placed" || order.status === "Confirmed";

  const handleCancelOrder = async () => {
    try {
      const result = await api.put(`/orders/${orderId}`, {
        status: "cancelled"
      });
 
      setOrder(mapBackendOrderToFrontend(result.data.order));
      setCancelSuccess(true);
      setTimeout(() => {
        setShowCancelModal(false);
        setCancelSuccess(false);
      }, 1500);
    } catch (err) {
      if (err.status === 403 || err.status === 401) {
        alert("Friendly message: You do not have permission to cancel this order. Only administrators are authorized to cancel orders.");
      } else {
        alert(err.message);
      }
    }
  };

  // Compile estimates (4 days from placing)
  const orderDate = new Date(order.date);
  orderDate.setDate(orderDate.getDate() + 4);
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  const formattedDeliveryDate = orderDate.toLocaleDateString('en-US', options);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 font-accent flex flex-col text-left">
      {/* Breadcrumb */}
      <div className="text-xs text-brand-text-muted mb-6">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <span className="mx-2">&gt;</span>
        <Link to="/profile" className="hover:text-brand-primary">Profile</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-brand-primary font-semibold">Track Order</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-border pb-6 mb-8 gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-brand-primary tracking-widest block mb-1">Fulfillment Tracker</span>
          <h1 className="font-serif text-2xl font-bold text-brand-text">Order #{order.id}</h1>
          <p className="text-[10px] text-brand-text-muted mt-1 font-mono">Placed on: {new Date(order.date).toLocaleString()}</p>
        </div>

        {order.status === "Cancelled" ? (
          <span className="bg-brand-error/10 border border-brand-error/20 text-brand-error text-xs font-bold px-4 py-2 rounded-full self-start">
            Cancelled
          </span>
        ) : (
          <span className="bg-brand-success/10 border border-brand-success/20 text-brand-success text-xs font-bold px-4 py-2 rounded-full self-start flex items-center gap-1.5 animate-pulse-soft">
            <CheckCircle2 size={14} /> Status: {order.status}
          </span>
        )}
      </div>

      {/* Progress Stepper Grid */}
      {order.status !== "Cancelled" && (
        <div className="bg-brand-card border border-brand-border rounded-3xl p-6 md:p-8 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-4 relative">
            {/* Desktop Connective line */}
            <div className="hidden md:block absolute left-6 right-6 top-[22px] h-0.5 bg-brand-border dark:bg-stone-800 z-0">
              <div 
                className="bg-brand-primary h-full transition-all duration-700" 
                style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx;
              const isActive = idx === currentStepIdx;

              return (
                <div key={idx} className="flex md:flex-col items-start md:items-center gap-4 md:gap-3 text-left md:text-center z-10">
                  {/* Step bubble */}
                  <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${
                    isCompleted 
                      ? "bg-brand-primary border-brand-primary text-white scale-105" 
                      : "bg-brand-card border-brand-border text-brand-text-muted"
                  }`}>
                    {idx < currentStepIdx ? <CheckCircle2 size={18} /> : <Package size={16} />}
                  </div>

                  <div className="flex flex-col">
                    <span className={`text-xs font-bold ${isCompleted ? "text-brand-primary" : "text-brand-text-muted"}`}>
                      {step.label}
                    </span>
                    <span className="text-[10px] text-brand-text-muted leading-tight mt-0.5">{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed tracking history logs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-8">
        {/* Left: Logs feed */}
        <div className="md:col-span-2 bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm">
          <h3 className="font-serif font-bold text-base text-brand-text border-b border-brand-border pb-3 mb-5">
            Log Activity
          </h3>

          <div className="flex flex-col gap-5 text-xs">
            {order.history.slice().reverse().map((h, i) => (
              <div key={i} className="flex gap-4 relative">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-primary mt-1 shrink-0 z-10" />
                <div className="flex-1 text-left text-brand-text-muted">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-text">{h.status}</span>
                    <span className="text-[10px] font-mono">{new Date(h.date).toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] mt-1 leading-relaxed">{h.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Meta summaries */}
        <div className="flex flex-col gap-6">
          {/* Estimated Schedule */}
          {order.status !== "Cancelled" && (
            <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm flex flex-col gap-2.5">
              <span className="font-bold text-brand-text text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="text-brand-primary" size={14} /> Delivery ETA
              </span>
              <p className="font-serif text-lg font-bold text-brand-success">{formattedDeliveryDate}</p>
              <span className="text-[10px] text-brand-text-muted leading-relaxed">
                Courier Carrier: <span className="font-bold text-brand-text">Delhivery Express</span>
              </span>
              <span className="text-[10px] text-brand-text-muted leading-relaxed">
                Tracking AWB: <span className="font-mono font-bold text-brand-text flex items-center gap-1 mt-0.5">{order.trackingNumber} <ExternalLink size={10} /></span>
              </span>
            </div>
          )}

          {/* Shipping Address */}
          <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm flex flex-col gap-3 text-xs">
            <span className="font-bold text-brand-text uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="text-brand-primary" size={14} /> Shipping Destination
            </span>
            <div className="flex flex-col gap-1 text-brand-text-muted leading-relaxed">
              <span className="font-bold text-brand-text">{order.shippingAddress.fullName}</span>
              <span>{order.shippingAddress.addressLine1}</span>
              {order.shippingAddress.addressLine2 && <span>{order.shippingAddress.addressLine2}</span>}
              <span>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer controls & Action triggers */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-brand-secondary dark:bg-[#201D1B] border border-brand-border p-5 rounded-2xl">
        <a 
          href={`https://wa.me/919999999999?text=Hi, I need help with my Order ID ${order.id}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-brand-success hover:underline flex items-center gap-1.5"
        >
          💬 Need assistance? Chat on WhatsApp
        </a>

        <div className="flex items-center gap-4">
          <Link to="/profile?tab=orders" className="text-xs font-semibold text-brand-accent hover:underline">
            Back to Orders
          </Link>
          
          {isCancellable && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="bg-brand-error/10 hover:bg-brand-error text-brand-error hover:text-white px-4 py-2 rounded-xl text-xs font-semibold border border-brand-error/30 transition-all flex items-center gap-1"
            >
              <Trash2 size={13} /> Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-card w-full max-w-sm border border-brand-border rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="font-serif font-bold text-lg text-brand-text mb-2 flex items-center gap-1 text-brand-error">
                <AlertTriangle size={20} /> Cancel Order Confirmation
              </h3>
              
              {cancelSuccess ? (
                <div className="py-6 text-center text-brand-success font-semibold text-xs animate-bounce">
                  🎉 Order Cancelled Successfully! Restocked.
                </div>
              ) : (
                <div className="flex flex-col gap-4 text-xs">
                  <p className="text-brand-text-muted leading-relaxed">
                    Are you sure you want to cancel Order #{order.id}? This action is permanent and will restock the reserved items.
                  </p>
                  
                  <div className="flex flex-col gap-1.5 text-left">
                    <span className="font-semibold text-brand-text">Reason for Cancellation</span>
                    <input
                      type="text"
                      placeholder="e.g. Changed my mind / ordered wrong item"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button
                      onClick={() => setShowCancelModal(false)}
                      className="border border-brand-border py-2.5 rounded-xl font-semibold hover:bg-brand-secondary"
                    >
                      Keep Order
                    </button>
                    <button
                      onClick={handleCancelOrder}
                      className="bg-brand-error text-white py-2.5 rounded-xl font-semibold hover:bg-[#A82B1E] shadow-sm flex items-center justify-center gap-1"
                    >
                      <Trash2 size={13} /> Confirm Cancel
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
