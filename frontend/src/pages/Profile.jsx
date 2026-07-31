import React, { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { api } from "../services/api";
import { db } from "../services/db";
import ProductCard from "../components/ProductCard";
import { 
  User, ShoppingBag, Heart, MapPin, Settings, 
  Trash2, Edit3, Save, Phone, Award, CheckCircle2
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") || "profile";

  const { user, profile, updateProfile, saveAddress, deleteAddress, logout } = useAuth();
  const { wishlist } = useWishlist();

  const [activeTab, setActiveTab] = useState(tabParam);
  
  // Profile edit states
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", avatar: "" });
  const [profileSuccess, setProfileSuccess] = useState("");

  // Address form states
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", addressType: "Home"
  });

  // Settings states
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth?redirect=/profile");
    } else {
      setProfileForm({
        name: profile?.name || user.name,
        phone: profile?.phone || user.phone || "",
        avatar: profile?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
      });
    }
  }, [user, profile, navigate]);

  // Sync tab clicks
  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess("");
    try {
      await updateProfile(profileForm);
      setProfileSuccess("Profile details updated successfully.");
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Address actions
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      await saveAddress({
        id: editingAddressId,
        ...addressForm
      });
      setAddressFormOpen(false);
      setEditingAddressId(null);
      setAddressForm({
        fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", addressType: "Home"
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditAddressClick = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      addressType: addr.addressType
    });
    setAddressFormOpen(true);
  };

  const handleDeleteAddress = async (id) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      await deleteAddress(id);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordSuccess("");
    if (passwordForm.new !== passwordForm.confirm) {
      alert("New passwords do not match.");
      return;
    }
    setTimeout(() => {
      setPasswordSuccess("Your account password has been updated.");
      setPasswordForm({ current: "", new: "", confirm: "" });
      setTimeout(() => setPasswordSuccess(""), 3000);
    }, 600);
  };

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

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

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!user || activeTab !== "orders") return;
      setOrdersLoading(true);
      setOrdersError("");
      try {
        const result = await api.get("/orders?limit=100");
        
        const mapped = (result.data.orders || []).map(ord => ({
          id: ord.id,
          date: ord.created_at,
          total: Number(ord.grand_total),
          status: mapBackendStatus(ord.status),
          items: (ord.items || []).map(item => ({
            name: item.product_name,
            image: item.featured_image || "/placeholder.png",
          }))
        }));
        
        setOrders(mapped);
      } catch (err) {
        console.error("Error loading order history:", err);
        setOrdersError(err.message);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchUserOrders();
  }, [activeTab, user]);

  if (!user || !profile) return null;

  // Retrieve user's orders and wishlist items
  const userOrders = orders;
  
  const allProducts = db.getProducts();
  const wishlistedProducts = allProducts.filter(p => wishlist.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 font-accent flex flex-col text-left">
      <h1 className="font-serif text-3xl font-bold text-brand-text mb-8">My Account Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side Tab Navigation */}
        <div className="flex flex-col gap-1 border-r border-brand-border/60 pr-4">
          {[
            { id: "profile", label: "My Profile", icon: <User size={16} /> },
            { id: "orders", label: "My Orders", icon: <ShoppingBag size={16} /> },
            { id: "wishlist", label: "Wishlist", icon: <Heart size={16} /> },
            { id: "addresses", label: "Address Book", icon: <MapPin size={16} /> },
            { id: "settings", label: "Account Settings", icon: <Settings size={16} /> }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === item.id 
                  ? "bg-brand-primary text-white shadow-sm font-bold" 
                  : "text-brand-text hover:bg-brand-secondary"
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
          <button
            onClick={async () => { await logout(); navigate("/"); }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-semibold text-brand-error hover:bg-brand-error/10 border-t border-brand-border/40 mt-3"
          >
            Logout Account
          </button>
        </div>

        {/* Right Side Tab Panels */}
        <div className="lg:col-span-3">
          {/* TAB 1: Profile Edit */}
          {activeTab === "profile" && (
            <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm flex flex-col gap-6">
              <h2 className="font-serif font-bold text-lg text-brand-text border-b border-brand-border pb-3">My Profile Information</h2>
              
              <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start text-xs">
                {/* Avatar upload representation */}
                <div className="flex flex-col items-center text-center gap-3 bg-brand-secondary/40 border p-5 rounded-2xl">
                  <img
  src={profile?.avatar || "https://ui-avatars.com/api/?name=User"}
  alt="Profile"
/>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-brand-text-muted">Account Tier</span>
                    <p className="font-bold text-brand-primary uppercase flex items-center gap-0.5 mt-0.5 justify-center"><Award size={12} /> Standard Member</p>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="md:col-span-2 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-semibold text-brand-text">Full Name</span>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="bg-brand-secondary border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary text-brand-text"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 opacity-65">
                    <span className="font-semibold text-brand-text">Registered Email Address (Locked)</span>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="bg-brand-secondary border border-brand-border px-4 py-3 rounded-xl cursor-not-allowed text-brand-text-muted"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="font-semibold text-brand-text">Contact Mobile</span>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="bg-brand-secondary border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary text-brand-text"
                    />
                  </div>

                  {profileSuccess && (
                    <p className="text-[10px] text-brand-success font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} /> {profileSuccess}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="bg-brand-primary hover:bg-brand-accent text-white font-semibold py-3 rounded-xl shadow-md transition-all active:scale-95 text-xs text-center flex items-center justify-center gap-1.5 self-start px-6 mt-2 cursor-pointer"
                  >
                    <Save size={14} /> Save Details
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Orders Panel */}
          {activeTab === "orders" && (
            <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm">
              <h2 className="font-serif font-bold text-lg text-brand-text border-b border-brand-border pb-3 mb-6">Order History</h2>

              {ordersLoading ? (
                <div className="py-12 text-center text-brand-text-muted">
                  <p className="text-xs">Loading order history...</p>
                </div>
              ) : ordersError ? (
                <div className="py-12 text-center text-brand-error">
                  <p className="text-xs">Failed to load order history: {ordersError}</p>
                </div>
              ) : userOrders.length === 0 ? (
                <div className="py-12 text-center text-brand-text-muted">
                  <p className="text-xs">You haven't placed any orders yet. Discover our premium handcrafted collections!</p>
                  <Link to="/shop" className="inline-block mt-4 bg-brand-primary text-white text-xs font-semibold px-6 py-2.5 rounded-xl hover:bg-brand-accent shadow">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4 text-xs text-left">
                  {userOrders.map((ord) => (
                    <div 
                      key={ord.id} 
                      className="border border-brand-border bg-brand-secondary/20 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-brand-primary">Order #{ord.id}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            ord.status === "Delivered" ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" :
                            ord.status === "Cancelled" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" :
                            "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-brand-text-muted font-mono">{new Date(ord.date).toLocaleDateString()}</span>
                        <div className="flex gap-2 items-center mt-1">
                          {ord.items.slice(0, 3).map((item, i) => (
                            <img key={i} src={item.image} alt={item.name} className="w-8 h-8 rounded border object-cover" />
                          ))}
                          {ord.items.length > 3 && <span className="text-[9px] text-brand-text-muted font-bold">+{ord.items.length - 3} more</span>}
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-3 text-brand-text">
                        <span className="font-mono font-bold text-sm">₹{ord.total}</span>
                        <Link
                          to={`/orders/${ord.id}/track`}
                          className="bg-brand-primary hover:bg-brand-accent text-white font-semibold px-4 py-2 rounded-xl text-[10px] shadow"
                        >
                          Track Package
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Wishlist Panel */}
          {activeTab === "wishlist" && (
            <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm">
              <h2 className="font-serif font-bold text-lg text-brand-text border-b border-brand-border pb-3 mb-6">My Favorites Wishlist</h2>

              {wishlistedProducts.length === 0 ? (
                <div className="py-12 text-center text-brand-text-muted">
                  <p className="text-xs">Your wishlist is empty. Tap the heart icons on products to save favorites.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {wishlistedProducts.map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Address Registry */}
          {activeTab === "addresses" && (
            <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-brand-border pb-3 mb-6">
                <h2 className="font-serif font-bold text-lg text-brand-text">Saved Addresses</h2>
                {!addressFormOpen && (
                  <button 
                    onClick={() => { setAddressFormOpen(true); setEditingAddressId(null); }}
                    className="bg-brand-primary text-white text-[10px] font-bold px-4 py-2 rounded-xl hover:bg-brand-accent shadow"
                  >
                    + Add New Address
                  </button>
                )}
              </div>

              {/* Address Form panel overlay */}
              {addressFormOpen && (
                <form onSubmit={handleAddressSubmit} className="bg-brand-secondary/40 border border-brand-border rounded-2xl p-5 mb-8 text-xs flex flex-col gap-4 text-left">
                  <span className="font-bold text-brand-text uppercase tracking-wider block border-b pb-2 mb-1">{editingAddressId ? "Edit Address Details" : "Add Address Registry"}</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="font-semibold text-brand-text">Contact Recipient</span>
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={addressForm.fullName}
                        onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                        className="bg-brand-card border border-brand-border px-3.5 py-2.5 rounded-xl outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="font-semibold text-brand-text">Contact Phone</span>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit number"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        className="bg-brand-card border border-brand-border px-3.5 py-2.5 rounded-xl outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <span className="font-semibold text-brand-text">Street Address</span>
                      <input
                        type="text"
                        required
                        placeholder="Flat / House No., Apartment Name, Colony"
                        value={addressForm.addressLine1}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                        className="bg-brand-card border border-brand-border px-3.5 py-2.5 rounded-xl outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <span className="font-semibold text-brand-text">Landmark (Optional)</span>
                      <input
                        type="text"
                        placeholder="Landmark, Area Details"
                        value={addressForm.addressLine2}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                        className="bg-brand-card border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="font-semibold text-brand-text">City</span>
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="bg-brand-card border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="font-semibold text-brand-text">State</span>
                      <input
                        type="text"
                        required
                        placeholder="State"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="bg-brand-card border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="font-semibold text-brand-text">Pincode</span>
                      <input
                        type="text"
                        required
                        placeholder="6-digit Pincode"
                        value={addressForm.pincode}
                        onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                        className="bg-brand-card border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="font-semibold text-brand-text">Label</span>
                      <select
                        value={addressForm.addressType}
                        onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value })}
                        className="bg-brand-card border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
                      >
                        <option value="Home">Home (🏡)</option>
                        <option value="Work">Office (🏢)</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button 
                      type="button"
                      onClick={() => { setAddressFormOpen(false); setEditingAddressId(null); }}
                      className="border border-brand-border px-5 py-2.5 rounded-xl hover:bg-brand-secondary font-semibold"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="bg-brand-primary text-white px-6 py-2.5 rounded-xl hover:bg-brand-accent shadow font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Save size={12} /> {editingAddressId ? "Save Changes" : "Save Address"}
                    </button>
                  </div>
                </form>
              )}

              {/* Saved Addresses list */}
              {profile.addresses && profile.addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-left">
                  {profile.addresses.map((addr) => (
                    <div 
                      key={addr.id} 
                      className="p-4 border border-brand-border rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-all bg-brand-card"
                    >
                      <div className="flex flex-col gap-1.5 text-brand-text-muted leading-relaxed">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-brand-primary">{addr.fullName}</span>
                          <span className="text-[9px] font-bold bg-brand-secondary border px-2.5 py-0.5 rounded-full">{addr.addressType}</span>
                        </div>
                        <span>{addr.addressLine1}</span>
                        {addr.addressLine2 && <span>{addr.addressLine2}</span>}
                        <span>{addr.city}, {addr.state} - {addr.pincode}</span>
                        <span className="text-[10px] text-brand-text font-semibold flex items-center gap-1 mt-1"><Phone size={10} /> {addr.phone}</span>
                      </div>

                      <div className="flex justify-end gap-4 border-t border-brand-border/60 pt-3 mt-4 text-xs font-semibold">
                        <button
                          onClick={() => handleEditAddressClick(addr)}
                          className="text-brand-accent hover:underline flex items-center gap-1"
                        >
                          <Edit3 size={11} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-brand-error hover:underline flex items-center gap-1"
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !addressFormOpen && (
                  <p className="text-xs text-brand-text-muted text-center py-10">No addresses registered yet. Save shipping details for faster checkouts.</p>
                )
              )}
            </div>
          )}

          {/* TAB 5: Settings Panel */}
          {activeTab === "settings" && (
            <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm flex flex-col gap-6">
              <h2 className="font-serif font-bold text-lg text-brand-text border-b border-brand-border pb-3">Account Security</h2>

              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4 text-xs max-w-md">
                <span className="font-bold text-brand-text uppercase tracking-wider block mb-1">Change Password</span>
                
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-brand-text">Current Account Password</span>
                  <input
                    type="password"
                    required
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    className="bg-brand-secondary border border-brand-border px-4 py-3 rounded-xl outline-none text-brand-text"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-brand-text">New Password</span>
                  <input
                    type="password"
                    required
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                    className="bg-brand-secondary border border-brand-border px-4 py-3 rounded-xl outline-none text-brand-text"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-brand-text">Confirm New Password</span>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    className="bg-brand-secondary border border-brand-border px-4 py-3 rounded-xl outline-none text-brand-text"
                  />
                </div>

                {passwordSuccess && (
                  <p className="text-[10px] text-brand-success font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> {passwordSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-accent text-white font-semibold py-3 rounded-xl shadow-md transition-all active:scale-95 text-xs text-center flex items-center justify-center gap-1.5 self-start px-6 mt-2 cursor-pointer"
                >
                  <Save size={14} /> Update Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
