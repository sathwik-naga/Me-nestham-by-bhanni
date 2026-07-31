import React, { useEffect } from "react";
import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE } from "../../utils/seo";

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  noindex = false,
  prevUrl,
  nextUrl,
  jsonLd,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const currentCanonical = canonicalUrl || (typeof window !== "undefined" ? window.location.href : SITE_URL);
  const absoluteOgImage = ogImage?.startsWith("http") ? ogImage : `${SITE_URL}${ogImage?.startsWith("/") ? "" : "/"}${ogImage}`;

  const googleVerification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION;
  const bingVerification = import.meta.env.VITE_BING_SITE_VERIFICATION;
  const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

  useEffect(() => {
    // 1. Update Title
    document.title = fullTitle;

    // Helper to insert or update meta tags in document head
    const updateMetaTag = (selector, attribute, value) => {
      if (!value) return;
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement("meta");
        const match = selector.match(/\[(name|property)=["']?([^"']+)["']?\]/);
        if (match) {
          tag.setAttribute(match[1], match[2]);
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute(attribute, value);
    };

    // Helper to insert or update link tags
    const updateLinkTag = (rel, href) => {
      let tag = document.querySelector(`link[rel="${rel}"]`);
      if (!href) {
        if (tag) tag.remove();
        return;
      }
      if (!tag) {
        tag = document.createElement("link");
        tag.setAttribute("rel", rel);
        document.head.appendChild(tag);
      }
      tag.setAttribute("href", href);
    };

    // 2. Standard Meta Tags
    updateMetaTag('meta[name="description"]', "content", description);
    if (keywords) {
      updateMetaTag('meta[name="keywords"]', "content", keywords);
    }
    updateMetaTag('meta[name="robots"]', "content", noindex ? "noindex, nofollow" : "index, follow");

    // Search Engine Verifications
    if (googleVerification) {
      updateMetaTag('meta[name="google-site-verification"]', "content", googleVerification);
    }
    if (bingVerification) {
      updateMetaTag('meta[name="msvalidate.01"]', "content", bingVerification);
    }
    if (fbAppId) {
      updateMetaTag('meta[property="fb:app_id"]', "content", fbAppId);
    }

    // 3. Open Graph Tags
    updateMetaTag('meta[property="og:title"]', "content", fullTitle);
    updateMetaTag('meta[property="og:description"]', "content", description);
    updateMetaTag('meta[property="og:image"]', "content", absoluteOgImage);
    updateMetaTag('meta[property="og:url"]', "content", currentCanonical);
    updateMetaTag('meta[property="og:type"]', "content", ogType);
    updateMetaTag('meta[property="og:site_name"]', "content", SITE_NAME);

    // 4. Twitter Card Tags
    updateMetaTag('meta[name="twitter:card"]', "content", "summary_large_image");
    updateMetaTag('meta[name="twitter:title"]', "content", fullTitle);
    updateMetaTag('meta[name="twitter:description"]', "content", description);
    updateMetaTag('meta[name="twitter:image"]', "content", absoluteOgImage);

    // 5. Canonical & Pagination Links
    updateLinkTag("canonical", currentCanonical);
    updateLinkTag("prev", prevUrl);
    updateLinkTag("next", nextUrl);

    // 6. JSON-LD Structured Data Script
    let scriptTag = document.querySelector("#seo-jsonld");
    if (jsonLd) {
      if (!scriptTag) {
        scriptTag = document.createElement("script");
        scriptTag.id = "seo-jsonld";
        scriptTag.type = "application/ld+json";
        document.head.appendChild(scriptTag);
      }
      const jsonContent = Array.isArray(jsonLd) ? JSON.stringify(jsonLd) : JSON.stringify(jsonLd);
      scriptTag.textContent = jsonContent;
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [fullTitle, description, keywords, currentCanonical, absoluteOgImage, ogType, noindex, prevUrl, nextUrl, jsonLd]);

  return null;
}
