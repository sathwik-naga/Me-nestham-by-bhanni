import React, { useState } from "react";
import { db } from "../../services/db";
import { Edit3, Check, Save, X, Phone, Calendar, MapPin, Eye } from "lucide-react";

export default function AdminOrders() {
  const [orders, setOrders] = useState(db.getOrders());
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusVal, setStatusVal] = useState("Confirmed");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const handleOpenDetail = (ord) => {
    setSelectedOrder(ord);
    setStatusVal(ord.status);
    setTrackingNumber(ord.trackingNumber || "");
    setAdminNote("");
  };

  const handleUpdateStatusSubmit = (e) => {
    e.preventDefault();
    if (selectedOrder) {
      db.updateOrderStatus(selectedOrder.id, statusVal, trackingNumber, adminNote);
      setOrders(db.getOrders());
      setSelectedOrder(null);
      alert("Order fulfillment status updated successfully.");
    }
  };

  return (
    <div className="flex flex-col gap-6 font-accent text-left relative text-xs text-brand-text">
      {/* Detail overlay popup panel */}
      {selectedOrder ? (
        <div className="bg-brand-card border border-brand-border rounded-3xl p-6 md:p-8 shadow-md flex flex-col gap-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-serif font-bold text-lg text-brand-text">
              Manage Order Details: #{selectedOrder.id}
            </h3>
            <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-brand-secondary rounded-full">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Summary and items */}
            <div className="flex flex-col gap-5 border-r border-brand-border/60 pr-6">
              <div className="flex flex-col gap-1 text-[11px] leading-relaxed">
                <span className="font-bold text-brand-text block mb-1">Fulfillment Address</span>
                <span className="font-bold text-brand-primary">{selectedOrder.shippingAddress.fullName}</span>
                <span>{selectedOrder.shippingAddress.addressLine1}</span>
                {selectedOrder.shippingAddress.addressLine2 && <span>{selectedOrder.shippingAddress.addressLine2}</span>}
                <span>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</span>
                <span className="flex items-center gap-1 mt-1 font-semibold text-brand-text"><Phone size={11} /> {selectedOrder.shippingAddress.phone}</span>
              </div>

              <div>
                <span className="font-bold text-brand-text block border-b pb-1.5 mb-2.5">Purchased Items</span>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-brand-secondary/35 p-2 rounded-xl">
                      <img src={item.image} alt={item.name} className="w-8 h-8 rounded border object-cover" />
                      <div className="flex-1 overflow-hidden">
                        <p className="font-serif font-bold text-[10px] text-brand-text truncate">{item.name}</p>
                        <p className="text-[9px] text-brand-text-muted">Qty: {item.quantity} {item.variant ? `(${item.variant})` : ""}</p>
                      </div>
                      <span className="font-mono text-[10px] font-bold">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t text-[10px] text-brand-text-muted">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-brand-success font-semibold">
                    <span>Discount Coupon applied</span>
                    <span className="font-mono">-₹{selectedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-mono">{selectedOrder.shipping === 0 ? "FREE" : `₹${selectedOrder.shipping}`}</span>
                </div>
                <div className="flex justify-between font-bold text-xs text-brand-text border-t pt-2 mt-1">
                  <span>Grand Total</span>
                  <span className="font-mono text-brand-primary">₹{selectedOrder.total}</span>
                </div>
              </div>
            </div>

            {/* Right: Update status controls */}
            <form onSubmit={handleUpdateStatusSubmit} className="flex flex-col gap-4">
              <span className="font-bold border-b pb-1.5 block">Fulfillment Settings</span>
              
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold">Order Fulfillment Status</span>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="bg-brand-secondary border px-3.5 py-2.5 rounded-xl outline-none"
                >
                  <option value="Placed">Placed</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Packed">Packed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-semibold">Courier Tracking Number (AWB)</span>
                <input
                  type="text"
                  placeholder="e.g. TRK-9831204"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="bg-brand-secondary border px-3.5 py-2.5 rounded-xl outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-semibold">Fulfillment Log Note (Optional)</span>
                <input
                  type="text"
                  placeholder="e.g. Dispatched via Delhivery Express."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="bg-brand-secondary border px-3.5 py-2.5 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="border border-brand-border px-5 py-2.5 rounded-xl hover:bg-brand-secondary font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-accent text-white px-6 py-2.5 rounded-xl shadow-md font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Save size={12} /> Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        // LIST VIEW TABLE
        <div className="bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-secondary dark:bg-[#201D1B] border-b border-brand-border font-serif font-bold text-brand-text">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Recipient Name</th>
                <th className="px-6 py-4">Fulfillment Date</th>
                <th className="px-6 py-4">Order Total</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Fulfill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-brand-secondary/35 text-brand-text-muted font-medium">
                  <td className="px-6 py-3 font-mono font-bold text-brand-primary">{ord.id}</td>
                  <td className="px-6 py-3 font-serif font-bold text-brand-text">{ord.shippingAddress.fullName}</td>
                  <td className="px-6 py-3">{new Date(ord.date).toLocaleDateString()}</td>
                  <td className="px-6 py-3 font-mono font-bold text-brand-primary">₹{ord.total}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ord.paymentStatus.includes("Paid") ? "bg-green-50 text-brand-success border border-brand-success/20" : "bg-red-50 text-brand-error border border-brand-error/20"
                    }`}>
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ord.status === "Delivered" ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" :
                      ord.status === "Cancelled" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => handleOpenDetail(ord)}
                      className="p-1.5 hover:bg-brand-secondary text-brand-accent rounded-lg border flex items-center gap-1 mx-auto font-semibold"
                    >
                      <Eye size={12} /> Manage
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
