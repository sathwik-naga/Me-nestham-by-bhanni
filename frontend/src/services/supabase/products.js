import { mapProduct } from "./adapters";
import { api } from "../api";

export async function getProducts() {
  const result = await api.get("/products?limit=100");
  return result.data.products.map(mapProduct);
}