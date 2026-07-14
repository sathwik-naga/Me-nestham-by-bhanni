import { mockProducts, mockCategories, mockCoupons } from "../data/mockProducts";

const KEYS = {
  PRODUCTS: "mn_products",
  CATEGORIES: "mn_categories",
  COUPONS: "mn_coupons",
  ORDERS: "mn_orders",
  CUSTOMERS: "mn_customers",
  USERS: "mn_users",
  CURRENT_USER: "mn_current_user"
};

// Initialize DB if empty
export const initDB = () => {
  if (!localStorage.getItem(KEYS.PRODUCTS)) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(mockProducts));
  }
  if (!localStorage.getItem(KEYS.CATEGORIES)) {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(mockCategories));
  }
  if (!localStorage.getItem(KEYS.COUPONS)) {
    localStorage.setItem(KEYS.COUPONS, JSON.stringify(mockCoupons));
  }
  if (!localStorage.getItem(KEYS.ORDERS)) {
    // Initial mock orders
    const initialOrders = [
      {
        id: "ORD-2025-00123",
        userId: "user-1",
        date: "2026-07-10T14:30:00.000Z",
        items: [
          {
            id: "prod-1",
            name: "Handcrafted Terracotta Diya Set",
            slug: "handcrafted-terracotta-diyas",
            image: "https://images.unsplash.com/photo-1605886300898-1e42f9e4bd33?auto=format&fit=crop&w=600&q=80",
            price: 849,
            quantity: 2,
            variant: "Natural Terracotta"
          }
        ],
        subtotal: 1698,
        discount: 169.80,
        shipping: 0,
        total: 1528.20,
        couponCode: "WELCOME10",
        shippingAddress: {
          fullName: "Priya Sharma",
          phone: "9876543210",
          addressLine1: "Flat 402, Royal Residency",
          addressLine2: "Jubilee Hills",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500033",
          addressType: "Home"
        },
        shippingMethod: "Standard Delivery",
        paymentMethod: "Razorpay (UPI)",
        paymentStatus: "Paid",
        status: "Confirmed", // Placed, Confirmed, Packed, Shipped, Delivered, Cancelled
        trackingNumber: "TRK-9832104",
        history: [
          { status: "Placed", date: "2026-07-10T14:30:00.000Z", note: "Order placed by customer." },
          { status: "Confirmed", date: "2026-07-10T15:00:00.000Z", note: "Payment verified, order confirmed." }
        ]
      }
    ];
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(initialOrders));
  }
  if (!localStorage.getItem(KEYS.CUSTOMERS)) {
    const initialCustomers = [
      {
        id: "user-1",
        name: "Priya Sharma",
        email: "priya@example.com",
        phone: "9876543210",
        joinDate: "2026-06-01",
        totalOrders: 1,
        totalSpent: 1528.20,
        status: "Active",
        addresses: [
          {
            id: "addr-1",
            fullName: "Priya Sharma",
            phone: "9876543210",
            addressLine1: "Flat 402, Royal Residency",
            addressLine2: "Jubilee Hills",
            city: "Hyderabad",
            state: "Telangana",
            pincode: "500033",
            addressType: "Home"
          }
        ]
      }
    ];
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
  }
  if (!localStorage.getItem(KEYS.USERS)) {
    // Initial registered users for Auth simulation
    const initialUsers = [
      {
        id: "user-1",
        name: "Priya Sharma",
        email: "priya@example.com",
        password: "password123", // simulation hash
        role: "user",
        phone: "9876543210"
      },
      {
        id: "admin-1",
        name: "Bhanni Admin",
        email: "admin@bhanni.com",
        password: "adminpassword",
        role: "admin",
        phone: "9999999999"
      }
    ];
    localStorage.setItem(KEYS.USERS, JSON.stringify(initialUsers));
  }
};

// Auto-run init
initDB();

// DB Accessors
export const db = {
  // Products
  getProducts: () => JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || "[]"),
  saveProduct: (product) => {
    const products = db.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      products[index] = product;
    } else {
      products.unshift(product); // New products on top
    }
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    db.syncInventory(product);
    return product;
  },
  deleteProduct: (id) => {
    const products = db.getProducts().filter(p => p.id !== id);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },

  // Inventory Sync (Sync products metadata with stock levels)
  syncInventory: (product) => {
    const totalStock = product.variants ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0) : (product.stockCount || 0);
    product.inStock = totalStock > 0;
    product.stockCount = totalStock;
  },

  // Categories
  getCategories: () => JSON.parse(localStorage.getItem(KEYS.CATEGORIES) || "[]"),
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
  getCoupons: () => JSON.parse(localStorage.getItem(KEYS.COUPONS) || "[]"),
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
  getOrders: () => JSON.parse(localStorage.getItem(KEYS.ORDERS) || "[]"),
  getOrderById: (id) => db.getOrders().find(o => o.id === id),
  getOrdersByUser: (userId) => db.getOrders().filter(o => o.userId === userId),
  saveOrder: (order) => {
    const orders = db.getOrders();
    orders.unshift(order); // Newest orders first
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    
    // Deduct stock
    const products = db.getProducts();
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.id);
      if (prod) {
        if (prod.variants && item.variant) {
          const v = prod.variants.find(v => v.name === item.variant);
          if (v) v.stock = Math.max(0, v.stock - item.quantity);
        } else {
          prod.stockCount = Math.max(0, prod.stockCount - item.quantity);
        }
        db.syncInventory(prod);
        db.saveProduct(prod);
      }
    });

    // Update customer stats
    const customers = db.getCustomers();
    const custIndex = customers.findIndex(c => c.id === order.userId);
    if (custIndex >= 0) {
      customers[custIndex].totalOrders += 1;
      customers[custIndex].totalSpent += order.total;
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
  getCustomers: () => JSON.parse(localStorage.getItem(KEYS.CUSTOMERS) || "[]"),
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

  // Users (for auth simulation)
  getUsers: () => JSON.parse(localStorage.getItem(KEYS.USERS) || "[]"),
  addUser: (user) => {
    const users = db.getUsers();
    users.push(user);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));

    // Also add to customers table
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
