# Authentication & Authorization API Documentation

The authentication module integrates with Supabase Auth for identity management and JWT issuance, coupled with a PostgreSQL `profiles` table to manage roles and metadata.

## Endpoints

### 1. Register User
Register a new customer account.

* **URL:** `/api/auth/register`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Body Schema (Zod):**
  ```json
  {
    "email": "customer@example.com",
    "password": "securepassword123",
    "full_name": "John Doe" // Optional
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Account successfully registered",
    "data": {
      "session": null, // Will contain session object if confirmation is disabled in Supabase
      "user": {
        "id": "e8a93943-7fcd-4009-bf2c-eb026859550e",
        "email": "customer@example.com"
      },
      "profile": {
        "id": "e8a93943-7fcd-4009-bf2c-eb026859550e",
        "email": "customer@example.com",
        "full_name": "John Doe",
        "role": "customer",
        "created_at": "2026-07-14T10:20:00.000Z",
        "updated_at": "2026-07-14T10:20:00.000Z"
      }
    }
  }
  ```
* **Error Response (400 Bad Request / Validation Failed):**
  ```json
  {
    "status": "fail",
    "message": "Validation failed",
    "errors": [
      {
        "field": "body.email",
        "message": "Please provide a valid email address"
      }
    ]
  }
  ```

---

### 2. Login User
Authenticate credentials and fetch access token and user profile.

* **URL:** `/api/auth/login`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Body Schema (Zod):**
  ```json
  {
    "email": "customer@example.com",
    "password": "securepassword123"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Logged in successfully",
    "data": {
      "session": {
        "access_token": "eyJhbGciOi...",
        "refresh_token": "r1v84z...",
        "expires_in": 3600
      },
      "profile": {
        "id": "e8a93943-7fcd-4009-bf2c-eb026859550e",
        "email": "customer@example.com",
        "full_name": "John Doe",
        "role": "customer",
        "created_at": "2026-07-14T10:20:00.000Z",
        "updated_at": "2026-07-14T10:20:00.000Z"
      }
    }
  }
  ```
* **Error Response (400 Invalid Credentials):**
  ```json
  {
    "status": "error",
    "message": "Invalid login credentials"
  }
  ```

---

### 3. Logout User
Revoke current authenticated session token.

* **URL:** `/api/auth/logout`
* **Method:** `POST`
* **Headers:** 
  * `Authorization: Bearer <access_token>`
* **Success Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Logged out successfully"
  }
  ```

---

### 4. Get Current Profile
Fetch profile details for the currently authenticated user.

* **URL:** `/api/auth/me`
* **Method:** `GET`
* **Headers:** 
  * `Authorization: Bearer <access_token>`
* **Success Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "profile": {
        "id": "e8a93943-7fcd-4009-bf2c-eb026859550e",
        "email": "customer@example.com",
        "full_name": "John Doe",
        "role": "customer",
        "created_at": "2026-07-14T10:20:00.000Z",
        "updated_at": "2026-07-14T10:20:00.000Z"
      }
    }
  }
  ```

---

## Middlewares & Roles Guard

### `authMiddleware`
Verifies the presence and validity of the Bearer token in the `Authorization` header. On success, it binds user metadata to the Request context:
```typescript
req.user = {
  id: string; // User UUID from auth.users
  email: string;
  role: 'customer' | 'admin';
}
```

### `roleMiddleware(...allowedRoles)`
Enforces authorization guards based on the user's role:
* Admin resources should be chained with `roleMiddleware('admin')`.
* Standard protected user actions are accessible to `'customer'` and `'admin'` using `roleMiddleware('customer', 'admin')`.
