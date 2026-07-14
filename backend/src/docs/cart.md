# Cart API Documentation

The Cart module manages user shopping carts stored in the database. All cart endpoints require user authentication (Bearer JWT token). 

Derivation of active carts is performed securely on the backend using the user ID resolved from `req.user.id`.

---

## Data Representations

### Cart Response Body (Format)
```json
{
  "status": "success",
  "data": {
    "cart": {
      "items": [
        {
          "id": "2bc9837a-4299-4d6a-8cbf-05a8d9bf1ef2",
          "cart_id": "764fb8c2-2bf2-48bf-ae23-e5e6e3921eb0",
          "product_id": "d6c23648-6396-4eec-a22e-45801144ec57",
          "quantity": 2,
          "created_at": "2026-07-14T11:00:00.000Z",
          "updated_at": "2026-07-14T11:00:00.000Z",
          "product": {
            "id": "d6c23648-6396-4eec-a22e-45801144ec57",
            "category_id": "0a8a8547-14e9-45e0-8b9a-83cd1226bd1b",
            "name": "Rose Petal Pack",
            "slug": "rose-petal-pack",
            "price": 299,
            "compare_price": 349,
            "stock": 100,
            "featured": true,
            "bestseller": true,
            "is_active": true,
            "featured_image": "https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/WhatsApp%20Image%202026-07-12%20at%209.22.43%20PM.jpeg",
            "gallery_images": [ ... ]
          }
        }
      ],
      "summary": {
        "totalItems": 2,
        "subtotal": 598,
        "shipping": 0,
        "discount": 0,
        "grandTotal": 598
      }
    }
  }
}
```

---

## Endpoints

### 1. Retrieve Active Cart
Fetches the current user's active shopping cart items and compiles subtotal/totals summaries. Creates a cart record if none exists.
* **URL:** `/api/cart`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <access_token>`
* **Response (200 OK):** See Cart Response Body above.

### 2. Add Item to Cart
Add a product quantity to the user's cart. If the product is already present, its quantity is incremented.
* **URL:** `/api/cart/items`
* **Method:** `POST`
* **Headers:** 
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Body Schema (Zod):**
  ```json
  {
    "product_id": "d6c23648-6396-4eec-a22e-45801144ec57", // Valid UUID
    "quantity": 2 // Positive integer >= 1
  }
  ```
* **Validation Guards:**
  * Throws `404` if the product does not exist.
  * Throws `400` if the product `is_active` is `false`.
  * Throws `400` if `product.stock` is `<= 0` (Out of stock).
  * Throws `400` if the requested quantity (plus any existing cart quantity) exceeds available `product.stock`.
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Item successfully added to cart",
    "data": { "cart": { ... } }
  }
  ```

### 3. Update Cart Item Quantity
Explicitly update the quantity of a specific item inside the cart.
* **URL:** `/api/cart/items/:itemId`
* **Method:** `PUT`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Body Schema (Zod):**
  ```json
  {
    "quantity": 5 // Positive integer >= 1
  }
  ```
* **Validation Guards:**
  * Throws `404` if the cart item does not exist or does not belong to the user's cart.
  * If quantity is `0` or negative, the item is automatically removed from the cart (Zod enforces `>= 1`, but service handles `<= 0` gracefully as delete).
  * Throws `400` if the requested quantity exceeds the current `product.stock` column.
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Cart item quantity updated",
    "data": { "cart": { ... } }
  }
  ```

### 4. Remove Item from Cart
Delete a specific product item row from the cart.
* **URL:** `/api/cart/items/:itemId`
* **Method:** `DELETE`
* **Headers:** `Authorization: Bearer <access_token>`
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Item removed from cart",
    "data": { "cart": { ... } }
  }
  ```

### 5. Clear Cart
Remove all product item rows from the user's shopping cart.
* **URL:** `/api/cart`
* **Method:** `DELETE`
* **Headers:** `Authorization: Bearer <access_token>`
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Cart cleared successfully",
    "data": { "cart": { ... } }
  }
  ```
