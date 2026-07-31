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

export interface VariantOption {
  option_name: string;
  option_value: string;
}

export interface VariantImage {
  id: string;
  variant_id: string;
  storage_path?: string | null;
  image_url: string;
  media_type?: string;
  alt_text?: string | null;
  sort_order: number;
  is_primary: boolean;
  position?: number;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  variant_name?: string; // Database column name in product_variants table
  name?: string;         // Virtual/Mapped property for API & frontend convenience
  price: number;
  sale_price?: number | null;
  stock?: number;
  stock_quantity?: number;
  weight?: number | null;
  is_default?: boolean;
  status?: string;
  created_at: string;
  updated_at?: string;
  options?: VariantOption[];
  images?: VariantImage[];
  size?: string | null;
  color?: string | null;
  material?: string | null;
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
