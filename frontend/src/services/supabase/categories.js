import { api } from "../api";
import { deduplicatedFetch } from "../../utils/performance";
import { normalizeCategories } from "../../utils/imageOptimizer";

export async function getCategories() {
  return deduplicatedFetch("/categories", async () => {
    const result = await api.get("/categories");
    const raw = result?.data?.categories || [];
    return normalizeCategories(raw);
  }, 60000); // 1 minute cache TTL
}

export async function createCategory(categoryData) {
  const result = await api.post("/categories", categoryData);
  return result.data.category;
}

export async function updateCategory(id, categoryData) {
  const result = await api.put(`/categories/${id}`, categoryData);
  return result.data.category;
}

export async function deleteCategory(id) {
  await api.delete(`/categories/${id}`);
}