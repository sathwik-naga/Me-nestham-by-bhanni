import React, { useState } from "react";
import { db } from "../../services/db";
import { aiService } from "../../services/ai";
import { 
  Plus, Edit, Trash2, Tag, Wand2, Eye, 
  Check, Save, X, Sparkles, Loader2 
} from "lucide-react";

export default function AdminProducts() {
  const [products, setProducts] = useState(db.getProducts());
  const [categories] = useState(db.getCategories());

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form inputs
  const [name, setName] = useState("");
  const [category, setCategory] = useState("home-decor");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(500);
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [stockCount, setStockCount] = useState(10);
  const [isBestseller, setIsBestseller] = useState(false);
  
  // Variant helper builder
  const [variantType, setVariantType] = useState("Color");
  const [variantName, setVariantName] = useState("");
  const [variantPrice, setVariantPrice] = useState(500);
  const [variantStock, setVariantStock] = useState(10);
  const [productVariants, setProductVariants] = useState([]);

  // SEO inputs
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState("");

  // AI loading flags
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingSEO, setGeneratingSEO] = useState(false);

  const resetForm = () => {
    setName("");
    setCategory("home-decor");
    setShortDescription("");
    setDescription("");
    setPrice(500);
    setCompareAtPrice("");
    setImages([]);
    setImageUrlInput("");
    setStockCount(10);
    setIsBestseller(false);
    setVariantType("Color");
    setVariantName("");
    setVariantPrice(500);
    setVariantStock(10);
    setProductVariants([]);
    setMetaTitle("");
    setMetaDescription("");
    setKeywords("");
    setEditingProduct(null);
  };

  const handleEditClick = (prod) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCategory(prod.category);
    setShortDescription(prod.shortDescription || "");
    setDescription(prod.description);
    setPrice(prod.price);
    setCompareAtPrice(prod.compareAtPrice || "");
    setImages(prod.images || []);
    setStockCount(prod.stockCount || 0);
    setIsBestseller(prod.isBestseller || false);
    setProductVariants(prod.variants || []);
    setMetaTitle(prod.seo?.metaTitle || "");
    setMetaDescription(prod.seo?.metaDescription || "");
    setKeywords(prod.seo?.keywords || "");
    setFormOpen(true);
  };

  const handleDeleteClick = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      db.deleteProduct(id);
      setProducts(db.getProducts());
    }
  };

  const handleAddImage = (e) => {
    e.preventDefault();
    if (imageUrlInput.trim() && !images.includes(imageUrlInput.trim())) {
      setImages([...images, imageUrlInput.trim()]);
      setImageUrlInput("");
    }
  };

  const handleRemoveImage = (img) => {
    setImages(images.filter(i => i !== img));
  };

  const handleAddVariant = (e) => {
    e.preventDefault();
    if (variantName.trim()) {
      setProductVariants([
        ...productVariants,
        {
          id: "v-" + Math.random().toString(36).substr(2, 5),
          type: variantType,
          name: variantName.trim(),
          price: Number(variantPrice),
          stock: Number(variantStock)
        }
      ]);
      setVariantName("");
    }
  };

  const handleRemoveVariant = (id) => {
    setProductVariants(productVariants.filter(v => v.id !== id));
  };

  // Generate description with AI
  const handleGenerateAIDescription = async () => {
    if (!name) {
      alert("Please provide a product name before generating a description.");
      return;
    }
    setGeneratingDescription(true);
    const tags = productVariants.map(v => v.name).join(", ");
    try {
      const generated = await aiService.generateProductDescription(name, category, tags);
      setDescription(generated);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Generate SEO with AI
  const handleGenerateAISEO = async () => {
    if (!name || !description) {
      alert("Product name and description are required to generate SEO suggestions.");
      return;
    }
    setGeneratingSEO(true);
    try {
      const generated = await aiService.generateSEOSuggestions(name, category, description);
      setMetaTitle(generated.metaTitle);
      setMetaDescription(generated.metaDescription);
      setKeywords(generated.keywords);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingSEO(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (images.length === 0) {
      alert("Please add at least one product image URL.");
      return;
    }

    const compiledProduct = {
      id: editingProduct ? editingProduct.id : "prod-" + Math.floor(1000 + Math.random() * 9000),
      name: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
      category,
      shortDescription: shortDescription.trim() || name.trim(),
      description: description.trim(),
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      images,
      inStock: productVariants.length > 0 ? productVariants.some(v => v.stock > 0) : Number(stockCount) > 0,
      stockCount: productVariants.length > 0 ? productVariants.reduce((sum, v) => sum + v.stock, 0) : Number(stockCount),
      isNew: editingProduct ? editingProduct.isNew : true,
      isBestseller,
      variants: productVariants,
      specs: editingProduct ? editingProduct.specs : {
        "Material": "Artisan craftwork",
        "Origin": "India",
        "Packaging": "Recycled box packaging"
      },
      reviews: editingProduct ? editingProduct.reviews : [],
      seo: {
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        keywords: keywords.trim()
      }
    };

    db.saveProduct(compiledProduct);
    setProducts(db.getProducts());
    setFormOpen(false);
    resetForm();
  };

  return (
    <div className="flex flex-col gap-6 font-accent text-left relative">
      {/* Top action header */}
      <div className="flex items-center justify-between border-b border-brand-border pb-4">
        <span className="text-xs text-brand-text-muted">Manage the store product catalog details.</span>
        {!formOpen && (
          <button 
            onClick={() => { resetForm(); setFormOpen(true); }}
            className="bg-brand-primary text-white text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-accent shadow flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} /> Add Product
          </button>
        )}
      </div>

      {formOpen ? (
        // EDIT / NEW PRODUCT FORM
        <form onSubmit={handleSubmit} className="bg-brand-card border border-brand-border rounded-3xl p-6 md:p-8 shadow-md flex flex-col gap-6 text-xs text-brand-text">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <h3 className="font-serif font-bold text-lg text-brand-text">
              {editingProduct ? `Edit Details: ${editingProduct.name}` : "Create New Catalog Product"}
            </h3>
            <button 
              type="button" 
              onClick={() => { setFormOpen(false); resetForm(); }}
              className="p-1 hover:bg-brand-secondary rounded-full"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1: Info */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold">Product Name</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sterling Silver Necklace"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-semibold">Store Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold">Price (₹)</span>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold">Compare MRP (₹)</span>
                  <input
                    type="number"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Stock input (visible only when no variants built) */}
              {productVariants.length === 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold">Inventory Stock Count</span>
                  <input
                    type="number"
                    value={stockCount}
                    onChange={(e) => setStockCount(e.target.value)}
                    className="bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 border-t pt-3 mt-1">
                <input
                  type="checkbox"
                  id="bestsellerCheck"
                  checked={isBestseller}
                  onChange={(e) => setIsBestseller(e.target.checked)}
                  className="w-4 h-4 accent-brand-primary"
                />
                <label htmlFor="bestsellerCheck" className="font-semibold">Pin as Store Bestseller</label>
              </div>
            </div>

            {/* Column 2: Media & Variants */}
            <div className="flex flex-col gap-4">
              {/* Media URL add */}
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold">Product Image URLs</span>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1 bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none"
                  />
                  <button 
                    onClick={handleAddImage}
                    className="bg-brand-secondary hover:bg-brand-border px-4 border rounded-xl"
                  >
                    Add
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap mt-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-brand-border group shrink-0 bg-stone-100">
                      <img src={img} alt="thumb" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => handleRemoveImage(img)}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variant builder section */}
              <div className="border border-brand-border/60 bg-brand-secondary/30 rounded-2xl p-4 flex flex-col gap-3">
                <span className="font-bold border-b pb-1.5">Configure Options / Variants</span>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={variantType}
                    onChange={(e) => setVariantType(e.target.value)}
                    className="bg-brand-card border px-2.5 py-1.5 rounded-lg outline-none"
                  >
                    <option value="Color">Color</option>
                    <option value="Size">Size</option>
                    <option value="Material">Material</option>
                    <option value="Gemstone">Gemstone</option>
                  </select>
                  <input
                    type="text"
                    placeholder="e.g. Natural Gold"
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                    className="bg-brand-card border px-2.5 py-1.5 rounded-lg outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Price override (₹)"
                    value={variantPrice}
                    onChange={(e) => setVariantPrice(e.target.value)}
                    className="bg-brand-card border px-2.5 py-1.5 rounded-lg outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Variant Stock"
                    value={variantStock}
                    onChange={(e) => setVariantStock(e.target.value)}
                    className="bg-brand-card border px-2.5 py-1.5 rounded-lg outline-none"
                  />
                </div>
                <button
                  onClick={handleAddVariant}
                  className="bg-brand-secondary hover:bg-brand-border border rounded-lg py-1.5 text-[10px] font-bold"
                >
                  + Add Variant Option
                </button>

                <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {productVariants.map((v) => (
                    <div key={v.id} className="flex items-center justify-between bg-brand-card border p-2 rounded-xl text-[10px]">
                      <span>{v.type}: **{v.name}** (₹{v.price}, Stock: {v.stock})</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveVariant(v.id)}
                        className="text-brand-error hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: AI Description Copy & SEO */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold">Short Sub-tagline Description</span>
                <input
                  type="text"
                  placeholder="e.g. A set of 6 hand-carved terracotta diyas"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="bg-brand-secondary border border-brand-border px-3.5 py-2.5 rounded-xl outline-none focus:border-brand-primary"
                />
              </div>

              {/* Rich description with AI generator button */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Detailed Brand Copy Description</span>
                  <button
                    type="button"
                    onClick={handleGenerateAIDescription}
                    disabled={generatingDescription}
                    className="text-brand-accent hover:text-brand-primary font-bold flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                  >
                    {generatingDescription ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <><Sparkles size={12} /> Generate Copy</>
                    )}
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="Detailed material story, artisan origin hubs..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-brand-secondary border border-brand-border p-3.5 rounded-xl outline-none focus:border-brand-primary"
                />
              </div>

              {/* SEO details */}
              <div className="border border-brand-border/60 bg-brand-secondary/30 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b pb-1.5">
                  <span className="font-bold">SEO Tags &amp; Metadata</span>
                  <button
                    type="button"
                    onClick={handleGenerateAISEO}
                    disabled={generatingSEO}
                    className="text-brand-accent hover:text-brand-primary font-bold flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                  >
                    {generatingSEO ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <><Wand2 size={12} /> Suggest SEO</>
                    )}
                  </button>
                </div>
                
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Meta Title Tag"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="bg-brand-card border px-2.5 py-1.5 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Meta Description Tag"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="bg-brand-card border px-2.5 py-1.5 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Keywords (comma separated)"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="bg-brand-card border px-2.5 py-1.5 rounded-lg outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 mt-4 border-t border-brand-border pt-4">
            <button
              type="button"
              onClick={() => { setFormOpen(false); resetForm(); }}
              className="border border-brand-border px-6 py-3 rounded-xl hover:bg-brand-secondary font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-brand-primary hover:bg-brand-accent text-white px-8 py-3 rounded-xl shadow-md font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Check size={14} /> {editingProduct ? "Save Catalog Product" : "Publish Live Product"}
            </button>
          </div>
        </form>
      ) : (
        // PRODUCT LISTING TABLE VIEW
        <div className="bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-brand-secondary dark:bg-[#201D1B] border-b border-brand-border font-serif font-bold text-brand-text">
                  <th className="px-6 py-4">Thumbnail</th>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Fulfillment Price</th>
                  <th className="px-6 py-4">Stock Levels</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-brand-secondary/35 text-brand-text-muted font-medium">
                    <td className="px-6 py-3">
                      <img src={prod.images[0]} alt={prod.name} className="w-10 h-10 object-cover rounded-lg border" />
                    </td>
                    <td className="px-6 py-3 font-serif font-bold text-brand-text truncate max-w-[200px]" title={prod.name}>
                      {prod.name}
                    </td>
                    <td className="px-6 py-3 capitalize">{prod.category.replace("-", " ")}</td>
                    <td className="px-6 py-3 font-mono font-bold text-brand-primary">₹{prod.price}</td>
                    <td className="px-6 py-3">
                      {prod.inStock ? (
                        <span className="font-mono bg-green-50 dark:bg-green-950/20 text-brand-success px-2 py-0.5 border border-brand-success/20 rounded font-bold">
                          In Stock ({prod.stockCount})
                        </span>
                      ) : (
                        <span className="bg-red-50 dark:bg-red-950/20 text-brand-error px-2 py-0.5 border border-brand-error/20 rounded font-bold">
                          Sold Out
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-[10px] bg-brand-secondary font-bold px-2 py-0.5 rounded border">
                        Live Live
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleEditClick(prod)}
                          className="p-1.5 hover:bg-brand-secondary text-brand-accent rounded-lg border"
                          title="Edit Product"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(prod.id)}
                          className="p-1.5 hover:bg-brand-secondary text-brand-error rounded-lg border"
                          title="Delete Product"
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
        </div>
      )}
    </div>
  );
}
