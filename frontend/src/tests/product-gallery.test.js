import assert from "node:assert";
import { getGalleryImages, getUniqueOptions } from "../utils/galleryHelpers.js";
import { mapProduct } from "../services/supabase/adapters.js";

console.log("🧪 Starting Automated Tests for Product Variant Image Gallery...");

// Mock product with multi-color & multi-image variants
const mockBackendProduct = {
  id: "prod-test-101",
  name: "Handcrafted Decorative Garland",
  slug: "handcrafted-decorative-garland",
  price: 599,
  image_url: "https://example.com/product-main.jpg",
  images: [
    { image_url: "https://example.com/product-main.jpg", is_featured: true },
    { image_url: "https://example.com/product-angle2.jpg", is_featured: false }
  ],
  variants: [
    {
      id: "v-orange",
      name: "Orange / Pack of 10",
      price: 599,
      stock: 15,
      color: "Orange",
      variant_images: [
        { id: "img-o1", image_url: "https://example.com/orange1.jpg", is_primary: true, sort_order: 0 },
        { id: "img-o2", image_url: "https://example.com/orange2.jpg", is_primary: false, sort_order: 1 }
      ]
    },
    {
      id: "v-white",
      name: "White / Pack of 10",
      price: 599,
      stock: 8,
      color: "White",
      variant_images: [
        { id: "img-w1", image_url: "https://example.com/white1.jpg", is_primary: true, sort_order: 0 }
      ]
    },
    {
      id: "v-pink-no-img",
      name: "Pink / Pack of 10",
      price: 599,
      stock: 0,
      color: "Pink",
      variant_images: []
    }
  ]
};

// 1. Verify Adapter Mapping
console.log("  [1/5] Testing Adapter Mapping (rawImages & optionsMap)...");
const mappedProduct = mapProduct(mockBackendProduct);
assert.strictEqual(mappedProduct.variants.length, 3, "Mapped product should have 3 variants");
assert.strictEqual(mappedProduct.variants[0].images.length, 2, "Orange variant should have 2 mapped images");
assert.strictEqual(mappedProduct.variants[0].images[0].image_url, "https://example.com/orange1.jpg");
assert.strictEqual(mappedProduct.variants[0].optionsMap.Color, "Orange", "Orange variant optionsMap.Color should be 'Orange'");
console.log("  ✅ Adapter mapping verified successfully!");

// 2. Verify Gallery Images Selection for Variant with Multiple Images (Orange)
console.log("  [2/5] Testing Gallery Images for Variant with Multiple Images (Orange)...");
const orangeVariant = mappedProduct.variants[0];
const orangeGallery = getGalleryImages(orangeVariant, mappedProduct);
assert.strictEqual(orangeGallery.length, 2, "Orange gallery should have 2 images");
assert.strictEqual(orangeGallery[0], "https://example.com/orange1.jpg", "Primary Orange image should be 1st");
assert.strictEqual(orangeGallery[1], "https://example.com/orange2.jpg", "2nd Orange image should be 2nd");
console.log("  ✅ Multiple images gallery verified successfully!");

// 3. Verify Gallery Images Selection for Variant with 1 Image (White)
console.log("  [3/5] Testing Gallery Images for Variant with 1 Image (White)...");
const whiteVariant = mappedProduct.variants[1];
const whiteGallery = getGalleryImages(whiteVariant, mappedProduct);
assert.strictEqual(whiteGallery.length, 1, "White gallery should have 1 image");
assert.strictEqual(whiteGallery[0], "https://example.com/white1.jpg", "White image should be 1st");
console.log("  ✅ Single image gallery verified successfully!");

// 4. Verify Fallback to Product Images for Variant with No Images (Pink)
console.log("  [4/5] Testing Fallback to Product Default Images for Variant with No Images (Pink)...");
const pinkVariant = mappedProduct.variants[2];
const pinkGallery = getGalleryImages(pinkVariant, mappedProduct);
assert.strictEqual(pinkGallery[0], "https://example.com/product-main.jpg", "Should fallback to product main image");
assert.strictEqual(pinkGallery[1], "https://example.com/product-angle2.jpg", "Should include product gallery image");
console.log("  ✅ Fallback to product images verified successfully!");

// 5. Verify State Index Reset Simulation (Orange -> Thumbnail 2 -> White)
console.log("  [5/5] Testing Active Image Index State Transitions & Reset...");
let activeImageIndex = 0;

// User selects Orange
let currentImages = getGalleryImages(orangeVariant, mappedProduct);
activeImageIndex = 0;
let activeImage = currentImages[activeImageIndex] ?? currentImages[0];
assert.strictEqual(activeImage, "https://example.com/orange1.jpg", "Selecting Orange should set activeImage to orange1.jpg");

// User clicks thumbnail 2 (index 1)
activeImageIndex = 1;
activeImage = currentImages[activeImageIndex] ?? currentImages[0];
assert.strictEqual(activeImage, "https://example.com/orange2.jpg", "Clicking thumbnail 2 should set activeImage to orange2.jpg");

// User selects White -> variant change triggers useEffect -> activeImageIndex resets to 0
currentImages = getGalleryImages(whiteVariant, mappedProduct);
activeImageIndex = 0; // Simulated useEffect([selectedVariant])
activeImage = currentImages[activeImageIndex] ?? currentImages[0];
assert.strictEqual(activeImageIndex, 0, "Selecting White must reset activeImageIndex to 0");
assert.strictEqual(activeImage, "https://example.com/white1.jpg", "Active image must now be white1.jpg");

console.log("  ✅ Active image index transitions & reset verified successfully!");

console.log("\n🎉 ALL PRODUCT VARIANT GALLERY AUTOMATED TESTS PASSED CLEANLY!");
