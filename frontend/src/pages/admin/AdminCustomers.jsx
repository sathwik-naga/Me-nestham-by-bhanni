import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { getOrders } from "../../services/supabase/orders";
import { User, ShieldAlert, CheckCircle2, Eye, Phone, Mail, Loader2 } from "lucide-react";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [selectedCust, setSelectedCust] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCustomersData = async () => {
    try {
      setLoading(true);
      const [usersData, ordersData] = await Promise.all([
        api.get("/auth/users"),
        getOrders(1, 100)
      ]);

      const allUsers = usersData?.data?.users || [];
      const allOrders = ordersData?.orders || [];

      const mapped = allUsers.map((user) => {
        // Group orders by user ID to compute purchase stats
        const userOrders = allOrders.filter(o => o.userId === user.id);
        const totalSpent = userOrders.reduce((sum, o) => sum + (o.paymentStatus === "Paid" ? o.total : 0), 0);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A",
          totalOrders: userOrders.length,
          totalSpent: totalSpent,
          status: "Active"
        };
      });

      setCustomers(mapped);
    } catch (err) {
      console.error("Failed to load customer list details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomersData();
  }, []);

  const handleToggleStatus = () => {
    alert("Account suspension feature is Coming Soon.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 font-accent text-brand-text">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          <span className="text-xs font-semibold text-brand-text-muted">Loading customer profiles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-accent text-left relative text-xs text-brand-text">
      <div className="flex items-center justify-between border-b border-brand-border pb-4">
        <span className="text-brand-text-muted">Manage consumer profile accounts and spent statistics.</span>
      </div>

      {selectedCust ? (
        // DETAIL POPUP VIEW
        <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-md flex flex-col gap-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-serif font-bold text-lg text-brand-text flex items-center gap-2">
              <User size={20} className="text-brand-primary" /> Customer Profile: {selectedCust.name}
            </h3>
            <button onClick={() => setSelectedCust(null)} className="font-semibold text-brand-accent hover:underline">
              Back to Directory
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4 border-r pr-6">
              <div className="flex items-center gap-3 bg-brand-secondary/30 p-4 rounded-2xl border">
                <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center font-bold text-brand-primary text-base">
                  {selectedCust.name?.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{selectedCust.name}</h4>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">Joined: {selectedCust.joinDate}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <span className="font-bold uppercase tracking-wider text-[10px]">Contact channels</span>
                <span className="flex items-center gap-2 text-brand-text-muted"><Mail size={13} /> {selectedCust.email}</span>
                <span className="flex items-center gap-2 text-brand-text-muted"><Phone size={13} /> {selectedCust.phone || "No phone added"}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 text-brand-text">
              <span className="font-bold uppercase tracking-wider text-[10px] border-b pb-1.5">Purchase Statistics</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-brand-secondary/30 p-4 rounded-xl border">
                  <span className="text-[9px] uppercase tracking-wider text-brand-text-muted font-bold">Total Orders</span>
                  <p className="text-lg font-bold mt-1 text-brand-primary">{selectedCust.totalOrders}</p>
                </div>
                <div className="bg-brand-secondary/30 p-4 rounded-xl border">
                  <span className="text-[9px] uppercase tracking-wider text-brand-text-muted font-bold">Total Spent</span>
                  <p className="text-lg font-bold mt-1 text-brand-primary font-mono">₹{selectedCust.totalSpent}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4 mt-2">
                <span>Account Status: <span className={`font-bold uppercase ml-1 ${selectedCust.status === "Active" ? "text-brand-success" : "text-brand-error"}`}>{selectedCust.status}</span></span>
                <button
                  onClick={() => handleToggleStatus(selectedCust)}
                  className="px-4 py-2 rounded-xl font-semibold shadow-sm transition-all border bg-brand-secondary border-brand-border text-brand-text-muted hover:bg-brand-primary hover:text-white"
                >
                  Suspend (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // DIRECTORY LIST TABLE
        <div className="bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-secondary  border-b border-brand-border font-serif font-bold text-brand-text">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Join Date</th>
                  <th className="px-6 py-4">Total Orders</th>
                  <th className="px-6 py-4">Total Spent</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-brand-secondary/35 text-brand-text-muted font-medium">
                    <td className="px-6 py-3 font-serif font-bold text-brand-text flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center font-bold text-brand-primary">
                        {cust.name?.charAt(0)}
                      </div>
                      {cust.name}
                    </td>
                    <td className="px-6 py-3 font-mono">{cust.email}</td>
                    <td className="px-6 py-3">{cust.joinDate}</td>
                    <td className="px-6 py-3 font-semibold">{cust.totalOrders} Orders</td>
                    <td className="px-6 py-3 font-mono font-bold text-brand-primary">₹{cust.totalSpent}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cust.status === "Active" ? "bg-green-50 text-brand-success border border-brand-success/20" : "bg-red-50 text-brand-error border border-brand-error/20"
                      }`}>
                        {cust.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => setSelectedCust(cust)}
                        className="p-1.5 hover:bg-brand-secondary text-brand-accent rounded-lg border flex items-center gap-1 mx-auto font-semibold"
                      >
                        <Eye size={12} /> View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
