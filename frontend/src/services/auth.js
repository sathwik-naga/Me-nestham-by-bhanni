import { db } from "./db";
import { api } from "./api";

// Authentication service integrating with backend APIs
export const authService = {
  // Login
  login: async (email, password) => {
    const result = await api.post("/auth/login", { email, password });

    // Save JWT
    if (result.data?.session?.access_token) {
      localStorage.setItem("access_token", result.data.session.access_token);
    }

    // Map profile details to the format expected by the frontend
    const userProfile = {
      id: result.data.profile.id,
      name: result.data.profile.full_name || email.split("@")[0],
      email: result.data.profile.email,
      role: result.data.profile.role || "customer",
      phone: result.data.profile.phone || ""
    };

    localStorage.setItem("mn_current_user", JSON.stringify(userProfile));

    return userProfile;
  },

  // Google Login / OAuth Simulation - Disabled gracefully
  loginWithGoogle: async () => {
    throw new Error("Google Sign-In is coming soon.");
  },

  // Signup
  signup: async (name, email, password, phone = "") => {
    const result = await api.post("/auth/register", {
      email,
      password,
      full_name: name,
    });

    // Save JWT if present
    const token = result.data?.session?.access_token;
    if (token) {
      localStorage.setItem("access_token", token);
    }

    const userProfile = {
      id: result.data.profile.id,
      name: result.data.profile.full_name || name || email.split("@")[0],
      email: email,
      role: "customer",
      phone: phone
    };

    localStorage.setItem("mn_current_user", JSON.stringify(userProfile));

    // Ensure customer details entry exists in local storage
    const customers = db.getCustomers();
    if (!customers.some(c => c.id === userProfile.id)) {
      db.saveCustomer({
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone || "",
        joinDate: new Date().toISOString().split("T")[0],
        totalOrders: 0,
        totalSpent: 0,
        status: "Active",
        addresses: []
      });
    }

    return userProfile;
  },

  // Logout
  logout: async () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        await api.post("/auth/logout", {});
      } catch (err) {
        console.error("Logout API call failed:", err);
      }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("mn_current_user");
    return true;
  },

  // Get current session user
  getCurrentUser: () => {
    const userStr = localStorage.getItem("mn_current_user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get detailed profile (with addresses & history) from local storage, scoped by backend user ID
  getUserProfile: (userId) => {
    const customers = db.getCustomers();
    let customer = customers.find(c => c.id === userId);
    if (!customer) {
      const currentUser = authService.getCurrentUser();
      customer = {
        id: userId,
        name: currentUser?.name || "User",
        email: currentUser?.email || "",
        phone: currentUser?.phone || "",
        joinDate: new Date().toISOString().split("T")[0],
        totalOrders: 0,
        totalSpent: 0,
        status: "Active",
        addresses: []
      };
      db.saveCustomer(customer);
    }
    return customer;
  },

  // Update profile basic info locally (scoped by user ID)
  updateProfile: async (userId, data) => {
    await new Promise(r => setTimeout(r, 200));
    
    // Sync active session user
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.name = data.name || currentUser.name;
      currentUser.phone = data.phone || currentUser.phone;
      localStorage.setItem("mn_current_user", JSON.stringify(currentUser));
    }

    // Update customer table
    const customers = db.getCustomers();
    const customerIndex = customers.findIndex(c => c.id === userId);
    if (customerIndex >= 0) {
      customers[customerIndex].name = data.name || customers[customerIndex].name;
      customers[customerIndex].phone = data.phone || customers[customerIndex].phone;
      customers[customerIndex].avatar = data.avatar || customers[customerIndex].avatar;
      localStorage.setItem("mn_customers", JSON.stringify(customers));
      return customers[customerIndex];
    } else {
      const newCustomer = {
        id: userId,
        name: data.name || currentUser?.name || "User",
        email: currentUser?.email || "",
        phone: data.phone || currentUser?.phone || "",
        joinDate: new Date().toISOString().split("T")[0],
        totalOrders: 0,
        totalSpent: 0,
        status: "Active",
        addresses: [],
        avatar: data.avatar || ""
      };
      db.saveCustomer(newCustomer);
      return newCustomer;
    }
  },

  // Address CRUD (scoped by user ID)
  saveAddress: async (userId, address) => {
    await new Promise(r => setTimeout(r, 200));
    const customers = db.getCustomers();
    const customerIndex = customers.findIndex(c => c.id === userId);

    if (customerIndex >= 0) {
      const customer = customers[customerIndex];
      if (!customer.addresses) customer.addresses = [];

      if (address.id) {
        // Edit address
        const addrIndex = customer.addresses.findIndex(a => a.id === address.id);
        if (addrIndex >= 0) {
          customer.addresses[addrIndex] = address;
        }
      } else {
        // Create address
        const newAddress = {
          ...address,
          id: "addr-" + Math.random().toString(36).substr(2, 9)
        };
        customer.addresses.push(newAddress);
      }

      db.saveCustomer(customer);
      return customer;
    }
    throw new Error("User not found.");
  },

  deleteAddress: async (userId, addressId) => {
    await new Promise(r => setTimeout(r, 200));
    const customers = db.getCustomers();
    const customerIndex = customers.findIndex(c => c.id === userId);

    if (customerIndex >= 0) {
      const customer = customers[customerIndex];
      customer.addresses = customer.addresses.filter(a => a.id !== addressId);
      db.saveCustomer(customer);
      return customer;
    }
    throw new Error("User not found.");
  }
};
