import { mapProduct } from "./adapters";
import { api } from "../api";
import { deduplicatedFetch } from "../../utils/performance";

export async function getProducts() {
  return deduplicatedFetch("/products?limit=100", async () => {
    const result = await api.get("/products?limit=100");
    return result.data.products.map(mapProduct);
  });
}

export async function createProduct(productData) {
  const result = await api.post("/products", productData);
  return mapProduct(result.data.product);
}

export async function updateProduct(id, productData) {
  const result = await api.put(`/products/${id}`, productData);
  return mapProduct(result.data.product);
}

export async function deleteProduct(id) {
  await api.delete(`/products/${id}`);
}