import React, { useState } from "react";
import { db } from "../../services/db";
import { Plus, Trash2, Check, Save, X, Tag } from "lucide-react";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState(db.getCoupons());
  const [formOpen, setFormOpen] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [type, setType] = useState("percentage"); // percentage, fixed
  const [value, setValue] = useState(10);
  const [minOrderValue, setMinOrderValue] = useState(500);
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setCode("");
    setType("percentage");
    setValue(10);
    setMinOrderValue(500);
    setDescription("");
  };

  const handleDeleteClick = (code) => {
    if (window.confirm(`Are you sure you want to delete coupon code ${code}?`)) {
      db.deleteCoupon(code);
      setCoupons(db.getCoupons());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim() || !description.trim()) {
      alert("Please fill in code name and description.");
      return;
    }

    const compiled = {
      code: code.trim().toUpperCase(),
      type,
      value: Number(value),
      minOrderValue: Number(minOrderValue),
      description: description.trim()
    };

    db.saveCoupon(compiled);
    setCoupons(db.getCoupons());
    setFormOpen(false);
    resetForm();
  };

  return (
    <div className="flex flex-col gap-6 font-accent text-left relative text-xs text-brand-text">
      {/* Top action header */}
      <div className="flex items-center justify-between border-b border-brand-border pb-4">
        <span className="text-brand-text-muted">Configure active discount campaigns and validation limits.</span>
        {!formOpen && (
          <button 
            onClick={() => { resetForm(); setFormOpen(true); }}
            className="bg-brand-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-accent shadow flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} /> Add Coupon
          </button>
        )}
      </div>

      {formOpen ? (
        // ADD FORM
        <form onSubmit={handleSubmit} className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-md flex flex-col gap-5 max-w-xl">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-serif font-bold text-base flex items-center gap-2">
              <Tag size={18} className="text-brand-primary" /> Create Campaign Coupon
            </h3>
            <button type="button" onClick={() => { setFormOpen(false); resetForm(); }}>
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <span>Coupon Code (Upper Case)</span>
              <input
                type="text"
                required
                placeholder="e.g. WELCOME10"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span>Discount Category</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
              >
                <option value="percentage">Percentage Off (%)</option>
                <option value="fixed">Flat Surchanged Reduction (₹)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span>Discount Value ({type === "percentage" ? "%" : "₹"})</span>
              <input
                type="number"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span>Minimum Cart Threshold (₹)</span>
              <input
                type="number"
                required
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                className="bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <span>Campaign Description</span>
              <input
                type="text"
                required
                placeholder="e.g. Get 10% off on your first order. Minimum order of ₹500 required."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2 border-t pt-3">
            <button 
              type="button" 
              onClick={() => { setFormOpen(false); resetForm(); }}
              className="border border-brand-border px-4 py-2.5 rounded-xl hover:bg-brand-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-brand-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-brand-accent shadow"
            >
              <Save size={12} /> Save Coupon
            </button>
          </div>
        </form>
      ) : (
        // TABLE VIEW
        <div className="bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-secondary dark:bg-[#201D1B] border-b border-brand-border font-serif font-bold text-brand-text">
                <th className="px-6 py-4">Promo Code</th>
                <th className="px-6 py-4">Discount Type</th>
                <th className="px-6 py-4">Rate / Amount</th>
                <th className="px-6 py-4">Min. Threshold</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {coupons.map((c) => (
                <tr key={c.code} className="hover:bg-brand-secondary/35 text-brand-text-muted font-medium">
                  <td className="px-6 py-3 font-mono font-bold text-brand-primary">{c.code}</td>
                  <td className="px-6 py-3 capitalize">{c.type}</td>
                  <td className="px-6 py-3 font-mono font-bold text-brand-text">{c.type === "percentage" ? `${c.value}%` : `₹${c.value}`}</td>
                  <td className="px-6 py-3 font-mono">₹{c.minOrderValue}</td>
                  <td className="px-6 py-3 max-w-[200px] truncate" title={c.description}>{c.description}</td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => handleDeleteClick(c.code)}
                      className="p-1.5 hover:bg-brand-secondary text-brand-error rounded-lg border mx-auto flex items-center justify-center"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
