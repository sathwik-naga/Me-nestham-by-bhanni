import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { db } from "../services/db";
import { api } from "../services/api";
import { 
  Check, MapPin, Truck, CreditCard, ChevronRight, 
  ArrowLeft, Tag, Phone, ShieldCheck, ShoppingBag, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Checkout() {
  const navigate = useNavigate();
  const { user, profile, saveAddress } = useAuth();
  const { 
    cartItems, subtotal, discount, shipping, tax, total, 
    appliedCoupon, clearCart 
  } = useCart();

  const [step, setStep] = useState(1); // 1: Address, 2: Shipping, 3: Payment
  
  // Form states
  const [selectedAddressId, setSelectedAddressId] = useState(profile?.addresses?.[0]?.id || "");
  const [newAddressForm, setNewAddressForm] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    addressType: "Home",
    saveToBook: true
  });
  const [useNewAddress, setUseNewAddress] = useState(!profile?.addresses || profile.addresses.length === 0);
  const [addressErrors, setAddressErrors] = useState({});

  const [shippingMethod, setShippingMethod] = useState("Standard"); // Standard, Express
  const [paymentMethod, setPaymentMethod] = useState("Razorpay"); // Razorpay, COD
  
  // Simulated Razorpay overlays
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayTab, setRazorpayTab] = useState("upi"); // upi, card
  const [upiId, setUpiId] = useState("");
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [notes, setNotes] = useState("");

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center font-accent">
        <h2 className="font-serif text-2xl font-bold text-brand-text mb-4">Your cart is empty</h2>
        <p className="text-xs text-brand-text-muted mb-6">You must have items in your cart to checkout.</p>
        <Link to="/shop" className="bg-brand-primary text-white text-xs font-semibold px-6 py-3 rounded-xl hover:bg-brand-accent">
          Go to Shop
        </Link>
      </div>
    );
  }

  // Address Validator
  const validateAddress = () => {
    const errors = {};
    if (!newAddressForm.fullName.trim()) errors.fullName = "Full name is required.";
    if (!/^\d{10}$/.test(newAddressForm.phone)) errors.phone = "Provide a 10-digit phone number.";
    if (!newAddressForm.addressLine1.trim()) errors.addressLine1 = "Street address is required.";
    if (!newAddressForm.city.trim()) errors.city = "City is required.";
    if (!newAddressForm.state.trim()) errors.state = "State is required.";
    if (!/^\d{6}$/.test(newAddressForm.pincode)) errors.pincode = "Enter a valid 6-digit Pincode.";
    
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (useNewAddress) {
      if (!validateAddress()) return;

      if (user && newAddressForm.saveToBook) {
        try {
          const addrs = await saveAddress({
            fullName: newAddressForm.fullName,
            phone: newAddressForm.phone,
            addressLine1: newAddressForm.addressLine1,
            addressLine2: newAddressForm.addressLine2,
            city: newAddressForm.city,
            state: newAddressForm.state,
            pincode: newAddressForm.pincode,
            addressType: newAddressForm.addressType
          });
          // Auto select newly created address ID
          if (addrs && addrs.length > 0) {
            setSelectedAddressId(addrs[addrs.length - 1].id);
          }
          setUseNewAddress(false);
        } catch (err) {
          console.error("Failed to save address", err);
        }
      }
    } else {
      if (!selectedAddressId) {
        alert("Please select a delivery address.");
        return;
      }
    }
    setStep(2);
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  // Compile Active Address
  const getDeliveryAddress = () => {
    if (useNewAddress) {
      return {
        fullName: newAddressForm.fullName,
        phone: newAddressForm.phone,
        addressLine1: newAddressForm.addressLine1,
        addressLine2: newAddressForm.addressLine2,
        city: newAddressForm.city,
        state: newAddressForm.state,
        pincode: newAddressForm.pincode,
        addressType: newAddressForm.addressType
      };
    }
    return profile?.addresses?.find(a => a.id === selectedAddressId) || {};
  };

  // Compile final order totals
  const shippingCost = shippingMethod === "Express" ? 150 : shipping;
  const netTotal = parseFloat((total + (shippingMethod === "Express" ? 150 - shipping : 0)).toFixed(2));

  // Order Placement
  const handlePlaceOrder = () => {
    if (paymentProcessing) return;
    if (paymentMethod === "Razorpay") {
      setShowRazorpayModal(true);
    } else {
      // Cash on Delivery
      processFinalOrder("Paid on Delivery (COD)");
    }
  };

  const processFinalOrder = async (payStatus = "Paid", payId = "") => {
    if (paymentProcessing) return;
    setPaymentProcessing(true);
    
    const activeAddress = getDeliveryAddress();
    const addressSnapshot = {
      full_name: activeAddress.fullName || activeAddress.full_name || user?.name || "Customer",
      phone: activeAddress.phone || "0000000000",
      email: activeAddress.email || user?.email || "customer@example.com",
      address_line1: activeAddress.addressLine1 || activeAddress.address_line1 || "",
      address_line2: (activeAddress.addressLine2 || activeAddress.address_line2 || "").trim() || undefined,
      city: activeAddress.city || "",
      state: activeAddress.state || "",
      postal_code: activeAddress.pincode || activeAddress.postal_code || "",
      country: activeAddress.country || "India"
    };

    try {
      const result = await api.post("/orders/checkout", {
        billing_address: addressSnapshot,
        shipping_address: addressSnapshot,
        shipping_fee: shippingCost,
        discount: discount,
        payment_method: paymentMethod,
        notes: notes || ""
      });

      // Successful order creation:
      // Clear frontend cart
      await clearCart();
      setPaymentProcessing(false);
      setShowRazorpayModal(false);
      
      // Redirect to confirmation page with backend order ID
      navigate(`/order-confirmation/${result.data.order.id}`);
    } catch (err) {
      setPaymentProcessing(false);
      alert(err.message || "An error occurred during order checkout");
    }
  };

  const handleSimulatedPayment = () => {
    if (paymentProcessing) return;
    setPaymentError("");
    if (razorpayTab === "upi") {
      if (!upiId.trim() || !upiId.includes("@")) {
        setPaymentError("Please enter a valid UPI ID (e.g. user@okaxis).");
        return;
      }
    } else {
      if (!/^\d{16}$/.test(cardDetails.number.replace(/\s+/g, ""))) {
        setPaymentError("Card number must be 16 digits.");
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
        setPaymentError("Expiry must be in MM/YY format.");
        return;
      }
      if (!/^\d{3}$/.test(cardDetails.cvv)) {
        setPaymentError("CVV must be 3 digits.");
        return;
      }
    }

    setPaymentProcessing(true);
    setTimeout(() => {
      processFinalOrder("Paid", "pay_" + Math.random().toString(36).substr(2, 9));
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 font-accent flex flex-col text-left relative">
      {/* Checkout Stepper */}
      <div className="flex items-center justify-center gap-2 md:gap-4 mb-10 max-w-xl mx-auto text-xs md:text-sm font-semibold">
        <button 
          onClick={() => setStep(1)}
          className={`flex items-center gap-1.5 ${step >= 1 ? "text-brand-primary font-bold" : "text-brand-text-muted"}`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
            step > 1 ? "bg-brand-primary text-white" : "border-2 border-brand-primary text-brand-primary"
          }`}>
            {step > 1 ? <Check size={10} /> : "1"}
          </span>
          Address
        </button>
        <ChevronRight size={14} className="text-brand-text-muted" />
        <button 
          onClick={() => step > 1 && setStep(2)}
          className={`flex items-center gap-1.5 ${step >= 2 ? "text-brand-primary font-bold" : "text-brand-text-muted"}`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
            step > 2 ? "bg-brand-primary text-white" : step === 2 ? "border-2 border-brand-primary text-brand-primary" : "border-2 border-brand-border text-brand-text-muted"
          }`}>
            {step > 2 ? <Check size={10} /> : "2"}
          </span>
          Shipping
        </button>
        <ChevronRight size={14} className="text-brand-text-muted" />
        <span className={`flex items-center gap-1.5 ${step === 3 ? "text-brand-primary font-bold" : "text-brand-text-muted"}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 ${
            step === 3 ? "border-brand-primary text-brand-primary" : "border-brand-border text-brand-text-muted"
          }`}>
            3
          </span>
          Payment
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column forms */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Back Action */}
          {step > 1 && (
            <button 
              onClick={() => setStep(prev => prev - 1)}
              className="flex items-center gap-1 text-xs font-semibold text-brand-text-muted hover:text-brand-primary self-start"
            >
              <ArrowLeft size={14} /> Back to Step {step - 1}
            </button>
          )}

          {/* STEP 1: Address Details */}
          {step === 1 && (
            <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm">
              <h2 className="font-serif font-bold text-xl text-brand-text mb-6 flex items-center gap-2">
                <MapPin className="text-brand-primary" size={20} /> Shipping Destination
              </h2>

              {!user && (
                <div className="p-4 bg-brand-secondary dark:bg-[#25211E] rounded-2xl border border-brand-border text-xs mb-6 flex items-center justify-between">
                  <span>Logged-in users can choose saved addresses.</span>
                  <Link to="/auth?redirect=checkout" className="text-brand-accent font-semibold underline hover:text-brand-primary">
                    Login / Sign up &rarr;
                  </Link>
                </div>
              )}

              <form onSubmit={handleAddressSubmit} className="flex flex-col gap-5 text-xs">
                {/* Saved Address Selection */}
                {user && profile?.addresses && profile.addresses.length > 0 && !useNewAddress && (
                  <div className="flex flex-col gap-3">
                    <span className="font-bold text-brand-text uppercase tracking-wider block mb-1">Select Shipping Address</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.addresses.map((addr) => (
                        <label 
                          key={addr.id}
                          className={`p-4 border rounded-2xl flex items-start gap-3 cursor-pointer transition-all shadow-sm ${
                            selectedAddressId === addr.id
                              ? "border-brand-primary bg-brand-primary/5"
                              : "border-brand-border bg-brand-card hover:bg-brand-secondary/40"
                          }`}
                        >
                          <input
                            type="radio"
                            name="savedAddress"
                            value={addr.id}
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 accent-brand-primary"
                          />
                          <div className="flex flex-col gap-1 text-brand-text">
                            <span className="font-bold text-sm text-brand-primary">{addr.fullName} <span className="text-[10px] bg-brand-secondary dark:bg-[#201D1B] border px-2 py-0.5 rounded-full font-bold ml-1">{addr.addressType}</span></span>
                            <span>{addr.addressLine1}</span>
                            {addr.addressLine2 && <span>{addr.addressLine2}</span>}
                            <span>{addr.city}, {addr.state} - {addr.pincode}</span>
                            <span className="text-[10px] text-brand-text-muted mt-1 font-semibold flex items-center gap-1"><Phone size={10} /> {addr.phone}</span>
                          </div>
                        </label>
                      ))}
                    </div>

                    <button 
                      type="button"
                      onClick={() => setUseNewAddress(true)}
                      className="text-xs font-semibold text-brand-accent hover:underline self-start mt-2"
                    >
                      + Add New Delivery Address
                    </button>
                  </div>
                )}

                {/* New Address Form */}
                {(useNewAddress || !profile?.addresses || profile.addresses.length === 0) && (
                  <div className="flex flex-col gap-4">
                    {user && profile?.addresses && profile.addresses.length > 0 && (
                      <button 
                        type="button" 
                        onClick={() => { setUseNewAddress(false); setAddressErrors({}); }}
                        className="text-xs font-semibold text-brand-accent hover:underline self-start mb-2"
                      >
                        &larr; Choose Saved Address
                      </button>
                    )}

                    <span className="font-bold text-brand-text uppercase tracking-wider block border-b border-brand-border pb-2 mb-1">New Delivery Address</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-semibold text-brand-text">Recipient Name</span>
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={newAddressForm.fullName}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, fullName: e.target.value })}
                          className="bg-brand-card text-brand-text border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary"
                        />
                        {addressErrors.fullName && <p className="text-[10px] text-brand-error font-bold">{addressErrors.fullName}</p>}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="font-semibold text-brand-text">Contact Phone</span>
                        <input
                          type="tel"
                          placeholder="10-digit mobile number"
                          value={newAddressForm.phone}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                          className="bg-brand-card text-brand-text border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary"
                        />
                        {addressErrors.phone && <p className="text-[10px] text-brand-error font-bold">{addressErrors.phone}</p>}
                      </div>

                      <div className="md:col-span-2 flex flex-col gap-1.5">
                        <span className="font-semibold text-brand-text">Flat / House No., Apartment Name, Street Address</span>
                        <input
                          type="text"
                          placeholder="Street Address Line 1"
                          value={newAddressForm.addressLine1}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, addressLine1: e.target.value })}
                          className="bg-brand-card text-brand-text border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary"
                        />
                        {addressErrors.addressLine1 && <p className="text-[10px] text-brand-error font-bold">{addressErrors.addressLine1}</p>}
                      </div>

                      <div className="md:col-span-2 flex flex-col gap-1.5">
                        <span className="font-semibold text-brand-text">Landmark, Area, Colony (Optional)</span>
                        <input
                          type="text"
                          placeholder="Address Line 2 (Optional)"
                          value={newAddressForm.addressLine2}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, addressLine2: e.target.value })}
                          className="bg-brand-card text-brand-text border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="font-semibold text-brand-text">City</span>
                        <input
                          type="text"
                          placeholder="City"
                          value={newAddressForm.city}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                          className="bg-brand-card text-brand-text border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary"
                        />
                        {addressErrors.city && <p className="text-[10px] text-brand-error font-bold">{addressErrors.city}</p>}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="font-semibold text-brand-text">State</span>
                        <input
                          type="text"
                          placeholder="State"
                          value={newAddressForm.state}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                          className="bg-brand-card text-brand-text border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary"
                        />
                        {addressErrors.state && <p className="text-[10px] text-brand-error font-bold">{addressErrors.state}</p>}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="font-semibold text-brand-text">Pincode</span>
                        <input
                          type="text"
                          placeholder="6-digit PIN"
                          value={newAddressForm.pincode}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, pincode: e.target.value })}
                          className="bg-brand-card text-brand-text border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary"
                        />
                        {addressErrors.pincode && <p className="text-[10px] text-brand-error font-bold">{addressErrors.pincode}</p>}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="font-semibold text-brand-text">Address Label</span>
                        <select
                          value={newAddressForm.addressType}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, addressType: e.target.value })}
                          className="bg-brand-card text-brand-text border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary"
                        >
                          <option value="Home">🏡 Home (All day delivery)</option>
                          <option value="Work">🏢 Office (9 AM - 5 PM)</option>
                          <option value="Other">📍 Other</option>
                        </select>
                      </div>
                    </div>

                    {user && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          id="saveAddressCheckbox"
                          checked={newAddressForm.saveToBook}
                          onChange={(e) => setNewAddressForm({ ...newAddressForm, saveToBook: e.target.checked })}
                          className="w-4 h-4 accent-brand-primary"
                        />
                        <label htmlFor="saveAddressCheckbox" className="font-medium text-brand-text">Save this address to my profile book</label>
                      </div>
                    )}
                  </div>
                )}

                <button 
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-accent text-white font-semibold py-4 rounded-xl shadow-md transition-all active:scale-95 text-xs text-center mt-3 cursor-pointer"
                >
                  Continue to Shipping Method
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Shipping Options */}
          {step === 2 && (
            <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm flex flex-col gap-6">
              <h2 className="font-serif font-bold text-xl text-brand-text mb-2 flex items-center gap-2">
                <Truck className="text-brand-primary" size={20} /> Shipping Method
              </h2>

              <form onSubmit={handleShippingSubmit} className="flex flex-col gap-5 text-xs">
                <div className="flex flex-col gap-3">
                  <label 
                    className={`p-4 border rounded-2xl flex items-center justify-between cursor-pointer transition-all shadow-sm ${
                      shippingMethod === "Standard" ? "border-brand-primary bg-brand-primary/5" : "border-brand-border bg-brand-card hover:bg-brand-secondary/40"
                    }`}
                  >
                    <div className="flex gap-3">
                      <input
                        type="radio"
                        name="shippingOption"
                        value="Standard"
                        checked={shippingMethod === "Standard"}
                        onChange={() => setShippingMethod("Standard")}
                        className="accent-brand-primary"
                      />
                      <div className="flex flex-col text-brand-text">
                        <span className="font-bold text-sm text-brand-primary">Standard Shipping</span>
                        <span className="text-brand-text-muted mt-0.5">Estimated delivery: 3 to 5 business days</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-brand-text">
                      {shipping === 0 ? <span className="text-brand-success">FREE</span> : `₹${shipping}`}
                    </span>
                  </label>

                  <label 
                    className={`p-4 border rounded-2xl flex items-center justify-between cursor-pointer transition-all shadow-sm ${
                      shippingMethod === "Express" ? "border-brand-primary bg-brand-primary/5" : "border-brand-border bg-brand-card hover:bg-brand-secondary/40"
                    }`}
                  >
                    <div className="flex gap-3">
                      <input
                        type="radio"
                        name="shippingOption"
                        value="Express"
                        checked={shippingMethod === "Express"}
                        onChange={() => setShippingMethod("Express")}
                        className="accent-brand-primary"
                      />
                      <div className="flex flex-col text-brand-text">
                        <span className="font-bold text-sm text-brand-primary">Express Shipping</span>
                        <span className="text-brand-text-muted mt-0.5">Estimated delivery: 1 to 2 business days</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-brand-text">₹150</span>
                  </label>
                </div>

                <button 
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-accent text-white font-semibold py-4 rounded-xl shadow-md transition-all active:scale-95 text-xs text-center mt-3 cursor-pointer"
                >
                  Continue to Payments
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: Payment Selection */}
          {step === 3 && (
            <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm flex flex-col gap-6">
              <h2 className="font-serif font-bold text-xl text-brand-text mb-2 flex items-center gap-2">
                <CreditCard className="text-brand-primary" size={20} /> Choose Payment Channel
              </h2>

              <div className="flex flex-col gap-4 text-xs">
                {/* Razorpay Gateway */}
                <label 
                  className={`p-4 border rounded-2xl flex items-start gap-3 cursor-pointer transition-all shadow-sm ${
                    paymentMethod === "Razorpay" ? "border-brand-primary bg-brand-primary/5" : "border-brand-border bg-brand-card hover:bg-brand-secondary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentChannel"
                    value="Razorpay"
                    checked={paymentMethod === "Razorpay"}
                    onChange={() => setPaymentMethod("Razorpay")}
                    className="mt-1 accent-brand-primary"
                  />
                  <div className="flex flex-col text-brand-text">
                    <span className="font-bold text-sm text-brand-primary">Razorpay Secured Gateway</span>
                    <span className="text-brand-text-muted leading-relaxed mt-0.5">
                      Pay instantly with UPI (Google Pay, PhonePe, Paytm), Credit or Debit Cards, and Net banking.
                    </span>
                  </div>
                </label>

                {/* Cash on Delivery */}
                <label 
                  className={`p-4 border rounded-2xl flex items-start gap-3 cursor-pointer transition-all shadow-sm ${
                    paymentMethod === "COD" ? "border-brand-primary bg-brand-primary/5" : "border-brand-border bg-brand-card hover:bg-brand-secondary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentChannel"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                    className="mt-1 accent-brand-primary"
                  />
                  <div className="flex flex-col text-brand-text">
                    <span className="font-bold text-sm text-brand-primary">Cash on Delivery (COD)</span>
                    <span className="text-brand-text-muted leading-relaxed mt-0.5">
                      Pay with cash at your doorstep upon receiving the package. (Flat ₹50 COD handling surcharge applies).
                    </span>
                  </div>
                </label>
              </div>

              {/* Delivery review summary */}
              <div className="p-4 bg-brand-secondary/40 border border-brand-border rounded-2xl text-xs text-brand-text-muted leading-relaxed">
                <span className="font-bold text-brand-text block mb-1">Fulfillment Address Summary:</span>
                <span>{getDeliveryAddress().fullName} — {getDeliveryAddress().addressLine1}, {getDeliveryAddress().city}, {getDeliveryAddress().pincode}.</span>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={paymentProcessing}
                className="bg-brand-primary hover:bg-brand-accent text-white font-semibold py-4 rounded-xl shadow-lg transition-all active:scale-95 text-xs text-center cursor-pointer font-accent flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentProcessing ? (
                  <>
                    <Loader2 className="animate-spin" size={14} /> Placing Order...
                  </>
                ) : (
                  `Place Order (₹${(netTotal + (paymentMethod === "COD" ? 50 : 0)).toFixed(2)})`
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Order Summary panel */}
        <div className="sticky top-28 bg-brand-card border border-brand-border p-6 rounded-3xl shadow-md font-accent text-xs">
          <h3 className="font-serif font-bold text-base text-brand-text mb-4 pb-2 border-b border-brand-border flex items-center gap-1">
            <ShoppingBag size={14} className="text-brand-primary" /> Order Cart Summary
          </h3>
          
          <div className="flex flex-col gap-3 max-h-56 overflow-y-auto mb-6 pr-2">
            {cartItems.map((item) => (
              <div key={`${item.id}-${item.variant}`} className="flex items-center gap-3 bg-brand-secondary/20 p-2.5 rounded-xl border border-brand-border/40">
                <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-md border" />
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-serif font-bold text-[11px] text-brand-text truncate">{item.name}</h4>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">Qty: {item.quantity} {item.variant ? `(${item.variant})` : ""}</p>
                </div>
                <span className="font-mono font-bold text-brand-primary">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 pb-4 border-b border-brand-border">
            <div className="flex justify-between">
              <span className="text-brand-text-muted font-medium">Cart Subtotal</span>
              <span className="font-mono font-semibold text-brand-text">₹{subtotal}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-brand-success font-semibold">
                <span className="flex items-center gap-1"><Tag size={10} /> Coupon ({appliedCoupon.code})</span>
                <span className="font-mono">-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-brand-text-muted font-medium">Delivery Shipping</span>
              <span className="font-mono font-semibold text-brand-text">
                {shippingCost === 0 ? <span className="text-brand-success">FREE</span> : `₹${shippingCost}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-text-muted font-medium">GST Tax (18%)</span>
              <span className="font-mono font-semibold text-brand-text">₹{tax}</span>
            </div>
            {paymentMethod === "COD" && step === 3 && (
              <div className="flex justify-between text-brand-text font-medium">
                <span className="text-brand-text-muted font-medium">COD Surcharge</span>
                <span className="font-mono font-semibold text-brand-text">₹50</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-baseline font-bold text-sm text-brand-text mt-4 pt-1 mb-2">
            <span>Grand Total</span>
            <span className="font-mono text-base text-brand-primary">₹{netTotal + (paymentMethod === "COD" && step === 3 ? 50 : 0)}</span>
          </div>

          <div className="text-[9px] text-brand-text-muted leading-relaxed mt-4 border-t border-brand-border/60 pt-3">
            🔐 PCI-DSS compliant secure socket server layer checks. Your card and financial credentials are fully encrypted and never stored by our systems.
          </div>
        </div>
      </div>

      {/* Simulated Razorpay Overlay Modal popup */}
      <AnimatePresence>
        {showRazorpayModal && (
          <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-brand-card w-full max-w-md border border-brand-border rounded-3xl overflow-hidden shadow-2xl font-accent"
            >
              {/* Header */}
              <div className="bg-[#121B2F] text-white p-5 flex items-center justify-between border-b border-[#1E2E4E]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center font-bold text-xs text-white">
                    R
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold tracking-tight">Razorpay Secure Checkout</h3>
                    <p className="text-[10px] text-gray-400">Me Nestham By Bhanni — ORDER ID</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Amount</p>
                  <p className="text-sm font-bold text-brand-primary font-mono">₹{netTotal}</p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                {paymentProcessing ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                    <Loader2 size={36} className="text-brand-primary animate-spin" />
                    <div>
                      <h4 className="font-bold text-brand-text text-sm">Processing Transaction</h4>
                      <p className="text-xs text-brand-text-muted mt-1 max-w-[240px]">Connecting with your financial provider, please do not close this window.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 text-left">
                    {/* Tabs */}
                    <div className="flex border-b border-brand-border text-xs font-semibold gap-4">
                      <button 
                        onClick={() => { setRazorpayTab("upi"); setPaymentError(""); }}
                        className={`pb-2.5 border-b-2 ${
                          razorpayTab === "upi" ? "border-brand-primary text-brand-primary font-bold" : "border-transparent text-brand-text-muted"
                        }`}
                      >
                        UPI (GPay / PhonePe)
                      </button>
                      <button 
                        onClick={() => { setRazorpayTab("card"); setPaymentError(""); }}
                        className={`pb-2.5 border-b-2 ${
                          razorpayTab === "card" ? "border-brand-primary text-brand-primary font-bold" : "border-transparent text-brand-text-muted"
                        }`}
                      >
                        Credit / Debit Card
                      </button>
                    </div>

                    {/* Tab panels */}
                    {razorpayTab === "upi" ? (
                      <div className="flex flex-col gap-3 mt-1 text-xs">
                        <span className="font-semibold text-brand-text">Enter UPI Virtual Payment Address (VPA)</span>
                        <input
                          type="text"
                          placeholder="e.g. priya@okhdfcbank"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="bg-brand-secondary text-brand-text border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary"
                        />
                        <p className="text-[10px] text-brand-text-muted">A payment notification request will be pushed to your UPI provider app.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3.5 mt-1 text-xs">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-semibold text-brand-text">Card Number</span>
                          <input
                            type="text"
                            placeholder="4532 9843 2109 4321"
                            value={cardDetails.number}
                            onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                            className="bg-brand-secondary text-brand-text border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-semibold text-brand-text">Expiry (MM/YY)</span>
                            <input
                              type="text"
                              placeholder="12/29"
                              value={cardDetails.expiry}
                              onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                              className="bg-brand-secondary text-brand-text border border-brand-border px-4 py-3 rounded-xl outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="font-semibold text-brand-text">CVV</span>
                            <input
                              type="password"
                              maxLength={3}
                              placeholder="***"
                              value={cardDetails.cvv}
                              onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                              className="bg-brand-secondary text-brand-text border border-brand-border px-4 py-3 rounded-xl outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentError && <p className="text-[10px] text-brand-error font-bold text-center mt-1">{paymentError}</p>}

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button
                        onClick={() => setShowRazorpayModal(false)}
                        className="border border-brand-border py-3 rounded-xl text-xs font-semibold text-brand-text hover:bg-brand-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSimulatedPayment}
                        className="bg-brand-primary py-3 rounded-xl text-xs font-semibold text-white shadow-md hover:bg-brand-accent flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ShieldCheck size={14} /> Pay ₹{netTotal}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
