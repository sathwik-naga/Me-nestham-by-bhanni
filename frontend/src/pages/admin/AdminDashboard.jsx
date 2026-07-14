import React from "react";
import { Link } from "react-router-dom";
import { db } from "../../services/db";
import { 
  TrendingUp, ShoppingBag, Users, ShieldAlert, 
  ArrowUpRight, AlertCircle, CheckCircle2 
} from "lucide-react";

export default function AdminDashboard() {
  const products = db.getProducts();
  const orders = db.getOrders();
  const customers = db.getCustomers();

  // Computations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === "Paid" || o.paymentStatus === "Paid on Delivery (COD)" ? o.total : 0), 0);
  const totalSalesCount = orders.length;
  const totalCustomersCount = customers.length;
  
  // Stock alerts (stock <= 5)
  const lowStockItems = [];
  products.forEach(p => {
    if (p.variants) {
      p.variants.forEach(v => {
        if (v.stock <= 5) lowStockItems.push({ name: `${p.name} (${v.name})`, stock: v.stock, id: p.id });
      });
    } else {
      if (p.stockCount <= 5) lowStockItems.push({ name: p.name, stock: p.stockCount, id: p.id });
    }
  });

  const recentOrders = orders.slice(0, 5);

  const kpiCards = [
    {
      label: "Total Sales Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      desc: "Cumulative paid order volume",
      icon: <TrendingUp className="text-brand-success" size={20} />,
      color: "border-l-brand-success"
    },
    {
      label: "Total Orders placed",
      value: totalSalesCount,
      desc: "Cart checkouts completed",
      icon: <ShoppingBag className="text-brand-primary" size={20} />,
      color: "border-l-brand-primary"
    },
    {
      label: "Customer Base",
      value: totalCustomersCount,
      desc: "Registered store profiles",
      icon: <Users className="text-brand-accent" size={20} />,
      color: "border-l-brand-accent"
    },
    {
      label: "Inventory Alerts",
      value: lowStockItems.length,
      desc: "Items with critical stock levels",
      icon: <ShieldAlert className="text-brand-error animate-pulse-soft" size={20} />,
      color: "border-l-brand-error"
    }
  ];

  return (
    <div className="flex flex-col gap-8 font-accent">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, i) => (
          <div 
            key={i} 
            className={`bg-brand-card border-y border-r border-brand-border border-l-4 ${card.color} p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex justify-between items-start text-left`}
          >
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-brand-text-muted tracking-wider">{card.label}</span>
              <span className="text-xl font-bold text-brand-text mt-1.5">{card.value}</span>
              <span className="text-[10px] text-brand-text-muted mt-1 leading-tight">{card.desc}</span>
            </div>
            <div className="p-2.5 bg-brand-secondary dark:bg-[#201D1B] rounded-xl border border-brand-border/60">
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Orders list */}
        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-brand-text border-b border-brand-border pb-3 mb-5 text-left">
              Recent Transactions
            </h3>

            <div className="flex flex-col gap-3.5 text-xs text-left">
              {recentOrders.length === 0 ? (
                <p className="text-xs text-brand-text-muted py-6 text-center">No orders registered yet.</p>
              ) : (
                recentOrders.map((ord) => (
                  <div 
                    key={ord.id}
                    className="border border-brand-border bg-brand-secondary/20 p-4 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-serif font-bold text-brand-primary">Order #{ord.id}</p>
                      <p className="text-[10px] text-brand-text-muted mt-1 font-semibold">{ord.shippingAddress.fullName} — {ord.items.length} items</p>
                    </div>

                    <div className="flex items-center gap-4 text-brand-text">
                      <div className="flex flex-col items-end">
                        <span className="font-mono font-bold">₹{ord.total}</span>
                        <span className={`text-[9px] uppercase tracking-wider font-bold mt-0.5 ${
                          ord.paymentStatus.includes("Paid") ? "text-brand-success" : "text-brand-error"
                        }`}>
                          {ord.paymentStatus}
                        </span>
                      </div>
                      
                      <Link 
                        to={`/admin/orders`}
                        className="p-1.5 bg-brand-secondary hover:bg-brand-border border rounded-lg text-brand-primary"
                      >
                        <ArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-brand-border pt-4 mt-6 text-center">
            <Link to="/admin/orders" className="text-xs font-semibold text-brand-accent hover:underline">
              View All Customer Orders &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column: Low Stock Alerts list */}
        <div className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-brand-text border-b border-brand-border pb-3 mb-5 text-left flex items-center gap-1.5">
              <AlertCircle className="text-brand-error" size={16} /> Inventory Criticals
            </h3>

            <div className="flex flex-col gap-3.5 text-xs text-left max-h-96 overflow-y-auto pr-1">
              {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center text-brand-success font-semibold">
                  <CheckCircle2 size={24} />
                  <p className="text-xs">All item stocks are in order.</p>
                </div>
              ) : (
                lowStockItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="border border-brand-border bg-brand-error/5 p-3.5 rounded-xl flex items-center justify-between gap-3 text-brand-text"
                  >
                    <span className="font-bold truncate max-w-[150px]">{item.name}</span>
                    <span className="bg-brand-error/15 text-brand-error px-2 py-0.5 border border-brand-error/30 font-bold rounded-full font-mono text-[9px]">
                      Stock: {item.stock} left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-brand-border pt-4 mt-6 text-center">
            <Link to="/admin/inventory" className="text-xs font-semibold text-brand-accent hover:underline">
              Manage Inventory Stock levels &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
