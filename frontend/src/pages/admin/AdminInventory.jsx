import React, { useState, useEffect } from "react";
import { getProducts, updateProduct } from "../../services/supabase/products";
import { Save, AlertCircle, CheckCircle2, SlidersHorizontal, Edit3, Loader2 } from "lucide-react";

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [editSkuId, setEditSkuId] = useState(null); // id or variant id
  const [editVal, setEditVal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadProductsData = async () => {
    try {
      setLoading(true);
      const prodsData = await getProducts();
      setProducts(prodsData || []);
    } catch (err) {
      console.error("Failed to load inventory products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductsData();
  }, []);

  const handleEditClick = (id, stock) => {
    setEditSkuId(id);
    setEditVal(stock);
  };

  const handleSaveStock = async (prod, variantId = null) => {
    const payload = {};
    if (variantId && prod.variants) {
      payload.variants = prod.variants.map(v => {
        const isTarget = v.id === variantId;
        return {
          sku: v.sku || `SKU-${prod.name.substring(0, 3).toUpperCase()}-${v.name.substring(0, 3).toUpperCase()}`,
          name: v.name,
          price: Number(v.price),
          stock_quantity: Number(isTarget ? editVal : v.stock)
        };
      });
      payload.stock = payload.variants.reduce((sum, v) => sum + Number(v.stock_quantity), 0);
    } else {
      payload.stock = Number(editVal);
    }

    try {
      await updateProduct(prod.id, payload);
      
      // Update local storage cache to keep storefront updated instantly
      const allProdsMapped = await getProducts();
      localStorage.setItem("mn_products", JSON.stringify(allProdsMapped));

      await loadProductsData();
      setEditSkuId(null);
      alert("Inventory stock updated successfully.");
    } catch (err) {
      alert(err.message || "Failed to update inventory stock.");
    }
  };

  // Compile row listings for table
  const inventoryRows = [];
  products.forEach(p => {
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach(v => {
        const isLow = v.stock <= 5;
        if (!lowStockFilter || isLow) {
          inventoryRows.push({
            prod: p,
            name: `${p.name} (${v.name})`,
            sku: (v.sku || v.id).toUpperCase(),
            stock: v.stock,
            isLow,
            variantId: v.id
          });
        }
      });
    } else {
      const isLow = p.stockCount <= 5;
      if (!lowStockFilter || isLow) {
        inventoryRows.push({
          prod: p,
          name: p.name,
          sku: p.id.substring(0, 8).toUpperCase(),
          stock: p.stockCount,
          isLow,
          variantId: null
        });
      }
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 font-accent text-brand-text">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          <span className="text-xs font-semibold text-brand-text-muted">Loading inventory stock...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-accent text-left relative text-xs text-brand-text">
      {/* Filters header */}
      <div className="flex items-center justify-between border-b border-brand-border pb-4 bg-brand-secondary/20 p-4 rounded-2xl">
        <span className="text-brand-text-muted">Quick inline modifiers to manage live product stock levels.</span>
        
        <div className="flex items-center gap-3">
          <span className="text-brand-text-muted font-medium">Filter Stock:</span>
          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1 shadow-sm transition-colors ${
              lowStockFilter 
                ? "bg-brand-error/15 border-brand-error/30 text-brand-error" 
                : "bg-brand-card border-brand-border text-brand-text hover:bg-brand-secondary"
            }`}
          >
            <AlertCircle size={12} /> {lowStockFilter ? "Showing Criticals Only" : "Show Critical Stock Level (<=5)"}
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      <div className="bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-secondary  border-b border-brand-border font-serif font-bold text-brand-text">
                <th className="px-6 py-4">SKU Code</th>
                <th className="px-6 py-4">Item Name / Option</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Stock Value</th>
                <th className="px-6 py-4">Level Status</th>
                <th className="px-6 py-4 text-center">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {inventoryRows.map((row, idx) => {
                const editKey = row.variantId || row.prod.id;
                const isEditing = editSkuId === editKey;

                return (
                  <tr key={idx} className="hover:bg-brand-secondary/35 text-brand-text-muted font-medium">
                    <td className="px-6 py-3 font-mono font-bold">{row.sku}</td>
                    <td className="px-6 py-3 font-serif font-bold text-brand-text">{row.name}</td>
                    <td className="px-6 py-3 capitalize">{row.prod.category ? row.prod.category.replace("-", " ") : ""}</td>
                    <td className="px-6 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editVal}
                          onChange={(e) => setEditVal(e.target.value)}
                          className="bg-brand-secondary border px-2 py-1 rounded w-20 outline-none font-mono font-bold text-brand-text focus:border-brand-primary"
                          autoFocus
                        />
                      ) : (
                        <span className="font-mono font-semibold">{row.stock} items</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {row.isLow ? (
                        <span className="bg-red-50 dark:bg-red-950/20 text-brand-error px-2 py-0.5 border border-brand-error/20 rounded font-bold text-[10px] flex items-center gap-1.5 w-fit">
                          <AlertCircle size={10} /> Critical Low
                        </span>
                      ) : (
                        <span className="bg-green-50 dark:bg-green-950/20 text-brand-success px-2 py-0.5 border border-brand-success/20 rounded font-bold text-[10px] flex items-center gap-1.5 w-fit">
                          <CheckCircle2 size={10} /> Good Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveStock(row.prod, row.variantId)}
                          className="p-1.5 bg-brand-primary text-white hover:bg-brand-accent rounded-lg flex items-center justify-center mx-auto cursor-pointer"
                        >
                          <Save size={13} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditClick(editKey, row.stock)}
                          className="p-1.5 hover:bg-brand-secondary text-brand-accent rounded-lg border mx-auto flex items-center justify-center cursor-pointer"
                        >
                          <Edit3 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
