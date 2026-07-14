# Orders API Documentation

The Orders module manages shopping checkouts, order processing, and payment status updates. All order endpoints require user authentication (Bearer JWT token).

---

## Data Representations

### Order Response Body (Format)
```json
{
  "status": "success",
  "data": {
    "order": {
      "id": "e24fb8c2-2bf2-48bf-ae23-e5e6e3921eb0",
      "user_id": "4db53a00-2512-4cef-99a2-e474960bcd15",
      "status": "pending",
      "payment_status": "pending",
      "total_items": 3,
      "subtotal": 897,
      "shipping": 0,
      "discount": 0,
      "grand_total": 897,
      "billing_address": {
        "full_name": "Sathwik Kumar",
        "phone": "+919876543210",
        "email": "user@example.com",
        "address_line1": "Flat 302, Green Meadows",
        "address_line2": "Sector 4",
        "city": "Hyderabad",
        "state": "Telangana",
        "postal_code": "500081",
        "country": "India"
      },
      "shipping_address": {
        "full_name": "Sathwik Kumar",
        "phone": "+919876543210",
        "email": "user@example.com",
        "address_line1": "Flat 302, Green Meadows",
        "address_line2": "Sector 4",
        "city": "Hyderabad",
        "state": "Telangana",
        "postal_code": "500081",
        "country": "India"
      },
      "razorpay_order_id": null,
      "razorpay_payment_id": null,
      "created_at": "2026-07-14T11:10:00.000Z",
      "updated_at": "2026-07-14T11:10:00.000Z",
      "items": [
        {
          "id": "f5a9837a-4299-4d6a-8cbf-05a8d9bf1ef2",
          "order_id": "e24fb8c2-2bf2-48bf-ae23-e5e6e3921eb0",
          "product_id": "d6c23648-6396-4eec-a22e-45801144ec57",
          "product_name": "Rose Petal Pack",
          "product_slug": "rose-petal-pack",
          "unit_price": 299,
          "quantity": 3,
          "subtotal": 897,
          "featured_image": "https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/WhatsApp%20Image%202026-07-12%20at%209.22.43%20PM.jpeg",
          "created_at": "2026-07-14T11:10:00.000Z"
        }
      ]
    }
  }
}
```

---

## Endpoints

### 1. Atomic Checkout
Validates available stock, creates an order snapshot, decrements stock atomically, and clears the user's cart in a single PostgreSQL transaction.
* **URL:** `/api/orders/checkout`
* **Method:** `POST`
* **Headers:** 
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Body Schema (Zod):**
  ```json
  {
    "billing_address": {
      "full_name": "Sathwik Kumar",
      "phone": "+919876543210",
      "email": "user@example.com",
      "address_line1": "Flat 302, Green Meadows",
      "address_line2": "Sector 4",
      "city": "Hyderabad",
      "state": "Telangana",
      "postal_code": "500081",
      "country": "India"
    },
    "shipping_address": {
      "full_name": "Sathwik Kumar",
      "phone": "+919876543210",
      "email": "user@example.com",
      "address_line1": "Flat 302, Green Meadows",
      "address_line2": "Sector 4",
      "city": "Hyderabad",
      "state": "Telangana",
      "postal_code": "500081",
      "country": "India"
    },
    "shipping_fee": 50, // Optional numeric, default 0
    "discount": 10 // Optional numeric, default 0
  }
  ```
* **Validation Guards:**
  * Throws `400` if the cart is empty.
  * Throws `404` if a cart item product does not exist in the database.
  * Throws `400` if any product is not active (`is_active` is `false`).
  * Throws `400` if product stock is lower than cart item quantity.
* **Response (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Order created successfully",
    "data": { "order": { ... } }
  }
  ```

### 2. List Orders (Paginated)
Fetch orders. Standard users can retrieve only their own orders. Admin users can fetch all orders across the system.
* **URL:** `/api/orders`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <access_token>`
* **Query Parameters:**
  * `page`: integer >= 1 (default `1`)
  * `limit`: integer between 1 and 100 (default `10`)
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    },
    "data": {
      "orders": [
        { ... }
      ]
    }
  }
  ```

### 3. Retrieve Single Order Details
Fetches details of a single order. Standard users can retrieve only their own orders. Admin users can retrieve any order by ID.
* **URL:** `/api/orders/:orderId`
* **Method:** `GET`
* **Headers:** `Authorization: Bearer <access_token>`
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": { "order": { ... } }
  }
  ```

### 4. Update Order Status (Admin Only)
Modifies the `status` and/or `payment_status` of an existing order.
* **URL:** `/api/orders/:orderId`
* **Method:** `PUT`
* **Headers:**
  * `Authorization: Bearer <access_token>` (Must have `admin` claims)
  * `Content-Type: application/json`
* **Body Schema (Zod):**
  ```json
  {
    "status": "confirmed", // Optional order status enum
    "payment_status": "paid" // Optional payment status enum
  }
  ```
* **Validation Guards:**
  * Throws `403` if user is not an administrator.
  * Throws `404` if the order does not exist.
  * Throws `400` if body contains invalid enum strings.
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Order status updated successfully",
    "data": { "order": { ... } }
  }
  ```
