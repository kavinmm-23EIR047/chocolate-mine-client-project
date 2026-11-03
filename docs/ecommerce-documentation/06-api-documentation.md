# Document 6: Complete API Documentation

This document provides a technical reference for all RESTful API endpoints and WebSocket channels implemented in **The Chocolate Mine** backend server.

---

## 1. Authentication & User Management APIs

### 1.1 Customer Registration
- **HTTP Method:** `POST`
- **Endpoint:** `/api/v1/auth/register`
- **Purpose:** Create a new customer user account.
- **Authentication:** Public
- **Authorization:** None
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "phone": "+919876543210"
  }
  ```
- **Validation Rules:** Email must be valid; password minimum 6 characters; phone must contain country code or valid 10 digits.
- **Response Structure (201 Created):**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "_id": "66e1f0a2b3c4d5e6f7a8b9c0",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user",
      "phoneVerified": false
    }
  }
  ```
- **Error Status Codes:** `400 Bad Request` (Email already exists), `422 Unprocessable Entity` (Validation failure).

---

### 1.2 User Login
- **HTTP Method:** `POST`
- **Endpoint:** `/api/v1/auth/login`
- **Purpose:** Authenticate user credentials and issue JWT session token.
- **Authentication:** Public
- **Request Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response Structure (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "_id": "66e1f0a2b3c4d5e6f7a8b9c0",
      "name": "Jane Doe",
      "role": "user"
    }
  }
  ```
- **Security Considerations:** Sets HTTP-Only secure cookie `token` in header alongside JSON token payload.

---

### 1.3 Phone OTP Verification Request & Verification
- **HTTP Method:** `POST`
- **Endpoints:** `/api/v1/auth/send-phone-otp`, `/api/v1/auth/verify-phone-otp`
- **Purpose:** Send and verify 6-digit OTP code to user's mobile number via Twilio SMS or Nodemailer.
- **Request Body (Verify):**
  ```json
  {
    "phone": "+919876543210",
    "otp": "482910"
  }
  ```
- **Response Structure (200 OK):**
  ```json
  {
    "success": true,
    "message": "Phone number verified successfully"
  }
  ```

---

## 2. Product Catalog & Search APIs

### 2.1 Fetch Products (Paginated & Filtered)
- **HTTP Method:** `GET`
- **Endpoint:** `/api/v1/products`
- **Purpose:** Retrieve active products matching category, occasion, price range, and sort parameters.
- **Authentication:** Public
- **Query Parameters:** `category`, `subCategory`, `occasion`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`
- **Response Structure (200 OK):**
  ```json
  {
    "success": true,
    "count": 12,
    "total": 48,
    "page": 1,
    "pages": 4,
    "data": [
      {
        "_id": "66e1f100a1b2c3d4e5f6a7b8",
        "name": "Belgian Chocolate Truffle Cake",
        "slug": "belgian-chocolate-truffle-cake",
        "category": ["Chocolate Cakes"],
        "hasVariants": true,
        "weightPrices": [
          { "weight": "0.5 kg", "price": 550 },
          { "weight": "1 kg", "price": 980 }
        ],
        "image": "https://res.cloudinary.com/chocolatemine/image/upload/v1/truffle.jpg",
        "ratingsAverage": 4.9,
        "ratingsCount": 24
      }
    ]
  }
  ```

---

### 2.2 MongoDB Atlas Product Search
- **HTTP Method:** `GET`
- **Endpoint:** `/api/v1/search`
- **Purpose:** High-performance autocomplete fuzzy search across product titles, descriptions, and categories.
- **Query Parameter:** `q=truffle`
- **Response Structure (200 OK):**
  ```json
  {
    "success": true,
    "results": [
      {
        "_id": "66e1f100a1b2c3d4e5f6a7b8",
        "name": "Belgian Chocolate Truffle Cake",
        "slug": "belgian-chocolate-truffle-cake",
        "price": 550,
        "image": "https://res.cloudinary.com/chocolatemine/image/upload/v1/truffle.jpg"
      }
    ]
  }
  ```

