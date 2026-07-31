import { api } from "./api";

export const shippingService = {
  /**
   * Create shipment in Shiprocket
   */
  createShipment: async (orderId) => {
    const response = await api.post("/shipping/create", { orderId });
    return response.data;
  },

  /**
   * Generate AWB code
   */
  generateAwb: async (orderId) => {
    const response = await api.post("/shipping/awb", { orderId });
    return response.data;
  },

  /**
   * Schedule pickup
   */
  schedulePickup: async (orderId) => {
    const response = await api.post("/shipping/pickup", { orderId });
    return response.data;
  },

  /**
   * Generate label url
   */
  downloadLabel: async (orderId) => {
    const response = await api.post("/shipping/label", { orderId });
    return response.data;
  },

  /**
   * Generate invoice url
   */
  downloadInvoice: async (orderId) => {
    const response = await api.post("/shipping/invoice", { orderId });
    return response.data;
  },

  /**
   * Generate manifest url
   */
  downloadManifest: async (orderId) => {
    const response = await api.post("/shipping/manifest", { orderId });
    return response.data;
  },

  /**
   * Cancel shipment
   */
  cancelShipment: async (orderId) => {
    const response = await api.post(`/shipping/${orderId}/cancel`);
    return response.data;
  },

  /**
   * Fetch shipment details
   */
  getShipment: async (orderId) => {
    const response = await api.get(`/shipping/${orderId}`);
    return response.data;
  },

  /**
   * Trigger tracking refresh
   */
  trackShipment: async (orderId) => {
    const response = await api.get(`/shipping/${orderId}/track`);
    return response.data;
  }
};
