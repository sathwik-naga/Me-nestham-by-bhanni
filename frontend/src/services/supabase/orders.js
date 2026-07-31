import { api } from "../api";
import { mapOrder } from "./adapters";

export async function getOrders(page = 1, limit = 100) {
  const result = await api.get(`/orders?page=${page}&limit=${limit}`);
  const mappedOrders = result.data.orders.map(mapOrder);
  return {
    ...result.data,
    orders: mappedOrders
  };
}

export async function getOrderDetails(orderId) {
  const result = await api.get(`/orders/${orderId}`);
  return mapOrder(result.data.order);
}

export async function updateOrderStatus(orderId, statusData) {
  const result = await api.put(`/orders/${orderId}`, statusData);
  return mapOrder(result.data.order);
}
