/**
 * 5-Tier Fallback Priority Helper:
 * 1. Selected Variant Primary Image (is_primary = true)
 * 2. Selected Variant Gallery Images (sorted by sort_order)
 * 3. Product Primary Image (product.image_url or product.image)
 * 4. Product Gallery Images
 * 5. Fallback Placeholder ("/placeholder.png")
 */
export const getGalleryImages = (variant, prod) => {
  if (!prod && !variant) return ["/placeholder.png"];

  // Tier 1 & Tier 2: Selected Variant Images if present
  if (variant && variant.images && variant.images.length > 0) {
    const sortedVariantImgs = [...variant.images].sort((a, b) => {
      const primA = typeof a === 'object' ? !!a.is_primary : false;
      const primB = typeof b === 'object' ? !!b.is_primary : false;
      if (primA && !primB) return -1;
      if (!primA && primB) return 1;
      const orderA = typeof a === 'object' ? (a.sort_order ?? 0) : 0;
      const orderB = typeof b === 'object' ? (b.sort_order ?? 0) : 0;
      return orderA - orderB;
    });

    const urls = sortedVariantImgs
      .map(img => typeof img === 'string' ? img : (img.image_url || img.url || img.src))
      .filter(Boolean);

    if (urls.length > 0) return urls;
  }

  // Tier 3 & Tier 4: Product primary & gallery images
  const prodUrls = [];

  const mainProdImg = prod?.image_url || prod?.image;
  if (mainProdImg && typeof mainProdImg === 'string') {
    prodUrls.push(mainProdImg);
  }

  if (prod?.images && prod.images.length > 0) {
    prod.images.forEach(img => {
      const url = typeof img === 'string' ? img : (img.image_url || img.url || img.src);
      if (url && !prodUrls.includes(url)) {
        prodUrls.push(url);
      }
    });
  }

  if (prodUrls.length > 0) return prodUrls;

  // Tier 5: Fallback placeholder
  return ["/placeholder.png"];
};

/**
 * Extracts unique option groups (e.g. Color, Size, Material) and their distinct values
 */
export const getUniqueOptions = (product) => {
  if (!product || !product.variants || product.variants.length === 0) return {};
  const options = {};

  product.variants.forEach(v => {
    if (v.optionsMap && Object.keys(v.optionsMap).length > 0) {
      Object.entries(v.optionsMap).forEach(([optName, optVal]) => {
        if (!options[optName]) options[optName] = new Set();
        options[optName].add(optVal);
      });
    } else if (v.options && v.options.length > 0) {
      v.options.forEach(opt => {
        const name = opt.option_name || opt.name;
        const value = opt.option_value || opt.value;
        if (name && value) {
          if (!options[name]) options[name] = new Set();
          options[name].add(value);
        }
      });
    } else if (v.name) {
      if (!options["Option"]) options["Option"] = new Set();
      options["Option"].add(v.name);
    }
  });

  const result = {};
  Object.keys(options).forEach(key => {
    result[key] = Array.from(options[key]);
  });
  return result;
};
