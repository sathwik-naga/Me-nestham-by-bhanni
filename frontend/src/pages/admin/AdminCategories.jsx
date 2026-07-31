import React, { useState, useEffect } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../../services/supabase/categories";
import { getProducts } from "../../services/supabase/products";
import { Plus, Edit, Trash2, Check, Save, X, Loader2 } from "lucide-react";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");

  const loadCategoriesData = async () => {
    try {
      setLoading(true);
      const [catsData, products] = await Promise.all([
        getCategories(),
        getProducts()
      ]);
      const mapped = catsData.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        image: c.image_url || "/placeholder.png",
        productCount: products.filter(p => p.category === c.slug).length
      }));
      setCategories(mapped);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategoriesData();
  }, []);

  const resetForm = () => {
    setName("");
    setImage("");
    setDescription("");
    setEditingCategory(null);
  };

  const handleEditClick = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setImage(cat.image);
    setDescription(cat.description);
    setFormOpen(true);
  };

  const handleDeleteClick = async (id) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    
    if (cat.productCount > 0) {
      alert("Denied: You cannot delete this category because there are active products associated with it.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory(id);
        
        // Sync local storage
        const rawCats = await getCategories();
        const products = await getProducts();
        const mappedCategories = rawCats.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || "",
          image: c.image_url || "/placeholder.png",
          productCount: products.filter((p) => p.category === c.slug).length,
        }));
        localStorage.setItem("mn_categories", JSON.stringify(mappedCategories));

        await loadCategoriesData();
        alert("Category deleted successfully.");
      } catch (err) {
        alert(err.message || "Failed to delete category.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !image.trim() || !description.trim()) {
      alert("Please fill in all categories input fields.");
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      image_url: image.trim(),
      is_active: true
    };

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        alert("Category updated successfully.");
      } else {
        await createCategory(payload);
        alert("Category created successfully.");
      }
      
      // Update local storage categories as well to keep customer storefront updated instantly
      const rawCats = await getCategories();
      const products = await getProducts();
      const mappedCategories = rawCats.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        image: c.image_url || "/placeholder.png",
        productCount: products.filter((p) => p.category === c.slug).length,
      }));
      localStorage.setItem("mn_categories", JSON.stringify(mappedCategories));

      await loadCategoriesData();
      setFormOpen(false);
      resetForm();
    } catch (err) {
      alert(err.message || "Failed to save category.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 font-accent text-brand-text">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          <span className="text-xs font-semibold text-brand-text-muted">Loading categories...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-accent text-left relative text-xs text-brand-text">
      {/* Action triggers */}
      <div className="flex items-center justify-between border-b border-brand-border pb-4">
        <span className="text-brand-text-muted">Manage product discovery category collections.</span>
        {!formOpen && (
          <button 
            onClick={() => { resetForm(); setFormOpen(true); }}
            className="bg-brand-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-accent shadow flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} /> Add Category
          </button>
        )}
      </div>

      {formOpen ? (
        // FORM VIEW
        <form onSubmit={handleSubmit} className="bg-brand-card border border-brand-border rounded-3xl p-6 shadow-md flex flex-col gap-5 max-w-xl">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-serif font-bold text-base">
              {editingCategory ? `Edit: ${editingCategory.name}` : "Create Catalog Category"}
            </h3>
            <button type="button" onClick={() => { setFormOpen(false); resetForm(); }}>
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span>Category Title</span>
              <input
                type="text"
                required
                placeholder="e.g. Traditional Fine Art"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span>Category Banner Image URL</span>
              <input
                type="url"
                required
                placeholder="https://example.com/banner.png"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span>Description summary</span>
              <textarea
                rows={3}
                required
                placeholder="Brief summary of legacy art collections..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-brand-secondary border border-brand-border p-3.5 rounded-xl outline-none"
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
              className="bg-brand-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-brand-accent shadow flex items-center gap-1 cursor-pointer"
            >
              <Save size={12} /> Save Category
            </button>
          </div>
        </form>
      ) : (
        // TABLE VIEW
        <div className="bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-secondary  border-b border-brand-border font-serif font-bold text-brand-text">
                <th className="px-6 py-4">Banner</th>
                <th className="px-6 py-4">Category Name</th>
                <th className="px-6 py-4">Slug link</th>
                <th className="px-6 py-4">Total Products</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-brand-secondary/35 text-brand-text-muted font-medium">
                  <td className="px-6 py-3">
                    <img src={cat.image} alt={cat.name} className="w-12 h-10 object-cover rounded-lg border" />
                  </td>
                  <td className="px-6 py-3 font-serif font-bold text-brand-text">{cat.name}</td>
                  <td className="px-6 py-3 font-mono">{cat.slug}</td>
                  <td className="px-6 py-3 font-semibold">{cat.productCount} Items</td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleEditClick(cat)}
                        className="p-1.5 hover:bg-brand-secondary text-brand-accent rounded-lg border"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(cat.id)}
                        className="p-1.5 hover:bg-brand-secondary text-brand-error rounded-lg border"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
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
