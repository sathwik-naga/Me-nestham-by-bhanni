import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { getGalleryImages } from "../../utils/galleryHelpers";

export { getGalleryImages };

export default function ProductGallery({
  product,
  selectedVariant,
  activeImageIndex = 0,
  setActiveImageIndex
}) {
  const [isFading, setIsFading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Derive images & active image dynamically from selectedVariant & product
  const currentImages = getGalleryImages(selectedVariant, product);
  const activeImage = currentImages[activeImageIndex] ?? currentImages[0] ?? "/placeholder.png";

  // Preload variant and product images into browser cache for zero-delay switching
  useEffect(() => {
    if (!product) return;

    const urlsToPreload = new Set();
    if (product.image) urlsToPreload.add(product.image);
    if (product.image_url) urlsToPreload.add(product.image_url);

    if (Array.isArray(product.images)) {
      product.images.forEach((img) => {
        const url = typeof img === "string" ? img : img.image_url || img.url || img.src;
        if (url) urlsToPreload.add(url);
      });
    }

    if (Array.isArray(product.variants)) {
      product.variants.forEach((v) => {
        if (Array.isArray(v.images)) {
          v.images.forEach((img) => {
            const url = typeof img === "string" ? img : img.image_url || img.url || img.src;
            if (url) urlsToPreload.add(url);
          });
        }
      });
    }

    urlsToPreload.forEach((url) => {
      if (url && url !== "/placeholder.png") {
        const imgObj = new Image();
        imgObj.src = url;
      }
    });
  }, [product]);

  const handleThumbnailClick = (index) => {
    if (index === activeImageIndex) return;
    setIsFading(true);
    setActiveImageIndex(index);
    setTimeout(() => {
      setIsFading(false);
    }, 150);
  };

  const handleOpenLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : currentImages.length - 1));
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev < currentImages.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, currentImages.length]);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Stage */}
      <div
        onClick={() => handleOpenLightbox(activeImageIndex)}
        className="aspect-square bg-brand-secondary rounded-3xl overflow-hidden border border-brand-border shadow-sm cursor-zoom-in relative group"
      >
        <img
          src={activeImage}
          alt={product?.name || "Product image"}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.png";
          }}
          className={`w-full h-full object-cover rounded-xl group-hover:scale-105 transition-all duration-300 ${
            isFading ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
        />
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <ZoomIn size={12} />
          <span>Click to Enlarge</span>
        </div>
      </div>

      {/* Thumbnails Bar */}
      {currentImages.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
          {currentImages.map((img, index) => {
            const isSelected = activeImageIndex === index;
            return (
              <button
                key={`${img}-${index}`}
                onClick={() => handleThumbnailClick(index)}
                aria-label={`View image ${index + 1}`}
                className={`rounded-xl overflow-hidden border-2 transition-all duration-200 shrink-0 cursor-pointer ${
                  isSelected
                    ? "border-brand-primary ring-2 ring-brand-primary/40 scale-105"
                    : "border-brand-border hover:border-brand-primary/60 opacity-80 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.png";
                  }}
                  className="w-16 h-16 md:w-20 md:h-20 object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Image Counter Indicator */}
      <p className="text-center text-xs font-mono text-brand-text-muted">
        Image {Math.min(activeImageIndex + 1, currentImages.length)} of {currentImages.length}
      </p>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Close Lightbox"
            className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10"
          >
            <X size={24} />
          </button>

          <div className="relative max-w-4xl max-h-[85vh] flex items-center justify-center">
            <img
              src={currentImages[lightboxIndex] || activeImage}
              alt={`${product?.name} full view`}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />

            {currentImages.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : currentImages.length - 1))}
                  aria-label="Previous Image"
                  className="absolute left-2 md:-left-12 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all cursor-pointer"
                >
                  <ChevronLeft size={24} />
                </button>

                <button
                  onClick={() => setLightboxIndex((prev) => (prev < currentImages.length - 1 ? prev + 1 : 0))}
                  aria-label="Next Image"
                  className="absolute right-2 md:-right-12 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all cursor-pointer"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Modal Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-mono px-4 py-1.5 rounded-full backdrop-blur-md">
              {lightboxIndex + 1} / {currentImages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
