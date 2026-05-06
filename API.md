# E-commerce API Documentation

Base URL (local): `http://localhost:3000`

## Response Format

All successful responses use:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": {}
}
```

All error responses use:

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Authentication

Use JWT access token in header:

`Authorization: Bearer <accessToken>`

Roles used in API:

- `admin`
- `seller`
- `buyer`

---

## Health

### GET `/health`

- Auth: Public
- Description: Health check endpoint

Response:

```json
{
  "ok": true
}
```

---

## Auth APIs (`/auth`)

### POST `/auth/register`

- Auth: Public
- Description: Register buyer or seller

Body:

```json
{
  "email": "buyer@example.com",
  "password": "Password123!",
  "role": "buyer"
}
```

Notes:

- `role` allowed: `buyer`, `seller`
- `admin` is not publicly creatable via this endpoint

### POST `/auth/login`

- Auth: Public
- Description: Login and receive access token

Body:

```json
{
  "email": "buyer@example.com",
  "password": "Password123!"
}
```

### GET `/auth/me`

- Auth: Any logged-in user
- Description: Get current user profile

---

## Category APIs (`/categories`)

### GET `/categories`

- Auth: Public
- Description: List all categories

### POST `/categories`

- Auth: `admin`
- Description: Create new category

Body:

```json
{
  "name": "Clothes"
}
```

Validation:

- `name`: string, trimmed, min 1, max 100

---

## Product APIs (`/products`)

## Public Catalog

### GET `/products`

- Auth: Public
- Description: List products with pagination and optional category filter

Query params:

- `page` (optional, default `1`)
- `limit` (optional, default `20`, max `100`)
- `categoryId` (optional, 24-char hex ObjectId)

Example:

- `/products?page=1&limit=20`
- `/products?categoryId=680000000000000000000001&page=1&limit=20`

### GET `/products/category/:categoryId`

- Auth: Public
- Description: List products by category id

### GET `/products/:id`

- Auth: Public
- Description: Get product details by product id

## Seller Management

### GET `/products/mine`

- Auth: `seller`
- Description: Seller's own products (supports `page`, `limit`, `categoryId` query shape)

### POST `/products`

- Auth: `seller`
- Description: Create product

Body:

```json
{
  "title": "Tee",
  "categoryId": "680000000000000000000001",
  "price": 199,
  "quantity": 10
}
```

### PATCH `/products/:id`

- Auth: `seller`
- Description: Update own product

Body (at least one field):

```json
{
  "title": "New Tee",
  "categoryId": "680000000000000000000001",
  "price": 249,
  "quantity": 20
}
```

### DELETE `/products/:id`

- Auth: `seller`
- Description: Soft delete own product

---

## Cart APIs (`/cart`)

All cart APIs require buyer role.

### GET `/cart`

- Auth: `buyer`
- Description: Get buyer cart

### POST `/cart/items`

- Auth: `buyer`
- Description: Add product to cart

Body:

```json
{
  "productId": "680000000000000000000010",
  "quantity": 2
}
```

### PATCH `/cart/items/:productId`

- Auth: `buyer`
- Description: Update quantity for cart item

Body:

```json
{
  "quantity": 3
}
```

### DELETE `/cart/items/:productId`

- Auth: `buyer`
- Description: Remove product from cart

---

## Order APIs (`/orders`)

Order model is one document per product line.

Order statuses:

- `CONFIRMED`
- `REJECT`
- `CANCELLED`
- `DELIVERED`

### POST `/orders/checkout`

- Auth: `buyer`
- Description: Create orders from cart and clear cart
- Optional header: `Idempotency-Key: <string>`

### GET `/orders`

- Auth: `buyer`
- Description: List buyer orders with pagination

Query params:

- `page` (default `1`)
- `limit` (default `20`, max `100`)

### GET `/orders/:orderId`

- Auth: `buyer`
- Description: Get specific buyer order details

### POST `/orders/:orderId/cancel`

- Auth: `buyer`
- Description: Cancel order if current state allows transition
- Behavior:
  - Returns `409` if order exists but transition is invalid
  - Restores inventory only when transition succeeds

### GET `/orders/seller`

- Auth: `seller`
- Description: List seller orders with pagination

Query params:

- `page` (default `1`)
- `limit` (default `20`, max `100`)

### POST `/orders/:orderId/reject`

- Auth: `seller`
- Description: Reject order in valid state
- Behavior:
  - Returns `409` for invalid state transition
  - Restores inventory only on successful transition

### POST `/orders/:orderId/delivered`

- Auth: `seller`
- Description: Mark order as delivered in valid state
- Behavior:
  - Returns `409` for invalid state transition

---

## Common Validation Rules

- IDs used by protected resources are Mongo ObjectIds (24-char hex strings)
- Pagination query:
  - `page >= 1`
  - `1 <= limit <= 100`

---

## Quick Role Matrix

- Public:
  - `GET /health`
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /categories`
  - `GET /products`, `GET /products/:id`, `GET /products/category/:categoryId`
- Admin:
  - `POST /categories`
- Seller:
  - `GET /products/mine`, `POST /products`, `PATCH /products/:id`, `DELETE /products/:id`
  - `GET /orders/seller`, `POST /orders/:orderId/reject`, `POST /orders/:orderId/delivered`
- Buyer:
  - `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`
  - `POST /orders/checkout`, `GET /orders`, `GET /orders/:orderId`, `POST /orders/:orderId/cancel`
