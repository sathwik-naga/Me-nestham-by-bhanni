import React, { useState, useEffect, useRef } from "react";
import { aiService } from "../../services/ai";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../../services/supabase/products";
import { getCategories } from "../../services/supabase/categories";
import {
  uploadProductImageToStorage,
  deleteProductImageFromStorage,
  validateImageFile
} from "../../services/storage";
import { 
  Plus, Edit, Trash2, Tag, Wand2, Eye, 
  Check, Save, X, Sparkles, Loader2,
  Upload, Star, RefreshCw, AlertCircle, CheckCircle2, Maximize2, RotateCcw
} from "lucide-react";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form inputs
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(500);
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [images, setImages] = useState([]);
  const [stockCount, setStockCount] = useState(10);
  const [isBestseller, setIsBestseller] = useState(false);
  
  // Image Upload System State
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [tempFolderId, setTempFolderId] = useState(() => Math.random().toString(36).substring(2, 9));
  const [dragActive, setDragActive] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [replaceIndex, setReplaceIndex] = useState(null);

  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const variantFileInputRef = useRef(null);

  // Expanded Variant helper builder
  const [variantSku, setVariantSku] = useState("");
  const [variantPrice, setVariantPrice] = useState(500);
  const [variantSalePrice, setVariantSalePrice] = useState("");
  const [variantStock, setVariantStock] = useState(10);
  const [variantWeight, setVariantWeight] = useState("");
  const [variantIsDefault, setVariantIsDefault] = useState(false);
  const [variantStatus, setVariantStatus] = useState("active");
  const [variantOptions, setVariantOptions] = useState([{ option_name: "Size", option_value: "" }]);
  const [variantImages, setVariantImages] = useState([]); // Array of variant image objects { id, image_url, storage_path, media_type, alt_text, sort_order, is_primary }
  const [variantUploading, setVariantUploading] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [productVariants, setProductVariants] = useState([]);

  // SEO inputs
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState("");

  // AI loading flags
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingSEO, setGeneratingSEO] = useState(false);

  const loadProductsAndCategories = async () => {
    try {
      setLoading(true);
      const [prodsData, catsData] = await Promise.all([
        getProducts(),
        getCategories()
      ]);
      setProducts(prodsData || []);
      setCategories(catsData || []);
      if (catsData && catsData.length > 0 && !category) {
        setCategory(catsData[0].id);
      }
    } catch (err) {
      console.error("Failed to load products/categories data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductsAndCategories();
  }, []);

  const resetForm = () => {
    setName("");
    setCategory(categories[0]?.id || "");
    setShortDescription("");
    setDescription("");
    setPrice(500);
    setCompareAtPrice("");
    setImages([]);
    setUploadingFiles([]);
    setTempFolderId(Math.random().toString(36).substring(2, 9));
    setLightboxUrl(null);
    setReplaceIndex(null);
    setStockCount(10);
    setIsBestseller(false);
    setVariantSku("");
    setVariantPrice(500);
    setVariantSalePrice("");
    setVariantStock(10);
    setVariantWeight("");
    setVariantIsDefault(false);
    setVariantStatus("active");
    setVariantOptions([{ option_name: "Size", option_value: "" }]);
    setVariantImages([]);
    setEditingVariantId(null);
    setProductVariants([]);
    setMetaTitle("");
    setMetaDescription("");
    setKeywords("");
    setEditingProduct(null);
  };

  const handleEditClick = (prod) => {
    setEditingProduct(prod);
    setName(prod.name);
    
    // Find matching category UUID
    const matchedCategory = categories.find(c => c.slug === prod.category || c.id === prod.category_id);
    setCategory(matchedCategory ? matchedCategory.id : (categories[0]?.id || ""));
    
    setShortDescription(prod.shortDescription || "");
    setDescription(prod.description);
    setPrice(prod.price);
    setCompareAtPrice(prod.compareAtPrice || "");
    
    // Format images with metadata
    const loadedImages = (prod.images || []).map((img, idx) => {
      const urlStr = typeof img === 'string' ? img : (img.image_url || img.url);
      return {
        url: urlStr,
        storagePath: typeof img === 'object' ? img.storagePath : null,
        isFeatured: idx === 0,
        position: idx
      };
    });
    setImages(loadedImages);
    setUploadingFiles([]);
    setLightboxUrl(null);
    setReplaceIndex(null);

    setStockCount(prod.stockCount || 0);
    setIsBestseller(prod.isBestseller || false);
    setProductVariants(prod.variants || []);
    setMetaTitle(prod.seo?.metaTitle || "");
    setMetaDescription(prod.seo?.metaDescription || "");
    setKeywords(prod.seo?.keywords || "");
    setFormOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        
        // Sync local storage cache to keep storefront updated
        const allProdsMapped = await getProducts();
        localStorage.setItem("mn_products", JSON.stringify(allProdsMapped));

        await loadProductsAndCategories();
        alert("Product deleted successfully.");
      } catch (err) {
        alert(err.message || "Failed to delete product.");
      }
    }
  };

  // --- IMAGE UPLOAD SYSTEM HANDLERS ---

  const executeSingleUpload = async (uploadItem) => {
    try {
      setUploadingFiles(prev => prev.map(item => item.id === uploadItem.id ? { ...item, status: 'uploading', error: null, progress: 20 } : item));

      const { publicUrl, storagePath } = await uploadProductImageToStorage({
        file: uploadItem.file,
        productId: editingProduct ? editingProduct.id : null,
        tempFolderId: tempFolderId,
        onProgress: (p) => {
          setUploadingFiles(prev => prev.map(item => item.id === uploadItem.id ? { ...item, progress: p } : item));
        }
      });

      setUploadingFiles(prev => prev.map(item => item.id === uploadItem.id ? { ...item, status: 'success', progress: 100, publicUrl, storagePath } : item));

      setImages(prev => [
        ...prev,
        { url: publicUrl, storagePath, isFeatured: prev.length === 0, position: prev.length }
      ]);
    } catch (err) {
      console.error("Upload error for", uploadItem.name, err);
      setUploadingFiles(prev => prev.map(item => item.id === uploadItem.id ? { ...item, status: 'error', error: err.message || "Upload failed" } : item));
    }
  };

  const processFilesForUpload = (fileList) => {
    const newFiles = Array.from(fileList);
    if (newFiles.length === 0) return;

    // Check max 10 images limit
    const activeUploadCount = uploadingFiles.filter(f => f.status === 'uploading').length;
    const currentTotal = images.length + activeUploadCount;

    if (currentTotal >= 10) {
      alert("Maximum limit of 10 images reached per product.");
      return;
    }

    const maxAllowed = 10 - currentTotal;
    if (newFiles.length > maxAllowed) {
      alert(`You can only add ${maxAllowed} more image(s). Only the first ${maxAllowed} file(s) will be processed.`);
    }

    const filesToProcess = newFiles.slice(0, maxAllowed);

    for (const file of filesToProcess) {
      // Validate format & size
      const validationErr = validateImageFile(file);
      if (validationErr) {
        alert(validationErr);
        continue;
      }

      // Duplicate check
      const isDuplicate = uploadingFiles.some(f => f.name === file.name && f.size === file.size) ||
        images.some(img => {
          const urlStr = typeof img === 'string' ? img : img.url;
          return urlStr.toLowerCase().includes(file.name.toLowerCase().split('.')[0]);
        });

      if (isDuplicate) {
        alert(`Duplicate file detected: "${file.name}" has already been selected or uploaded.`);
        continue;
      }

      const uploadId = 'up_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const previewUrl = URL.createObjectURL(file);

      const uploadItem = {
        id: uploadId,
        file,
        name: file.name,
        size: file.size,
        progress: 10,
        status: 'uploading',
        error: null,
        previewUrl
      };

      setUploadingFiles(prev => [...prev, uploadItem]);
      executeSingleUpload(uploadItem);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFilesForUpload(e.dataTransfer.files);
    }
  };

  const handleRemoveImageIndex = async (index) => {
    const imgToRemove = images[index];
    const urlStr = typeof imgToRemove === 'string' ? imgToRemove : imgToRemove.url;
    const pathStr = typeof imgToRemove === 'object' ? imgToRemove.storagePath : null;

    // Remove from storage asynchronously
    await deleteProductImageFromStorage(pathStr || urlStr);

    // Remove from images array and update positions
    setImages(prev => {
      const filtered = prev.filter((_, idx) => idx !== index);
      return filtered.map((img, idx) => ({
        ...(typeof img === 'string' ? { url: img } : img),
        isFeatured: idx === 0,
        position: idx
      }));
    });
  };

  const handleSetFeatured = (index) => {
    if (index === 0) return;
    setImages(prev => {
      const newArr = [...prev];
      const [target] = newArr.splice(index, 1);
      newArr.unshift(target);
      return newArr.map((img, idx) => ({
        ...(typeof img === 'string' ? { url: img } : img),
        isFeatured: idx === 0,
        position: idx
      }));
    });
  };

  const triggerReplaceImage = (index) => {
    setReplaceIndex(index);
    if (replaceInputRef.current) {
      replaceInputRef.current.value = "";
      replaceInputRef.current.click();
    }
  };

  const handleReplaceFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file || replaceIndex === null) return;

    const validationErr = validateImageFile(file);
    if (validationErr) {
      alert(validationErr);
      setReplaceIndex(null);
      return;
    }

    const oldImg = images[replaceIndex];
    const oldUrl = typeof oldImg === 'string' ? oldImg : oldImg.url;
    const oldPath = typeof oldImg === 'object' ? oldImg.storagePath : null;

    // Delete old file from storage
    await deleteProductImageFromStorage(oldPath || oldUrl);

    try {
      const { publicUrl, storagePath } = await uploadProductImageToStorage({
        file,
        productId: editingProduct ? editingProduct.id : null,
        tempFolderId: tempFolderId
      });

      setImages(prev => prev.map((img, idx) => idx === replaceIndex ? { url: publicUrl, storagePath, isFeatured: idx === 0, position: idx } : img));
    } catch (err) {
      alert("Failed to replace image: " + err.message);
    } finally {
      setReplaceIndex(null);
    }
  };

  // --- VARIANTS & AI HANDLERS ---

  const handleAddOptionField = () => {
    setVariantOptions([...variantOptions, { option_name: "Color", option_value: "" }]);
  };

  const handleRemoveOptionField = (idx) => {
    if (variantOptions.length > 1) {
      setVariantOptions(variantOptions.filter((_, i) => i !== idx));
    } else {
      alert("At least one option configuration is required.");
    }
  };

  const handleOptionFieldChange = (idx, field, val) => {
    setVariantOptions(
      variantOptions.map((opt, i) => (i === idx ? { ...opt, [field]: val } : opt))
    );
  };

  const handleUploadVariantImagesFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setVariantUploading(true);
    try {
      const newImages = [...variantImages];
      for (const file of Array.from(fileList)) {
        const validationErr = validateImageFile(file);
        if (validationErr) {
          alert(validationErr);
          continue;
        }

        const currentVarId = editingVariantId || `temp_${tempFolderId}`;
        const { publicUrl, storagePath } = await uploadProductImageToStorage({
          file,
          variantId: currentVarId,
        });

        const isFirst = newImages.length === 0;
        newImages.push({
          id: `vimg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          image_url: publicUrl,
          storage_path: storagePath,
          media_type: 'image',
          alt_text: file.name.split('.')[0],
          sort_order: newImages.length,
          is_primary: isFirst,
        });
      }
      setVariantImages(newImages);
    } catch (err) {
      alert("Variant image upload failed: " + err.message);
    } finally {
      setVariantUploading(false);
    }
  };

  const handleToggleVariantImage = (urlOrObj) => {
    const targetUrl = typeof urlOrObj === 'string' ? urlOrObj : urlOrObj.url;
    const targetPath = typeof urlOrObj === 'object' ? urlOrObj.storagePath : null;

    const existingIdx = variantImages.findIndex(img => img.image_url === targetUrl);
    if (existingIdx >= 0) {
      setVariantImages(variantImages.filter((_, idx) => idx !== existingIdx));
    } else {
      const isFirst = variantImages.length === 0;
      setVariantImages([
        ...variantImages,
        {
          id: `vimg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          image_url: targetUrl,
          storage_path: targetPath || null,
          media_type: 'image',
          alt_text: '',
          sort_order: variantImages.length,
          is_primary: isFirst,
        }
      ]);
    }
  };

  const handleSetVariantPrimaryImage = (index) => {
    setVariantImages(prev => prev.map((img, idx) => ({
      ...img,
      is_primary: idx === index
    })));
  };

  const handleMoveVariantImage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= variantImages.length) return;

    const newArr = [...variantImages];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;

    // Update sort_order property
    setVariantImages(newArr.map((img, idx) => ({
      ...img,
      sort_order: idx
    })));
  };

  const handleRemoveVariantImage = async (index) => {
    const target = variantImages[index];
    if (target.storage_path || target.image_url) {
      await deleteProductImageFromStorage(target.storage_path || target.image_url);
    }

    const filtered = variantImages.filter((_, idx) => idx !== index);
    // Re-evaluate primary image rule
    const hasPrimary = filtered.some(img => img.is_primary);
    setVariantImages(filtered.map((img, idx) => ({
      ...img,
      sort_order: idx,
      is_primary: hasPrimary ? img.is_primary : (idx === 0)
    })));
  };

  const handleVariantAltTextChange = (index, text) => {
    setVariantImages(prev => prev.map((img, idx) => idx === index ? { ...img, alt_text: text } : img));
  };

  const handleAddVariant = (e) => {
    e.preventDefault();
    if (variantOptions.some(opt => !opt.option_value.trim())) {
      alert("Please fill in all option values.");
      return;
    }

    const nameStr = variantOptions.map(opt => `${opt.option_name}: ${opt.option_value}`).join(" / ");
    
    // Single primary image rule enforcement
    let hasPrimary = variantImages.some(img => img.is_primary);
    const formattedImages = variantImages.map((img, idx) => {
      const isPrim = hasPrimary ? (img.is_primary === true) : (idx === 0);
      if (isPrim) hasPrimary = true;
      return {
        id: img.id || `vimg_${Date.now()}_${idx}`,
        image_url: img.image_url,
        storage_path: img.storage_path || null,
        media_type: img.media_type || 'image',
        alt_text: img.alt_text || null,
        sort_order: idx,
        is_primary: isPrim,
        position: idx
      };
    });

    const newVariant = {
      id: editingVariantId || "v-" + Math.random().toString(36).substr(2, 5),
      sku: variantSku.trim() || `${name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      name: nameStr,
      price: Number(variantPrice),
      sale_price: variantSalePrice ? Number(variantSalePrice) : null,
      stock: Number(variantStock),
      weight: variantWeight ? Number(variantWeight) : null,
      is_default: variantIsDefault,
      status: variantStatus,
      options: variantOptions.map(opt => ({
        option_name: opt.option_name.trim(),
        option_value: opt.option_value.trim()
      })),
      images: formattedImages
    };

    let updatedList = [...productVariants];

    if (variantIsDefault) {
      // Clear default status of other variants
      updatedList = updatedList.map(v => v.id === editingVariantId ? newVariant : { ...v, is_default: false });
    }

    if (editingVariantId) {
      updatedList = updatedList.map(v => v.id === editingVariantId ? newVariant : v);
      setEditingVariantId(null);
    } else {
      // If it's the first variant, make it default automatically if none are default
      const hasDefault = updatedList.some(v => v.is_default) || variantIsDefault;
      updatedList.push({ ...newVariant, is_default: !hasDefault ? true : newVariant.is_default });
    }

    setProductVariants(updatedList);

    // Reset inputs
    setVariantSku("");
    setVariantPrice(500);
    setVariantSalePrice("");
    setVariantStock(10);
    setVariantWeight("");
    setVariantIsDefault(false);
    setVariantStatus("active");
    setVariantOptions([{ option_name: "Size", option_value: "" }]);
    setVariantImages([]);
  };

  const handleRemoveVariant = (id) => {
    setProductVariants(productVariants.filter(v => v.id !== id));
  };

  const handleEditVariant = (v) => {
    setEditingVariantId(v.id);
    setVariantSku(v.sku || "");
    setVariantPrice(v.price || 500);
    setVariantSalePrice(v.sale_price || "");
    setVariantStock(v.stock !== undefined ? v.stock : (v.stock_quantity || 0));
    setVariantWeight(v.weight || "");
    setVariantIsDefault(v.is_default || false);
    setVariantStatus(v.status || "active");
    setVariantOptions(
      v.options && v.options.length > 0
        ? v.options.map(opt => ({ option_name: opt.option_name, option_value: opt.option_value }))
        : [{ option_name: "Size", option_value: v.name || "" }]
    );
    setVariantImages(
      v.images
        ? v.images.map((img, idx) => ({
            id: img.id || `vimg_${Date.now()}_${idx}`,
            image_url: typeof img === 'string' ? img : (img.image_url || img.url || ''),
            storage_path: typeof img === 'object' ? (img.storage_path || null) : null,
            media_type: typeof img === 'object' ? (img.media_type || 'image') : 'image',
            alt_text: typeof img === 'object' ? (img.alt_text || '') : '',
            sort_order: typeof img === 'object' ? (img.sort_order !== undefined ? img.sort_order : (img.position || idx)) : idx,
            is_primary: typeof img === 'object' ? !!img.is_primary : (idx === 0)
          }))
        : []
    );
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
      const matchedCategory = categories.find(c => c.id === category);
      const categorySlug = matchedCategory ? matchedCategory.slug : "home-decor";
      const generated = await aiService.generateProductDescription(name, categorySlug, tags);
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
      const matchedCategory = categories.find(c => c.id === category);
      const categorySlug = matchedCategory ? matchedCategory.slug : "home-decor";
      const generated = await aiService.generateSEOSuggestions(name, categorySlug, description);
      setMetaTitle(generated.metaTitle);
      setMetaDescription(generated.metaDescription);
      setKeywords(generated.keywords);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingSEO(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const activeUploads = uploadingFiles.filter(f => f.status === 'uploading');
    if (activeUploads.length > 0) {
      alert(`Please wait until all image uploads finish. Currently uploading ${activeUploads.length} image(s)...`);
      return;
    }

    if (images.length === 0) {
      alert("Please upload at least 1 product image before publishing.");
      return;
    }

    const imageUrls = images.map(img => typeof img === 'string' ? img : img.url);

    const payload = {
      category_id: category,
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      compare_price: compareAtPrice ? Number(compareAtPrice) : null,
      stock: productVariants.length > 0 ? productVariants.reduce((sum, v) => sum + Number(v.stock), 0) : Number(stockCount),
      is_active: true,
      featured: editingProduct ? (editingProduct.featured || false) : false,
      bestseller: isBestseller,
      image_url: imageUrls[0] || null,
      images: imageUrls.map((url, idx) => ({
        image_url: url,
        is_featured: idx === 0,
        position: idx
      })),
      variants: productVariants.map((v, idx) => ({
        sku: v.sku || `${name.substring(0, 3).toUpperCase()}-${idx}`,
        name: v.name,
        price: Number(v.price),
        sale_price: v.sale_price !== null && v.sale_price !== undefined && v.sale_price !== "" ? Number(v.sale_price) : null,
        stock: Number(v.stock),
        stock_quantity: Number(v.stock),
        weight: v.weight ? Number(v.weight) : null,
        is_default: v.is_default || false,
        status: v.status || "active",
        options: v.options || [],
        images: v.images || []
      }))
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        alert("Product updated successfully.");
      } else {
        await createProduct(payload);
        alert("Product created successfully.");
      }
      
      // Update local storage cache to keep storefront updated instantly
      const allProdsMapped = await getProducts();
      localStorage.setItem("mn_products", JSON.stringify(allProdsMapped));

      await loadProductsAndCategories();
      setFormOpen(false);
      resetForm();
    } catch (err) {
      alert(err.message || "Failed to save product.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 font-accent text-brand-text">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          <span className="text-xs font-semibold text-brand-text-muted">Loading product catalog details...</span>
        </div>
      </div>
    );
  }

  const activeUploadsCount = uploadingFiles.filter(f => f.status === 'uploading').length;
  const totalUploadsCount = uploadingFiles.length;

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
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
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
                <label htmlFor="bestsellerCheck" className="font-semibold cursor-pointer select-none">Bestseller Badge</label>
              </div>
            </div>

            {/* Column 2: Direct Image Upload System & Option Variants */}
            <div className="flex flex-col gap-4 border-x border-brand-border/60 px-0 md:px-6">
              <div className="flex flex-col gap-3 bg-brand-secondary/30 p-4 rounded-2xl border border-brand-border">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-brand-text flex items-center gap-1.5">
                    <Upload size={14} className="text-brand-primary" /> Product Gallery ({images.length}/10)
                  </span>
                  <span className="text-[10px] text-brand-text-muted">Min 1, Max 10</span>
                </div>

                {/* Drag & Drop Upload Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    dragActive
                      ? "border-brand-primary bg-brand-primary/10 scale-[1.01]"
                      : "border-brand-border hover:border-brand-primary/60 bg-brand-card/50"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files) processFilesForUpload(e.target.files);
                      e.target.value = "";
                    }}
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-1.5">
                    <Upload size={18} />
                  </div>
                  <p className="font-semibold text-xs text-brand-text">
                    Drag &amp; Drop Images Here
                  </p>
                  <p className="text-[10px] text-brand-text-muted mt-0.5">
                    or <span className="text-brand-accent underline font-bold">Click to Browse</span> (JPG, PNG, WEBP — Max 5MB)
                  </p>
                </div>

                {/* Hidden Replace File Input */}
                <input
                  type="file"
                  ref={replaceInputRef}
                  onChange={handleReplaceFileSelected}
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                />

                {/* Active Uploading Progress List */}
                {uploadingFiles.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-[11px] font-bold text-brand-text-muted">Upload Queue Progress</span>
                    {uploadingFiles.map((item) => (
                      <div key={item.id} className="bg-brand-card p-2.5 rounded-xl border border-brand-border flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-brand-text truncate max-w-[150px]">{item.name}</span>
                          <span className="text-[10px] font-mono">
                            {item.status === 'uploading' && <span className="text-brand-primary font-bold">{item.progress}%</span>}
                            {item.status === 'success' && <span className="text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle2 size={12} /> Done</span>}
                            {item.status === 'error' && <span className="text-brand-error font-bold flex items-center gap-0.5"><AlertCircle size={12} /> Failed</span>}
                          </span>
                        </div>

                        {item.status === 'uploading' && (
                          <div className="w-full bg-brand-secondary h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-brand-primary h-full transition-all duration-300 rounded-full"
                              style={{ width: `${item.progress}%` }}
                            ></div>
                          </div>
                        )}

                        {item.status === 'error' && (
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-[10px] text-brand-error truncate">{item.error}</span>
                            <button
                              type="button"
                              onClick={() => executeSingleUpload(item)}
                              className="text-[10px] text-brand-primary underline font-bold flex items-center gap-1 hover:text-brand-accent cursor-pointer"
                            >
                              <RotateCcw size={10} /> Retry
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Uploaded Gallery Grid */}
                {images.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-brand-text">Uploaded Gallery ({images.length})</span>
                      <span className="text-[9px] text-brand-text-muted">⭐ Position 1 = Cover Thumbnail</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {images.map((imgObj, i) => {
                        const url = typeof imgObj === "string" ? imgObj : imgObj.url;
                        const isFeatured = i === 0;

                        return (
                          <div
                            key={i}
                            className={`relative group border rounded-xl overflow-hidden bg-brand-card shadow-sm transition-all ${
                              isFeatured ? "ring-2 ring-amber-400 border-amber-400" : "border-brand-border"
                            }`}
                          >
                            <img src={url} alt={`Product Image ${i + 1}`} className="w-full h-24 object-cover" />

                            {/* Featured Badge */}
                            {isFeatured && (
                              <span className="absolute top-1.5 left-1.5 bg-amber-400 text-slate-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow flex items-center gap-0.5 z-10">
                                <Star size={9} className="fill-slate-900" /> Main Cover
                              </span>
                            )}

                            {/* Overlay Action Buttons */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 z-20">
                              <div className="flex justify-between items-center">
                                <button
                                  type="button"
                                  onClick={() => setLightboxUrl(url)}
                                  title="Preview Image"
                                  className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm transition-colors cursor-pointer"
                                >
                                  <Eye size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImageIndex(i)}
                                  title="Delete Image"
                                  className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                              <div className="flex justify-between items-center gap-1">
                                {!isFeatured && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetFeatured(i)}
                                    title="Set as Main Cover Image"
                                    className="text-[9px] font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 px-2 py-1 rounded-md shadow flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <Star size={9} /> Set Cover
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => triggerReplaceImage(i)}
                                  title="Replace Image"
                                  className="text-[9px] font-bold bg-white/20 hover:bg-white/40 text-white px-2 py-1 rounded-md backdrop-blur-sm cursor-pointer ml-auto"
                                >
                                  Replace
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Variants Builder */}
              <div className="flex flex-col gap-3 bg-brand-secondary/30 p-4 rounded-2xl border border-brand-border">
                <div className="flex justify-between items-center border-b pb-1.5 mb-1">
                  <span className="font-bold text-brand-text">Product Variants Builder</span>
                  {editingVariantId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVariantId(null);
                        setVariantSku("");
                        setVariantPrice(500);
                        setVariantSalePrice("");
                        setVariantStock(10);
                        setVariantWeight("");
                        setVariantIsDefault(false);
                        setVariantStatus("active");
                        setVariantOptions([{ option_name: "Size", option_value: "" }]);
                        setVariantImages([]);
                      }}
                      className="text-xs text-brand-error font-bold hover:underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                
                {/* 1. Dynamic Option Fields */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-brand-text-muted">Option Dimensions</span>
                    <button
                      type="button"
                      onClick={handleAddOptionField}
                      className="text-[10px] text-brand-accent hover:text-brand-primary font-bold"
                    >
                      + Add Option Type
                    </button>
                  </div>
                  {variantOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-brand-card p-2 rounded-xl border">
                      <select
                        value={opt.option_name}
                        onChange={(e) => handleOptionFieldChange(idx, "option_name", e.target.value)}
                        className="bg-brand-secondary border px-2 py-1 rounded text-xs"
                      >
                        <option value="Size">Size</option>
                        <option value="Color">Color</option>
                        <option value="Material">Material</option>
                        <option value="Pack Size">Pack Size</option>
                        <option value="Weight">Weight</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Value (e.g. 3 Inch, Red)"
                        value={opt.option_value}
                        onChange={(e) => handleOptionFieldChange(idx, "option_value", e.target.value)}
                        className="flex-1 bg-brand-secondary border px-2 py-1 rounded text-xs outline-none"
                      />
                      {variantOptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionField(idx)}
                          className="p-1 hover:bg-brand-secondary text-brand-error rounded"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* 2. Advanced Details Fields */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="font-semibold">Variant SKU</span>
                    <input
                      type="text"
                      placeholder="SKU Code"
                      value={variantSku}
                      onChange={(e) => setVariantSku(e.target.value)}
                      className="bg-brand-card border px-2.5 py-1.5 rounded-xl outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="font-semibold">Price (₹)</span>
                    <input
                      type="number"
                      value={variantPrice}
                      onChange={(e) => setVariantPrice(e.target.value)}
                      className="bg-brand-card border px-2.5 py-1.5 rounded-xl outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="font-semibold">Sale Price (₹)</span>
                    <input
                      type="number"
                      placeholder="Optional"
                      value={variantSalePrice}
                      onChange={(e) => setVariantSalePrice(e.target.value)}
                      className="bg-brand-card border px-2.5 py-1.5 rounded-xl outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="font-semibold">Stock Quantity</span>
                    <input
                      type="number"
                      value={variantStock}
                      onChange={(e) => setVariantStock(e.target.value)}
                      className="bg-brand-card border px-2.5 py-1.5 rounded-xl outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="font-semibold">Weight (kg)</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Optional"
                      value={variantWeight}
                      onChange={(e) => setVariantWeight(e.target.value)}
                      className="bg-brand-card border px-2.5 py-1.5 rounded-xl outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-[11px]">
                    <span className="font-semibold">Status</span>
                    <select
                      value={variantStatus}
                      onChange={(e) => setVariantStatus(e.target.value)}
                      className="bg-brand-card border px-2.5 py-1.5 rounded-xl text-xs"
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="variantDefaultCheck"
                    checked={variantIsDefault}
                    onChange={(e) => setVariantIsDefault(e.target.checked)}
                    className="w-3.5 h-3.5 accent-brand-primary"
                  />
                  <label htmlFor="variantDefaultCheck" className="text-xs font-semibold cursor-pointer select-none">
                    Default Selection
                  </label>
                </div>

                {/* 3. Dedicated Variant Images Section */}
                <div className="flex flex-col gap-2 border-t border-brand-border/60 pt-3 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-brand-text flex items-center gap-1">
                      <Upload size={12} className="text-brand-primary" /> Variant Specific Images ({variantImages.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => variantFileInputRef.current?.click()}
                      disabled={variantUploading}
                      className="text-[10px] bg-brand-primary text-white font-bold px-2.5 py-1 rounded-lg hover:bg-brand-accent transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {variantUploading ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                      {variantUploading ? "Uploading..." : "+ Upload Variant Images"}
                    </button>
                    <input
                      type="file"
                      ref={variantFileInputRef}
                      onChange={(e) => {
                        if (e.target.files) handleUploadVariantImagesFiles(e.target.files);
                        e.target.value = "";
                      }}
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      className="hidden"
                    />
                  </div>

                  {/* List of uploaded/linked images for this variant */}
                  {variantImages.length > 0 && (
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 mt-1">
                      {variantImages.map((imgObj, i) => {
                        const url = typeof imgObj === "string" ? imgObj : imgObj.image_url;
                        const isPrim = typeof imgObj === "object" ? !!imgObj.is_primary : (i === 0);
                        const altText = typeof imgObj === "object" ? (imgObj.alt_text || "") : "";

                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-2 p-1.5 rounded-xl border bg-brand-card ${
                              isPrim ? "border-amber-400 ring-1 ring-amber-400" : "border-brand-border"
                            }`}
                          >
                            <img src={url} alt={altText || `Variant image ${i + 1}`} className="w-10 h-10 object-cover rounded-lg border" />

                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                {isPrim ? (
                                  <span className="text-[8px] bg-amber-400 text-slate-900 font-extrabold px-1.5 py-0.2 rounded uppercase flex items-center gap-0.5">
                                    <Star size={8} className="fill-slate-900" /> Primary
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSetVariantPrimaryImage(i)}
                                    className="text-[8px] text-brand-text-muted hover:text-amber-500 font-bold underline cursor-pointer"
                                  >
                                    Set Primary
                                  </button>
                                )}
                                <span className="text-[8px] font-mono text-brand-text-muted">Order: #{i + 1}</span>
                              </div>
                              <input
                                type="text"
                                placeholder="Alt text (SEO)"
                                value={altText}
                                onChange={(e) => handleVariantAltTextChange(i, e.target.value)}
                                className="bg-brand-secondary text-[9px] px-1.5 py-0.5 rounded border border-brand-border outline-none"
                              />
                            </div>

                            {/* Move & Delete controls */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={i === 0}
                                onClick={() => handleMoveVariantImage(i, -1)}
                                className="text-[9px] p-1 border rounded hover:bg-brand-secondary disabled:opacity-30 cursor-pointer"
                                title="Move Up"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                disabled={i === variantImages.length - 1}
                                onClick={() => handleMoveVariantImage(i, 1)}
                                className="text-[9px] p-1 border rounded hover:bg-brand-secondary disabled:opacity-30 cursor-pointer"
                                title="Move Down"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariantImage(i)}
                                className="p-1 text-brand-error hover:bg-brand-secondary rounded cursor-pointer"
                                title="Delete Image"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Also support quick linking from Main Product Gallery */}
                  {images.length > 0 && (
                    <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-brand-border/40">
                      <span className="text-[9px] font-bold text-brand-text-muted">Or Select from Product Gallery:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {images.map((imgObj, i) => {
                          const url = typeof imgObj === "string" ? imgObj : imgObj.url;
                          const isSelected = variantImages.some(vi => (typeof vi === 'string' ? vi : vi.image_url) === url);
                          return (
                            <div
                              key={i}
                              onClick={() => handleToggleVariantImage(imgObj)}
                              className={`w-9 h-9 rounded-lg border-2 overflow-hidden relative cursor-pointer transition-all ${
                                isSelected ? "border-brand-primary ring-1 ring-brand-primary" : "border-brand-border opacity-50 hover:opacity-100"
                              }`}
                            >
                              <img src={url} className="w-full h-full object-cover" />
                              {isSelected && (
                                <span className="absolute inset-0 bg-brand-primary/20 flex items-center justify-center text-white z-10">
                                  <Check size={12} className="stroke-[3]" />
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="bg-brand-primary/10 text-brand-primary border border-brand-primary/30 font-bold py-2 rounded-xl mt-2.5 hover:bg-brand-primary hover:text-white transition-all active:scale-[0.98] cursor-pointer text-xs"
                >
                  {editingVariantId ? "✓ Update Variant Option" : "+ Add Variant Option"}
                </button>

                {/* 4. Display list of Variants */}
                {productVariants.length > 0 && (
                  <div className="flex flex-col gap-2 mt-3 border-t border-brand-border/60 pt-3">
                    <span className="text-[11px] font-bold text-brand-text">Configured Variants ({productVariants.length})</span>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {productVariants.map((v) => (
                        <div key={v.id} className="flex justify-between items-center p-2.5 border rounded-xl bg-brand-card shadow-sm">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-brand-text text-xs truncate max-w-[180px]">{v.name}</span>
                              {v.is_default && (
                                <span className="bg-amber-400 text-slate-900 text-[8px] font-extrabold px-1 py-0.2 rounded shadow-xs uppercase">
                                  Default
                                </span>
                              )}
                              {v.status === 'draft' && (
                                <span className="bg-gray-200 text-gray-700 text-[8px] font-extrabold px-1 py-0.2 rounded uppercase">
                                  Draft
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-brand-text-muted mt-0.5 truncate">
                              SKU: {v.sku} | Price: ₹{v.price} {v.sale_price ? `(Sale: ₹${v.sale_price})` : ""} | Stock: {v.stock}
                            </p>
                            {v.images && v.images.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {v.images.map((img, idx) => (
                                  <img key={idx} src={img.image_url} className="w-5 h-5 rounded object-cover border border-brand-border" />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditVariant(v)}
                              title="Edit Variant"
                              className="p-1 hover:bg-brand-secondary text-brand-primary rounded border border-brand-border"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(v.id)}
                              title="Delete Variant"
                              className="p-1 hover:bg-brand-secondary text-brand-error rounded border border-brand-error/20"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                      <><Sparkles size={12} /> AI Suggestions</>
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
          <div className="flex items-center justify-between mt-4 border-t border-brand-border pt-4">
            <div className="text-xs">
              {activeUploadsCount > 0 ? (
                <span className="text-brand-primary font-bold flex items-center gap-1.5 animate-pulse">
                  <Loader2 size={14} className="animate-spin" />
                  Uploading {activeUploadsCount} of {totalUploadsCount} image(s)...
                </span>
              ) : (
                <span className="text-brand-text-muted">
                  {images.length === 0 ? "⚠️ At least 1 image is required to publish." : `${images.length} image(s) ready.`}
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setFormOpen(false); resetForm(); }}
                className="border border-brand-border px-6 py-3 rounded-xl hover:bg-brand-secondary font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={activeUploadsCount > 0 || images.length === 0}
                className="bg-brand-primary hover:bg-brand-accent disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl shadow-md font-semibold flex items-center gap-1 cursor-pointer transition-all"
              >
                <Check size={14} /> {editingProduct ? "Save Catalog Product" : "Publish Live Product"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        // PRODUCT LISTING TABLE VIEW
        <div className="bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-brand-secondary  border-b border-brand-border font-serif font-bold text-brand-text">
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
                      <img src={prod.images?.[0] || prod.image || "/placeholder.png"} alt={prod.name} className="w-10 h-10 object-cover rounded-lg border" />
                    </td>
                    <td className="px-6 py-3 font-serif font-bold text-brand-text truncate max-w-[200px]" title={prod.name}>
                      {prod.name}
                    </td>
                    <td className="px-6 py-3 capitalize">{prod.category ? prod.category.replace("-", " ") : ""}</td>
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
                        Live
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

      {/* Lightbox Preview Modal */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-brand-card shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white p-2 rounded-full z-10 cursor-pointer"
            >
              <X size={18} />
            </button>
            <img src={lightboxUrl} alt="Enlarged Preview" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}
