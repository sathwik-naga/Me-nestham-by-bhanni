import { normalizeCategories, normalizeProducts } from "../utils/imageOptimizer";
import { clearApiCache } from "../utils/performance";

const KEYS = {
  PRODUCTS: "mn_products",
  CATEGORIES: "mn_categories",
  COUPONS: "mn_coupons",
  ORDERS: "mn_orders",
  CUSTOMERS: "mn_customers",
  USERS: "mn_users",
  CURRENT_USER: "mn_current_user"
};

export const CATALOG_RESET_KEY = "mn_catalog_reset_v20261004";

// Unconditional one-time migration for all visitors to purge old cached test catalog
export const runCatalogMigration = () => {
  try {
    clearApiCache();
    if (typeof window === "undefined" || !window.localStorage) return;
    
    const migrationDone = localStorage.getItem(CATALOG_RESET_KEY);
    if (migrationDone !== "true") {
      // 1. Purge obsolete catalog data unconditionally
      localStorage.removeItem(KEYS.PRODUCTS);
      localStorage.removeItem(KEYS.CATEGORIES);
      localStorage.removeItem("mn_recent_products");
      localStorage.removeItem("mn_cart_cache");

      // 2. Clear old guest wishlist & guest cart if populated with deleted catalog items
      localStorage.removeItem("mn_wishlist_guest");
      localStorage.removeItem("mn_cart_guest");

      // 3. Clear any user wishlist keys that contain old test product IDs
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("mn_wishlist_")) {
          localStorage.removeItem(k);
        }
      }

      // 4. Reset orders cache if from previous test runs
      localStorage.removeItem(KEYS.ORDERS);

      // 5. Initialize fresh empty arrays so components receive clean state
      localStorage.setItem(KEYS.PRODUCTS, "[]");
      localStorage.setItem(KEYS.CATEGORIES, "[]");

      // 6. Set migration flag
      localStorage.setItem(CATALOG_RESET_KEY, "true");
    }
  } catch (err) {
    console.warn("Catalog reset migration warning:", err);
  }
};

// Initialize DB and run migration immediately
export const initDB = () => {
  runCatalogMigration();
};

// Auto-run init on module evaluation
initDB();

// DB Accessors
export const db = {
  // Products - returns empty array if no catalog is present, never resurrects old mock data
  getProducts: () => {
    try {
      const stored = localStorage.getItem(KEYS.PRODUCTS);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed) || parsed.length === 0) return [];
      return normalizeProducts(parsed);
    } catch {
      return [];
    }
  },
  saveProduct: (product) => {
    const products = db.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.unshift(product);
    }
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    db.syncInventory(product);
    return product;
  },
  deleteProduct: (id) => {
    const products = db.getProducts().filter(p => p.id !== id);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  // Inventory Sync
  syncInventory: (product) => {
    const totalStock = product.variants ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0) : (product.stockCount || 0);
    product.inStock = totalStock > 0;
    product.stockCount = totalStock;
  },

  // Categories - returns empty array if no categories are present, never resurrects old mock data
  getCategories: () => {
    try {
      const stored = localStorage.getItem(KEYS.CATEGORIES);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed) || parsed.length === 0) return [];
      return normalizeCategories(parsed);
    } catch {
      return [];
    }
  },
  saveCategory: (category) => {
    const categories = db.getCategories();
    const index = categories.findIndex(c => c.id === category.id);
    if (index >= 0) {
      categories[index] = category;
    } else {
      categories.push(category);
    }
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    return category;
  },
  deleteCategory: (id) => {
    const categories = db.getCategories().filter(c => c.id !== id);
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  },

  // Coupons
  getCoupons: () => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.COUPONS) || "[]");
    } catch {
      return [];
    }
  },
  saveCoupon: (coupon) => {
    const coupons = db.getCoupons();
    const index = coupons.findIndex(c => c.code.toUpperCase() === coupon.code.toUpperCase());
    if (index >= 0) {
      coupons[index] = coupon;
    } else {
      coupons.push(coupon);
    }
    localStorage.setItem(KEYS.COUPONS, JSON.stringify(coupons));
    return coupon;
  },
  deleteCoupon: (code) => {
    const coupons = db.getCoupons().filter(c => c.code.toUpperCase() !== code.toUpperCase());
    localStorage.setItem(KEYS.COUPONS, JSON.stringify(coupons));
  },

  // Orders
  getOrders: () => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.ORDERS) || "[]");
    } catch {
      return [];
    }
  },
  getOrderById: (id) => db.getOrders().find(o => o.id === id),
  getOrdersByUser: (userId) => db.getOrders().filter(o => o.userId === userId),
  saveOrder: (order) => {
    const orders = db.getOrders();
    orders.unshift(order);
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    
    // Deduct stock
    const products = db.getProducts();
    order.items?.forEach(item => {
      const prod = products.find(p => p.id === item.id);
      if (prod) {
        if (prod.variants && item.variant) {
          const v = prod.variants.find(v => v.name === item.variant);
          if (v) v.stock = Math.max(0, v.stock - item.quantity);
        } else {
          prod.stockCount = Math.max(0, (prod.stockCount || 0) - item.quantity);
        }
        db.syncInventory(prod);
        db.saveProduct(prod);
      }
    });

    // Update customer stats
    const customers = db.getCustomers();
    const custIndex = customers.findIndex(c => c.id === order.userId);
    if (custIndex >= 0) {
      customers[custIndex].totalOrders = (customers[custIndex].totalOrders || 0) + 1;
      customers[custIndex].totalSpent = (customers[custIndex].totalSpent || 0) + order.total;
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    }

    return order;
  },
  updateOrderStatus: (orderId, status, trackingNumber = "", note = "") => {
    const orders = db.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index >= 0) {
      orders[index].status = status;
      if (trackingNumber) {
        orders[index].trackingNumber = trackingNumber;
      }
      orders[index].history = orders[index].history || [];
      orders[index].history.push({
        status,
        date: new Date().toISOString(),
        note: note || `Order status updated to ${status}.`
      });
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
      return orders[index];
    }
    return null;
  },

  // Customers
  getCustomers: () => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.CUSTOMERS) || "[]");
    } catch {
      return [];
    }
  },
  saveCustomer: (customer) => {
    const customers = db.getCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      customers[index] = customer;
    } else {
      customers.push(customer);
    }
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    return customer;
  },

  // Users (for auth fallback simulation)
  getUsers: () => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.USERS) || "[]");
    } catch {
      return [];
    }
  },
  addUser: (user) => {
    const users = db.getUsers();
    users.push(user);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));

    db.saveCustomer({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      joinDate: new Date().toISOString().split("T")[0],
      totalOrders: 0,
      totalSpent: 0,
      status: "Active",
      addresses: []
    });
  }
};
