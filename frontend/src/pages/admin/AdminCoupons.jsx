import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { 
  Plus, Trash2, Check, Save, X, Tag, Copy, 
  Play, Eye, Edit2, ToggleLeft, ToggleRight, CheckSquare, Square, ChevronLeft, ChevronRight, Loader2
} from "lucide-react";

export default function AdminCoupons() {
  const [activeTab, setActiveTab] = useState("coupons"); // "coupons" or "giftcards"
  
  // Lists and Pagination
  const [coupons, setCoupons] = useState([]);
  const [giftCards, setGiftCards] = useState([]);
  const [couponTotal, setCouponTotal] = useState(0);
  const [giftCardTotal, setGiftCardTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Coupon Field States
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [maximumDiscount, setMaximumDiscount] = useState("");
  const [minimumOrderAmount, setMinimumOrderAmount] = useState(0);
  const [usageLimit, setUsageLimit] = useState("");
  const [usagePerCustomer, setUsagePerCustomer] = useState(1);
  const [buyQuantity, setBuyQuantity] = useState("");
  const [getQuantity, setGetQuantity] = useState("");
  const [freeProductId, setFreeProductId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [stackable, setStackable] = useState(false);
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [priority, setPriority] = useState(0);

  // Gift Card Field States
  const [gcCode, setGcCode] = useState("");
  const [gcBalance, setGcBalance] = useState(1000);
  const [gcExpiresAt, setGcExpiresAt] = useState("");

  // Selection states for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Simulator Modal states
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simCoupon, setSimCoupon] = useState({
    type: "percentage",
    discount_value: 10,
    maximum_discount: 200,
    minimum_order_amount: 500,
    is_active: true,
  });
  const [simItems, setSimItems] = useState([
    { product_id: "p1", quantity: 2, product: { price: 350, name: "Silver Jhumkas", category: "jewelry" } }
  ]);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "coupons") {
        const res = await api.get(`/promotions?page=${page}&limit=${limit}&search=${search}`);
        if (res.data.status === "success") {
          setCoupons(res.data.data.coupons);
          setCouponTotal(res.data.data.total);
        }
      } else {
        const res = await api.get(`/promotions/gift-cards?page=${page}&limit=${limit}&search=${search}`);
        if (res.data.status === "success") {
          setGiftCards(res.data.data.giftCards);
          setGiftCardTotal(res.data.data.total);
        }
      }
    } catch (err) {
      console.error("Failed to load promotion data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSelectedIds([]);
  }, [activeTab, page, search]);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === "coupons") {
        const payload = {
          code: isAutomatic ? null : code.trim().toUpperCase(),
          title: title.trim(),
          description: description.trim(),
          type,
          discount_value: Number(discountValue),
          maximum_discount: maximumDiscount ? Number(maximumDiscount) : null,
          minimum_order_amount: Number(minimumOrderAmount),
          usage_limit: usageLimit ? Number(usageLimit) : null,
          usage_per_customer: Number(usagePerCustomer),
          buy_quantity: buyQuantity ? Number(buyQuantity) : null,
          get_quantity: getQuantity ? Number(getQuantity) : null,
          free_product_id: freeProductId || null,
          starts_at: startsAt || null,
          expires_at: expiresAt || null,
          is_first_order: isFirstOrder,
          is_active: isActive,
          stackable,
          is_automatic: isAutomatic,
          priority: Number(priority),
        };

        if (editId) {
          await api.put(`/promotions/${editId}`, payload);
        } else {
          await api.post("/promotions", payload);
        }
      } else {
        const payload = {
          code: gcCode.trim().toUpperCase(),
          balance: Number(gcBalance),
          expires_at: gcExpiresAt || null,
          is_active: isActive,
        };

        if (editId) {
          await api.put(`/promotions/gift-cards/${editId}`, payload);
        } else {
          await api.post("/promotions/gift-cards", payload);
        }
      }

      setFormOpen(false);
      setEditId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to save record.");
    }
  };

  const handleEditClick = (record) => {
    setEditId(record.id);
    setFormOpen(true);
    setIsActive(record.is_active);

    if (activeTab === "coupons") {
      setCode(record.code || "");
      setTitle(record.title || "");
      setDescription(record.description || "");
      setType(record.type || "percentage");
      setDiscountValue(record.discount_value || 0);
      setMaximumDiscount(record.maximum_discount || "");
      setMinimumOrderAmount(record.minimum_order_amount || 0);
      setUsageLimit(record.usage_limit || "");
      setUsagePerCustomer(record.usage_per_customer || 1);
      setBuyQuantity(record.buy_quantity || "");
      setGetQuantity(record.get_quantity || "");
      setFreeProductId(record.free_product_id || "");
      setStartsAt(record.starts_at ? record.starts_at.substring(0, 16) : "");
      setExpiresAt(record.expires_at ? record.expires_at.substring(0, 16) : "");
      setIsFirstOrder(record.is_first_order || false);
      setStackable(record.stackable || false);
      setIsAutomatic(record.is_automatic || false);
      setPriority(record.priority || 0);
    } else {
      setGcCode(record.code || "");
      setGcBalance(record.balance || 0);
      setGcExpiresAt(record.expires_at ? record.expires_at.substring(0, 16) : "");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      if (activeTab === "coupons") {
        await api.delete(`/promotions/${id}`);
      } else {
        await api.delete(`/promotions/gift-cards/${id}`);
      }
      fetchData();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/promotions/${id}/duplicate`);
      fetchData();
    } catch (err) {
      alert("Failed to duplicate coupon.");
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    if (action === "DELETE" && !window.confirm(`Delete ${selectedIds.length} selected items?`)) return;
    try {
      await api.post("/promotions/bulk", {
        targetTable: activeTab === "coupons" ? "coupons" : "gift_cards",
        ids: selectedIds,
        action,
      });
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      alert("Bulk operation failed.");
    }
  };

  const handleSelectToggle = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = (list) => {
    if (selectedIds.length === list.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(list.map((x) => x.id));
    }
  };

  // Run Draft Simulation
  const runSimulation = async () => {
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await api.post("/promotions/simulate", {
        draftCoupon: simCoupon,
        mockItems: simItems,
      });
      if (res.data.status === "success") {
        setSimResult(res.data.data);
      }
    } catch (err) {
      alert("Simulation calculation failed.");
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-accent text-left text-xs text-brand-text max-w-7xl mx-auto w-full relative">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-brand-border pb-4 gap-4">
        <div>
          <h1 className="font-serif font-bold text-xl text-brand-primary">Coupons & Promotions Center</h1>
          <p className="text-brand-text-muted mt-1 text-[11px]">Configure automatic discount engines, scheduler priority tiers, campaigns, and gift card ledgers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSimulatorOpen(true)}
            className="border border-brand-primary text-brand-primary font-bold px-4 py-2.5 rounded-xl hover:bg-brand-primary/5 flex items-center gap-1.5 cursor-pointer"
          >
            <Play size={13} /> Promotion Simulator
          </button>
          <button 
            onClick={() => {
              setEditId(null);
              setFormOpen(true);
              setCode("");
              setTitle("");
              setDescription("");
              setType("percentage");
              setDiscountValue(0);
              setMaximumDiscount("");
              setMinimumOrderAmount(0);
              setUsageLimit("");
              setStartsAt("");
              setExpiresAt("");
              setIsAutomatic(false);
              setPriority(0);
              setGcCode("");
              setGcBalance(1000);
              setGcExpiresAt("");
            }}
            className="bg-brand-primary text-white font-bold px-5 py-2.5 rounded-xl hover:bg-brand-accent shadow flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} /> Create {activeTab === "coupons" ? "Promotion" : "Gift Card"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-brand-border pb-px">
        <button 
          onClick={() => { setActiveTab("coupons"); setPage(1); }}
          className={`px-5 py-3 font-bold border-b-2 transition-all ${activeTab === "coupons" ? "border-brand-primary text-brand-primary" : "border-transparent text-brand-text-muted hover:text-brand-text"}`}
        >
          🏷️ Coupons & Auto Promotions
        </button>
        <button 
          onClick={() => { setActiveTab("giftcards"); setPage(1); }}
          className={`px-5 py-3 font-bold border-b-2 transition-all ${activeTab === "giftcards" ? "border-brand-primary text-brand-primary" : "border-transparent text-brand-text-muted hover:text-brand-text"}`}
        >
          💳 Gift Cards
        </button>
      </div>

      {/* Search and Bulk action tools */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <input 
          type="text"
          placeholder={`Search code, description or balance...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-brand-card border border-brand-border px-4 py-2 rounded-xl outline-none w-full sm:max-w-xs focus:border-brand-primary"
        />

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-brand-primary/5 border border-brand-primary/10 rounded-xl px-4 py-1.5 animate-fade-in w-full sm:w-auto justify-between">
            <span className="font-semibold text-brand-primary pr-2">{selectedIds.length} Selected</span>
            <div className="flex gap-2">
              <button 
                onClick={() => handleBulkAction("ENABLE")}
                className="bg-brand-secondary hover:bg-brand-border px-3 py-1.5 rounded-lg font-bold"
              >
                Enable
              </button>
              <button 
                onClick={() => handleBulkAction("DISABLE")}
                className="bg-brand-secondary hover:bg-brand-border px-3 py-1.5 rounded-lg font-bold"
              >
                Disable
              </button>
              <button 
                onClick={() => handleBulkAction("DELETE")}
                className="bg-brand-error text-white hover:opacity-90 px-3 py-1.5 rounded-lg font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main List Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-brand-card border rounded-3xl">
          <Loader2 className="animate-spin text-brand-primary" size={24} />
          <span className="ml-2 font-bold">Querying backend ledger...</span>
        </div>
      ) : activeTab === "coupons" ? (
        <div className="bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-secondary  border-b border-brand-border font-serif font-bold text-brand-text">
                <th className="px-6 py-4 w-10 text-center">
                  <button onClick={() => handleSelectAll(coupons)}>
                    <CheckSquare size={14} className={selectedIds.length === coupons.length && coupons.length > 0 ? "text-brand-primary" : "text-brand-text-muted"} />
                  </button>
                </th>
                <th className="px-6 py-4">Promo / Title</th>
                <th className="px-6 py-4">Rule / Priority</th>
                <th className="px-6 py-4">Min. Order</th>
                <th className="px-6 py-4">Scheduler Limit</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-brand-text-muted font-bold">No coupons or campaigns found matching query criteria.</td>
                </tr>
              ) : coupons.map((c) => (
                <tr key={c.id} className="hover:bg-brand-secondary/35 text-brand-text-muted font-medium">
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleSelectToggle(c.id)}>
                      {selectedIds.includes(c.id) ? (
                        <CheckSquare size={14} className="text-brand-primary" />
                      ) : (
                        <Square size={14} className="text-brand-border" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 flex flex-col gap-0.5">
                    <span className="font-mono font-bold text-brand-primary text-xs">
                      {c.is_automatic ? "🤖 AUTOMATIC" : c.code}
                    </span>
                    <span className="text-[10px] text-brand-text font-bold">{c.title}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="capitalize text-brand-text font-bold">
                        {c.type === "percentage" ? `${c.discount_value}% Off` : c.type === "fixed" ? `₹${c.discount_value} Off` : c.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[9px] text-brand-text-muted">Priority Tier: {c.priority} • Stack: {c.stackable ? "Yes" : "No"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-brand-text">₹{c.minimum_order_amount}</td>
                  <td className="px-6 py-4 text-[10px]">
                    <div className="flex flex-col">
                      <span>Uses: {c.times_used} / {c.usage_limit || "∞"}</span>
                      {c.starts_at && <span className="text-[9px] text-brand-text-muted">Starts: {new Date(c.starts_at).toLocaleDateString()}</span>}
                      {c.expires_at && <span className="text-[9px] text-brand-text-muted">Expires: {new Date(c.expires_at).toLocaleDateString()}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[9px] uppercase ${c.is_active ? "bg-brand-success/15 text-brand-success" : "bg-brand-text-muted/15 text-brand-text-muted"}`}>
                      {c.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleDuplicate(c.id)}
                        title="Duplicate Campaign"
                        className="p-1.5 hover:bg-brand-secondary text-brand-primary rounded-lg border border-brand-border"
                      >
                        <Copy size={12} />
                      </button>
                      <button 
                        onClick={() => handleEditClick(c)}
                        title="Edit Coupon"
                        className="p-1.5 hover:bg-brand-secondary text-brand-text rounded-lg border border-brand-border"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)}
                        title="Delete Campaign"
                        className="p-1.5 hover:bg-brand-secondary text-brand-error rounded-lg border border-brand-border"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-secondary  border-b border-brand-border font-serif font-bold text-brand-text">
                <th className="px-6 py-4 w-10 text-center">
                  <button onClick={() => handleSelectAll(giftCards)}>
                    <CheckSquare size={14} className={selectedIds.length === giftCards.length && giftCards.length > 0 ? "text-brand-primary" : "text-brand-text-muted"} />
                  </button>
                </th>
                <th className="px-6 py-4">Gift Card Code</th>
                <th className="px-6 py-4">Ledger Balance</th>
                <th className="px-6 py-4">Expires At</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {giftCards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-brand-text-muted font-bold">No gift cards configured in database.</td>
                </tr>
              ) : giftCards.map((g) => (
                <tr key={g.id} className="hover:bg-brand-secondary/35 text-brand-text-muted font-medium">
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleSelectToggle(g.id)}>
                      {selectedIds.includes(g.id) ? (
                        <CheckSquare size={14} className="text-brand-primary" />
                      ) : (
                        <Square size={14} className="text-brand-border" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-brand-primary text-xs">{g.code}</td>
                  <td className="px-6 py-4 font-mono font-bold text-brand-text">₹{g.balance}</td>
                  <td className="px-6 py-4 text-brand-text-muted">
                    {g.expires_at ? new Date(g.expires_at).toLocaleString() : "Never Expires"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[9px] uppercase ${g.is_active ? "bg-brand-success/15 text-brand-success" : "bg-brand-text-muted/15 text-brand-text-muted"}`}>
                      {g.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(g)}
                        title="Edit Gift Card"
                        className="p-1.5 hover:bg-brand-secondary text-brand-text rounded-lg border border-brand-border"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={() => handleDelete(g.id)}
                        className="p-1.5 hover:bg-brand-secondary text-brand-error rounded-lg border border-brand-border"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex justify-between items-center bg-brand-secondary  border border-brand-border rounded-xl px-4 py-2">
        <span className="text-[10px] text-brand-text-muted font-semibold">
          Showing Page {page} (Total Records: {activeTab === "coupons" ? couponTotal : giftCardTotal})
        </span>
        <div className="flex gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-1 bg-brand-card hover:bg-brand-border border border-brand-border rounded-lg disabled:opacity-50"
          >
            <ChevronLeft size={14} />
          </button>
          <button 
            disabled={(activeTab === "coupons" ? couponTotal : giftCardTotal) <= page * limit}
            onClick={() => setPage(page + 1)}
            className="p-1 bg-brand-card hover:bg-brand-border border border-brand-border rounded-lg disabled:opacity-50"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* CRUD DIALOG MODAL */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateOrUpdate} className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col gap-4 text-left">
            <div className="flex justify-between items-center border-b pb-3 mb-2">
              <h3 className="font-serif font-bold text-base text-brand-primary flex items-center gap-1.5">
                <Tag size={18} /> {editId ? "Update" : "Configure"} {activeTab === "coupons" ? "Campaign Promotion" : "Prepaid Gift Card"}
              </h3>
              <button type="button" onClick={() => setFormOpen(false)} className="p-1 hover:bg-brand-secondary rounded-full">
                <X size={16} />
              </button>
            </div>

            {activeTab === "coupons" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span>Is Automatic Promo?</span>
                  <select 
                    value={isAutomatic ? "true" : "false"}
                    onChange={(e) => setIsAutomatic(e.target.value === "true")}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                  >
                    <option value="false">No (Code-based Coupon)</option>
                    <option value="true">Yes (Auto-apply on checkout)</option>
                  </select>
                </div>

                {!isAutomatic && (
                  <div className="flex flex-col gap-1">
                    <span>Promo Coupon Code</span>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. FESTIVE20"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <span>Campaign Title</span>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Diwali Super Savings"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span>Promotion Type</span>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                  >
                    <option value="percentage">Percentage Off (%)</option>
                    <option value="fixed">Flat Amount Off (₹)</option>
                    <option value="buy_x_get_y">Buy X Get Y Free</option>
                    <option value="free_shipping">Free Shipping Campaign</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span>Discount Value</span>
                  <input 
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span>Maximum Discount Cap (₹)</span>
                  <input 
                    type="number"
                    placeholder="e.g. 500 (Optional)"
                    value={maximumDiscount}
                    onChange={(e) => setMaximumDiscount(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span>Minimum Cart Subtotal (₹)</span>
                  <input 
                    type="number"
                    required
                    value={minimumOrderAmount}
                    onChange={(e) => setMinimumOrderAmount(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span>Global Usage Limit</span>
                  <input 
                    type="number"
                    placeholder="e.g. 1000 (Optional)"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span>Usage Limit Per Customer</span>
                  <input 
                    type="number"
                    required
                    value={usagePerCustomer}
                    onChange={(e) => setUsagePerCustomer(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span>Rule Engine Priority</span>
                  <input 
                    type="number"
                    required
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span>Valid Starts At</span>
                  <input 
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span>Valid Expires At</span>
                  <input 
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                  />
                </div>

                {type === "buy_x_get_y" && (
                  <>
                    <div className="flex flex-col gap-1">
                      <span>Buy Quantity (X)</span>
                      <input 
                        type="number"
                        required
                        value={buyQuantity}
                        onChange={(e) => setBuyQuantity(e.target.value)}
                        className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span>Free Quantity (Y)</span>
                      <input 
                        type="number"
                        required
                        value={getQuantity}
                        onChange={(e) => setGetQuantity(e.target.value)}
                        className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2 flex flex-col gap-1">
                  <span>Promo Campaign Description</span>
                  <textarea 
                    required
                    rows={2}
                    placeholder="Short summary for client validation feedback..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="isFirstOrder"
                    checked={isFirstOrder}
                    onChange={(e) => setIsFirstOrder(e.target.checked)}
                    className="rounded text-brand-primary"
                  />
                  <label htmlFor="isFirstOrder">First Order Only?</label>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-brand-primary"
                  />
                  <label htmlFor="isActive">Is Active & Redeemable?</label>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="stackable"
                    checked={stackable}
                    onChange={(e) => setStackable(e.target.checked)}
                    className="rounded text-brand-primary"
                  />
                  <label htmlFor="stackable">Allow Combinations (Stackable)?</label>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span>Gift Card Code</span>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. WELCOMEGC"
                    value={gcCode}
                    onChange={(e) => setGcCode(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span>Card Balance Value (₹)</span>
                  <input 
                    type="number"
                    required
                    value={gcBalance}
                    onChange={(e) => setGcBalance(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span>Expires At (Optional)</span>
                  <input 
                    type="datetime-local"
                    value={gcExpiresAt}
                    onChange={(e) => setGcExpiresAt(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2 rounded-xl outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input 
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-brand-primary"
                  />
                  <label htmlFor="isActive">Active?</label>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4 border-t pt-3.5">
              <button 
                type="button" 
                onClick={() => setFormOpen(false)}
                className="border border-brand-border px-4 py-2 rounded-xl hover:bg-brand-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="bg-brand-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-brand-accent shadow"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PROMOTION SIMULATOR SANDBOX MODAL */}
      {simulatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto flex flex-col gap-4 text-left font-accent text-xs">
            <div className="flex justify-between items-center border-b pb-3 mb-2">
              <h3 className="font-serif font-bold text-base text-brand-primary flex items-center gap-1.5">
                <Play size={18} /> Promotion Draft Simulation Sandbox
              </h3>
              <button type="button" onClick={() => setSimulatorOpen(false)} className="p-1 hover:bg-brand-secondary rounded-full">
                <X size={16} />
              </button>
            </div>

            <p className="text-brand-text-muted mt-[-8px]">Preview calculations for a draft/hypothetical promotion on mock shopping cart states without writing data.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-2">
              {/* Left Column: Draft promotion config */}
              <div className="flex flex-col gap-4 bg-brand-secondary/40 border border-brand-border rounded-2xl p-4">
                <h4 className="font-bold text-brand-text">1. Mock Promotion Parameters</h4>
                
                <div className="flex flex-col gap-1">
                  <span>Discount Category</span>
                  <select 
                    value={simCoupon.type}
                    onChange={(e) => setSimCoupon({ ...simCoupon, type: e.target.value })}
                    className="bg-brand-card border border-brand-border px-3 py-1.5 rounded-xl outline-none"
                  >
                    <option value="percentage">Percentage Off (%)</option>
                    <option value="fixed">Flat Amount Off (₹)</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span>Discount Value</span>
                  <input 
                    type="number"
                    value={simCoupon.discount_value}
                    onChange={(e) => setSimCoupon({ ...simCoupon, discount_value: Number(e.target.value) })}
                    className="bg-brand-card border border-brand-border px-3 py-1.5 rounded-xl outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span>Minimum Threshold Amount (₹)</span>
                  <input 
                    type="number"
                    value={simCoupon.minimum_order_amount}
                    onChange={(e) => setSimCoupon({ ...simCoupon, minimum_order_amount: Number(e.target.value) })}
                    className="bg-brand-card border border-brand-border px-3 py-1.5 rounded-xl outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span>Maximum Discount Cap (₹)</span>
                  <input 
                    type="number"
                    value={simCoupon.maximum_discount}
                    onChange={(e) => setSimCoupon({ ...simCoupon, maximum_discount: Number(e.target.value) })}
                    className="bg-brand-card border border-brand-border px-3 py-1.5 rounded-xl outline-none"
                  />
                </div>

                <button 
                  onClick={runSimulation}
                  disabled={simLoading}
                  className="bg-brand-primary text-white hover:bg-brand-accent py-2.5 rounded-xl font-bold mt-2 shadow flex items-center justify-center gap-1.5"
                >
                  {simLoading ? <Loader2 className="animate-spin" size={14} /> : <>Run Calculations <Play size={10} /></>}
                </button>
              </div>

              {/* Right Column: Mock cart items and simulation outputs */}
              <div className="flex flex-col gap-4">
                <div className="bg-brand-secondary/40 border border-brand-border rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-brand-text">2. Simulated Cart Items</h4>
                    <button 
                      onClick={() => setSimItems([...simItems, { product_id: `p${simItems.length + 1}`, quantity: 1, product: { price: 100, name: "New Craft Mockup", category: "all" } }])}
                      className="text-brand-primary font-bold hover:underline"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                    {simItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 border-b border-brand-border/40 pb-2">
                        <input 
                          type="text"
                          placeholder="Name"
                          value={item.product.name}
                          onChange={(e) => {
                            const copy = [...simItems];
                            copy[idx].product.name = e.target.value;
                            setSimItems(copy);
                          }}
                          className="bg-brand-card border px-2 py-1 rounded w-full"
                        />
                        <input 
                          type="number"
                          placeholder="Price"
                          value={item.product.price}
                          onChange={(e) => {
                            const copy = [...simItems];
                            copy[idx].product.price = Number(e.target.value);
                            setSimItems(copy);
                          }}
                          className="bg-brand-card border px-2 py-1 rounded w-20"
                        />
                        <input 
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => {
                            const copy = [...simItems];
                            copy[idx].quantity = Number(e.target.value);
                            setSimItems(copy);
                          }}
                          className="bg-brand-card border px-2 py-1 rounded w-14"
                        />
                        <button 
                          onClick={() => setSimItems(simItems.filter((_, i) => i !== idx))}
                          className="text-brand-error"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Simulation Output */}
                {simResult ? (
                  <div className="bg-brand-success/5 border border-brand-success/20 rounded-2xl p-4 flex flex-col gap-3 font-semibold text-brand-text">
                    <h4 className="font-bold text-brand-success">📊 Calculation Breakdown Results</h4>
                    <div className="flex flex-col gap-2 border-b pb-2 text-[11px] font-mono font-medium">
                      <div className="flex justify-between">
                        <span>Cart Subtotal</span>
                        <span>₹{simResult.subtotal}</span>
                      </div>
                      <div className="flex justify-between text-brand-success">
                        <span>Promotion Discount</span>
                        <span>-₹{simResult.discount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping Delivery</span>
                        <span>₹{simResult.shipping}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST Tax (18%)</span>
                        <span>₹{simResult.tax}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-baseline text-sm">
                      <span className="font-bold text-brand-text">Grand Total</span>
                      <span className="font-mono text-base font-bold text-brand-primary">₹{simResult.grandTotal}</span>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-brand-border rounded-2xl py-10 text-center text-brand-text-muted font-bold">
                    Run draft calculations to output summary breakdown here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
