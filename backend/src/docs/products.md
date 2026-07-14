# Products & Categories API Documentation

This module manages categories, products, images, variants, and product stock (stored directly in the products table).

---

## Data Representations

### Category Object
```json
{
  "id": "7a3bfaee-2e9f-4318-ae76-64d50937a09c",
  "name": "Organic Teas",
  "slug": "organic-teas",
  "description": "Healthy herbal infusions.",
  "image_url": "https://example.com/teas.jpg",
  "created_at": "2026-07-14T10:00:00.000Z"
}
```

### Product Object
Includes category details, images, variants, featured image string, gallery array, and direct stock status:
```json
{
  "id": "b96a40a5-fbfb-47de-9856-4c40590a216f",
  "category_id": "7a3bfaee-2e9f-4318-ae76-64d50937a09c",
  "name": "Hibiscus Elixir",
  "slug": "hibiscus-elixir",
  "description": "Premium brewed hibiscus petals.",
  "price": 19.99,
  "compare_at_price": 24.99,
  "stock": 150,
  "is_active": true,
  "is_featured": true,
  "created_at": "2026-07-14T10:05:00.000Z",
  "updated_at": "2026-07-14T10:05:00.000Z",
  "category": { ... },
  "images": [
    {
      "id": "e4414e21...",
      "product_id": "b96a40a5...",
      "image_url": "https://example.com/elixir_main.jpg",
      "is_featured": true,
      "position": 1
    },
    {
      "id": "f5525f32...",
      "product_id": "b96a40a5...",
      "image_url": "https://example.com/elixir_side.jpg",
      "is_featured": false,
      "position": 2
    }
  ],
  "variants": [
    {
      "id": "d1121d11...",
      "product_id": "b96a40a5...",
      "sku": "HB-ELX-500",
      "name": "500ml Bottle",
      "price": 19.99,
      "stock_quantity": 150,
      "created_at": "2026-07-14T10:05:00.000Z"
    }
  ],
  "featured_image": "https://example.com/elixir_main.jpg",
  "gallery_images": [
    "https://example.com/elixir_main.jpg",
    "https://example.com/elixir_side.jpg"
  ]
}
```

---

## Category Endpoints

### 1. Get Categories
Retrieve a list of all categories.
* **URL:** `/api/categories`
* **Method:** `GET`
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "results": 1,
    "data": {
      "categories": [ ... ]
    }
  }
  ```

### 2. Get Category Details
Retrieve a single category by ID or Slug.
* **URL:** `/api/categories/:idOrSlug` (supports UUID or slug identifier string, e.g., `/api/categories/organic-teas`)
* **Method:** `GET`
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "category": { ... }
    }
  }
  ```

### 3. Admin: Create Category
* **URL:** `/api/categories`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <admin_token>`
* **Body:**
  ```json
  {
    "name": "Cold Drinks",
    "description": "Refreshing iced beverages", // Optional
    "image_url": "https://example.com/drinks.jpg" // Optional
  }
  ```

### 4. Admin: Update Category
* **URL:** `/api/categories/:id`
* **Method:** `PUT`
* **Headers:** `Authorization: Bearer <admin_token>`

### 5. Admin: Delete Category
* **URL:** `/api/categories/:id`
* **Method:** `DELETE`
* **Headers:** `Authorization: Bearer <admin_token>`

---

## Product Endpoints

### 1. List Products
Retrieve paginated lists matching query filter scopes.
* **URL:** `/api/products`
* **Method:** `GET`
* **Query Params (Zod Validated):**
  * `page`: Integer (default 1)
  * `limit`: Integer (default 12)
  * `categoryId`: UUID
  * `minPrice`: Numeric
  * `maxPrice`: Numeric
  * `search`: String (matches Name, Description, and Category Name)
  * `sortBy`: `'created_at' | 'price' | 'name'`
  * `sortOrder`: `'asc' | 'desc'`
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "results": 1,
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 1,
      "totalPages": 1
    },
    "data": {
      "products": [ ... ]
    }
  }
  ```

### 2. Get Product Details
Retrieve a single product by ID or Slug.
* **URL:** `/api/products/:idOrSlug` (supports UUID or slug, e.g., `/api/products/hibiscus-elixir`)
* **Method:** `GET`

### 3. Get Featured Products
Retrieve list of products flagged as featured.
* **URL:** `/api/products/featured`
* **Method:** `GET`
* **Query Params:** `limit` (default 10)

### 4. Get Bestsellers
Retrieve list of top popularity/best-selling products.
* **URL:** `/api/products/bestsellers`
* **Method:** `GET`
* **Query Params:** `limit` (default 10)

### 5. Get New Products
Retrieve list of most recently added products.
* **URL:** `/api/products/new`
* **Method:** `GET`
* **Query Params:** `limit` (default 10)

### 6. Admin: Create Product
* **URL:** `/api/products`
* **Method:** `POST`
* **Headers:** `Authorization: Bearer <admin_token>`
* **Body:**
  ```json
  {
    "category_id": "7a3bfaee-2e9f-4318-ae76-64d50937a09c",
    "name": "Ginger Lemonade",
    "description": "Fresh ginger extract with honey.",
    "price": 12.50,
    "compare_at_price": 15.00,
    "stock": 80,
    "is_active": true,
    "is_featured": true,
    "images": [
      {
        "image_url": "https://example.com/lemonade.png",
        "is_featured": true,
        "position": 1
      }
    ],
    "variants": [
      {
        "sku": "GG-LMN-300",
        "name": "300ml bottle",
        "price": 12.50,
        "stock_quantity": 80
      }
    ]
  }
  ```

### 7. Admin: Update Product
* **URL:** `/api/products/:id`
* **Method:** `PUT`
* **Headers:** `Authorization: Bearer <admin_token>`

### 8. Admin: Delete Product (Soft Delete)
Updates `is_active = false` instead of hard deleting records from PostgreSQL.
* **URL:** `/api/products/:id`
* **Method:** `DELETE`
* **Headers:** `Authorization: Bearer <admin_token>`
* **Response (204 No Content):** (Operation succeeds without returning response body payload).
