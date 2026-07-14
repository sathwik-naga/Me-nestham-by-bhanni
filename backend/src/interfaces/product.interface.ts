export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_featured: boolean;
  position: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  price: number;
  stock_quantity: number;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_price?: number | null; // Match "compare_price" column in DB
  stock: number;
  is_active: boolean;
  featured: boolean; // Match "featured" column in DB
  bestseller: boolean; // Match "bestseller" column in DB
  image_url?: string | null; // Match main image_url in DB
  created_at: string;
  updated_at: string;
  category?: Category | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  featured_image?: string | null;
  gallery_images?: string[];
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'created_at' | 'price' | 'name';
  sortOrder?: 'asc' | 'desc';
  isFeatured?: boolean;
  isBestseller?: boolean;
}
