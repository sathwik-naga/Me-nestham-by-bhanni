import { api } from "../api";

export async function getCategories() {
  const result = await api.get("/categories");
  return result.data.categories;
}