---

## 3. Cart & Order APIs

### 3.1 Create Customer Order
- **HTTP Method:** `POST`
- **Endpoint:** `/api/v1/orders`
- **Purpose:** Initialize online customer order and create Razorpay payment instance.
- **Authentication:** Required (`Bearer JWT` or Cookie)
- **Request Body:**
  ```json
  {
    "items": [
      {
        "productId": "66e1f100a1b2c3d4e5f6a7b8",
        "name": "Belgian Chocolate Truffle Cake",
        "qty": 1,
        "price": 550,
        "selectedWeight": "0.5 kg",
        "cakeMessage": "Happy Birthday Sam!"
      }
    ],
    "address": {
      "fullName": "Jane Doe",
      "phone": "+919876543210",
      "houseNo": "42-B",
      "street": "Race Course Road",
      "city": "Coimbatore",
      "pincode": "641018"
    },
    "deliveryDate": "2026-09-15",
    "deliverySlot": "Evening (4PM-8PM)",
    "paymentMethod": "ONLINE"
  }
  ```
- **Response Structure (201 Created):**
  ```json
  {
    "success": true,
    "order": {
      "_id": "66e1f300c1d2e3f4a5b6c7d8",
      "orderNumber": "TCM-2026-0089",
      "trackingCode": "TCM-2026-0089",
      "total": 550,
      "orderStatus": "awaiting_payment",
      "paymentStatus": "pending"
    },
    "razorpayOrder": {
      "id": "order_P1q2R3s4T5u6V7",
      "amount": 55000,
      "currency": "INR"
    }
  }
  ```

---

### 3.2 Verify Razorpay Payment Signature
- **HTTP Method:** `POST`
- **Endpoint:** `/api/v1/payment/verify`
- **Purpose:** Validate Razorpay HMAC-SHA256 signature and update order status to `confirmed` and `paid`.
- **Request Body:**
  ```json
  {
    "razorpay_order_id": "order_P1q2R3s4T5u6V7",
    "razorpay_payment_id": "pay_Q8w9E0r1T2y3U4",
    "razorpay_signature": "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e"
  }
  ```
- **Response Structure (200 OK):**
  ```json
  {
    "success": true,
    "message": "Payment verified successfully",
    "orderId": "66e1f300c1d2e3f4a5b6c7d8"
  }
  ```

---

## 4. Staff POS APIs

### 4.1 Create Staff In-Shop Order
- **HTTP Method:** `POST`
- **Endpoint:** `/api/v1/staff/orders/in-shop`
- **Purpose:** Register counter sale, issue KOT ticket number, and log cash/UPI payment.
- **Authorization:** `staff` or `admin` role required.
- **Request Body:**
  ```json
  {
    "customerName": "Walk-in Customer",
    "customerPhone": "9876543210",
    "items": [
      {
        "productId": "66e1f100a1b2c3d4e5f6a7b8",
        "name": "Choco Lava Cake",
        "qty": 2,
        "price": 120
      }
    ],
    "paymentMethod": "CASH",
    "amountPaid": 240
  }
  ```
- **Response Structure (201 Created):**
  ```json
  {
    "success": true,
    "kotNumber": "KOT-0145",
    "orderNumber": "TCM-2026-0090",
    "message": "In-shop order created successfully"
  }
  ```

---

## 5. Real-Time Socket.IO Event Reference

| Event Name | Direction | Payload Structure | Purpose |
| :--- | :--- | :--- | :--- |
| `join_user_room` | Client -> Server | `{ "userId": "66e1f..." }` | Joins private socket room for personal order updates. |
| `join_admin_room` | Client -> Server | `{ "role": "admin" }` | Subscribes to store-wide new order alerts. |
| `new_order` | Server -> Staff/Admin | Order Document Payload | Dispatches sound alert and new order card on staff POS dashboard. |
| `order_status_updated` | Server -> Customer | `{ "orderId": "...", "status": "out_for_delivery" }` | Animates live order tracking timeline on customer screen. |
