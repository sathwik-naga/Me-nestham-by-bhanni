import { db } from "./db";

export const aiService = {
  // AI Chat Assistant
  chat: async (messages, currentPageContext = {}) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const products = db.getProducts();
    const categories = db.getCategories();
    
    // Create compact catalog context to inject
    const catalogSummary = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      category: p.category,
      rating: p.rating,
      inStock: p.inStock
    }));

    if (apiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are Bhanni AI, the premium customer shopping assistant for "Me Nestham By Bhanni", a luxury handcrafted Indian e-commerce brand.
                
                Store Context:
                - Categories: ${JSON.stringify(categories.map(c => c.name))}
                - Products Catalog: ${JSON.stringify(catalogSummary)}
                - active Coupons: WELCOME10 (10% off), FESTIVE25 (25% off above ₹2000), FREE500 (₹500 off above ₹3000)
                - Current User Location Page: ${currentPageContext.slug || "Home page"}
                
                Guidelines:
                1. Keep answers warm, helpful, and concise (max 3 sentences).
                2. Recommend products by including their exact name, price and a direct markdown link: [Product Name](/products/product-slug).
                3. If asked about order tracking, instruct them to go to [My Orders](/profile) or search their order ID.
                4. Offer human support via WhatsApp when complex issues arise.
                5. Maintain a polite, premium retail brand persona.`
              },
              ...messages
            ],
            temperature: 0.7
          })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]) {
          return { text: data.choices[0].message.content, isMock: false };
        }
      } catch (err) {
        console.warn("OpenAI API call failed, falling back to local NLP heuristics.", err);
      }
    }

    // --- LOCAL HEURISTIC NLP ENGINE (Fallback) ---
    await new Promise(r => setTimeout(r, 800)); // Simulating latency
    const lastUserMessage = messages[messages.length - 1].content.toLowerCase();
    
    let text = "";
    let recommendedProducts = [];

    // Helper: Find products containing keyword
    const matchProducts = (keyword) => {
      return products.filter(p => 
        p.name.toLowerCase().includes(keyword) || 
        p.shortDescription.toLowerCase().includes(keyword) ||
        p.category.toLowerCase().includes(keyword)
      );
    };

    if (lastUserMessage.includes("hello") || lastUserMessage.includes("hi") || lastUserMessage.includes("hey")) {
      text = "Namaste! Welcome to Me Nestham By Bhanni. I'm Bhanni AI, your shopping companion. How can I help you find something special today?";
    } else if (lastUserMessage.includes("gift") || lastUserMessage.includes("present") || lastUserMessage.includes("mother") || lastUserMessage.includes("parent")) {
      recommendedProducts = products.filter(p => p.rating >= 4.7).slice(0, 3);
      text = "What a wonderful thought! For gifting, our highest-rated handcrafted creations make beautiful presents. Here are a few curated options:";
    } else if (lastUserMessage.includes("jewelry") || lastUserMessage.includes("jewel") || lastUserMessage.includes("earring") || lastUserMessage.includes("jhumka") || lastUserMessage.includes("choker")) {
      recommendedProducts = matchProducts("jewelry");
      text = "Our Handcrafted Jewelry collection showcases exquisite 92.5 sterling silver, brass work, and temple motifs. Check these out:";
    } else if (lastUserMessage.includes("decor") || lastUserMessage.includes("diya") || lastUserMessage.includes("home") || lastUserMessage.includes("brass") || lastUserMessage.includes("pottery")) {
      recommendedProducts = matchProducts("home-decor");
      text = "Adorn your living spaces with our traditional brass work and wood-fired terracotta clay diyas. Here are some favorites:";
    } else if (lastUserMessage.includes("saree") || lastUserMessage.includes("apparel") || lastUserMessage.includes("clothes") || lastUserMessage.includes("cotton") || lastUserMessage.includes("indigo")) {
      recommendedProducts = matchProducts("apparel");
      text = "Our Heritage Apparel is crafted using organic dyes and traditional hand-block prints. Explore these comfortable classics:";
    } else if (lastUserMessage.includes("art") || lastUserMessage.includes("painting") || lastUserMessage.includes("madhubani")) {
      recommendedProducts = matchProducts("art");
      text = "Our traditional paintings are handmade on organic canvas by certified heritage artisans. Highly recommend these:";
    } else if (lastUserMessage.includes("track") || lastUserMessage.includes("order") || lastUserMessage.includes("where is my")) {
      text = "You can easily track your order! Go to [My Orders](/profile) tab in your profile, click on your order, and hit 'Track Order' to see its live shipping status. If you know your order ID, you can also view it directly.";
    } else if (lastUserMessage.includes("discount") || lastUserMessage.includes("coupon") || lastUserMessage.includes("code") || lastUserMessage.includes("offer")) {
      text = "We have three exclusive coupons running: Use **WELCOME10** for 10% off your first order, **FESTIVE25** for 25% off on orders above ₹2000, or **FREE500** for flat ₹500 off on purchases above ₹3000!";
    } else if (lastUserMessage.includes("return") || lastUserMessage.includes("refund") || lastUserMessage.includes("exchange")) {
      text = "All sales are final. We do not accept returns or exchanges once orders are dispatched. If you received a damaged or wrong item, please connect directly with our team on WhatsApp.";
    } else {
      // Default semantic search on all products
      const searchWords = lastUserMessage.split(/\s+/);
      const matches = products.filter(p => 
        searchWords.some(word => 
          word.length > 2 && (
            p.name.toLowerCase().includes(word) || 
            p.category.toLowerCase().includes(word) ||
            p.shortDescription.toLowerCase().includes(word)
          )
        )
      );

      if (matches.length > 0) {
        recommendedProducts = matches.slice(0, 3);
        text = "I found some products matching your request! Let me know if you would like more details about any of these:";
      } else {
        text = "I'm not sure if we carry that exact item, but you can browse our beautiful collections in the [Shop](/shop). For immediate support, feel free to use the WhatsApp link below to chat with our human support team!";
      }
    }

    // Append markdown links of recommended products to text response
    if (recommendedProducts.length > 0) {
      recommendedProducts.forEach(p => {
        text += `\n\n• **[${p.name}](/products/${p.slug})** — ₹${p.price}`;
      });
    }

    return {
      text,
      isMock: true,
      recommendedProducts // passed along to render interactive cards
    };
  },

  // Smart Search heuristic scoring
  smartSearch: (query) => {
    const products = db.getProducts();
    if (!query) return products;

    const normalizedQuery = query.toLowerCase().trim();
    
    // Exact matching first, then word subsets, then category matches
    const scoredProducts = products.map(p => {
      let score = 0;
      if (p.name.toLowerCase() === normalizedQuery) score += 100;
      else if (p.name.toLowerCase().includes(normalizedQuery)) score += 50;

      if (p.category.toLowerCase() === normalizedQuery) score += 30;
      else if (p.category.toLowerCase().includes(normalizedQuery)) score += 10;

      const words = normalizedQuery.split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) {
          if (p.name.toLowerCase().includes(word)) score += 15;
          if (p.shortDescription.toLowerCase().includes(word)) score += 5;
          if (p.specs && Object.values(p.specs).some(val => val.toLowerCase().includes(word))) score += 5;
        }
      });

      return { product: p, score };
    });

    return scoredProducts
      .filter(sp => sp.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(sp => sp.product);
  },

  // AI Description Generator (Admin Panel)
  generateProductDescription: async (productName, category, tags = "") => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a professional copywriting assistant. Generate a premium, sensory-rich, SEO-optimized e-commerce product description (approx. 100 words) for a luxury Indian handicraft brand."
              },
              {
                role: "user",
                content: `Product: ${productName}, Category: ${category}, Tags: ${tags}`
              }
            ],
            temperature: 0.8
          })
        });
        const data = await response.json();
        if (data.choices && data.choices[0]) {
          return data.choices[0].message.content;
        }
      } catch (err) {
        console.warn("OpenAI API call failed, using mock generator.", err);
      }
    }

    // Local Mock generator
    await new Promise(r => setTimeout(r, 600));
    return `Exquisitely handcrafted by heritage artisans, this premium ${productName} brings together centuries of traditional craftsmanship and refined modern aesthetics. Made from carefully selected, ethically sourced materials in the category of ${category}, it represents the perfect embodiment of Indian art and cultural pride. Every line is hand-carved, and every detail represents the master maker's lifetime dedication to perfection. Ideal as a legacy centerpiece or a thoughtful premium gift for someone special. Tagged under: ${tags || 'Handmade, Artisan, Heritage'}.`;
  },

  // AI SEO Suggestions Generator (Admin Panel)
  generateSEOSuggestions: async (productName, category, description) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: "You are an SEO expert. Generate an optimized JSON object with exactly three string fields: 'metaTitle' (under 60 chars), 'metaDescription' (under 160 chars), and 'keywords' (comma separated list of 5-8 items)."
              },
              {
                role: "user",
                content: `Product: ${productName}, Category: ${category}, Description snippet: ${description.substring(0, 150)}`
              }
            ],
            temperature: 0.5
          })
        });
        const data = await response.json();
        if (data.choices && data.choices[0]) {
          return JSON.parse(data.choices[0].message.content);
        }
      } catch (err) {
        console.warn("OpenAI API call failed, using mock SEO generator.", err);
      }
    }

    // Local Mock generator
    await new Promise(r => setTimeout(r, 500));
    const title = `Handcrafted ${productName} | Me Nestham By Bhanni`;
    const desc = `Shop our premium, artisan-made ${productName} online. Ethically sourced and handcrafted by traditional Indian master weavers and artisans. Free shipping!`;
    const keywords = `handcrafted ${productName}, purchase ${productName}, indian handicraft store, artisan made ${category}, bhanni online shop, pure authentic ${productName}`;
    
    return {
      metaTitle: title,
      metaDescription: desc,
      keywords: keywords
    };
  }
};
