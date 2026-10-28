# Document 5: Complete Folder & File Structure

This document details the file structure of **The Chocolate Mine** repository, detailing file locations, architectural responsibilities, key dependencies, active usage status, and identifying administrative or utility scripts.

---

## 1. Project Directory Overview

```
chocolate-mine-client-project/
├── backend/                  # Express 5 REST API & WebSocket Server
├── frontend/                 # React 19 + Vite Single Page Application
├── docs/                     # Technical System & API Documentation
│   ├── authentication-flow.md
│   └── ecommerce-documentation/ # Full Client Documentation Package
├── postman/                  # Postman API Collection Export
├── public/                   # Static Shared Assets & Favicons
├── fix.js                    # Utility maintenance script
├── fix_shop.js               # Shop category data patch script
├── product.json              # Initial seed product dataset
├── setup-and-import.bat      # Windows batch setup script
└── package.json              # Root metadata configuration
```

---

## 2. Backend Application Structure (`backend/`)

| File / Folder | Purpose & Architectural Responsibility | Active Usage | Dependencies |
| :--- | :--- | :--- | :--- |
| `backend/server.js` | Express application bootstrap, CORS whitelist, Helmet middleware, route mounting, HTTP server initialization, Socket.io binding, and Render keep-alive ping. | **Active Core** | `express`, `socket.io`, `helmet`, `cors`, `dotenv` |
| `backend/package.json` | Backend dependency manifest and runtime startup scripts (`npm start`). | **Active Core** | Node.js CommonJS packages |
| `backend/.env` | Environment variable template containing MongoDB URI, JWT secrets, Razorpay keys, Cloudinary credentials, and Twilio tokens. | **Active Core** | `dotenv` |

### 2.1 Backend Source Modules (`backend/src/`)

```
backend/src/
├── config/           # Database, Passport, Cloudinary & Redis configurations
├── controllers/      # Business logic handlers for all API routes (22 controllers)
├── jobs/             # Scheduled background cron tasks (Google Reviews sync)
├── middleware/       # JWT Auth, Role checking, Error Handling, File Uploads, Rate Limiting
├── models/           # Mongoose ODM Schemas & pre-save hooks (18 models)
├── routes/           # Express router endpoints (21 route modules)
├── services/         # Third-party integrations (Cloudinary, Razorpay, Twilio, Nodemailer, Apify)
├── sockets/          # Socket.io real-time event handlers
└── utils/            # Logging, phone formatting, AppError helpers
```

#### Detailed Backend Controllers (`backend/src/controllers/`)
- `authController.js`: Handles user login, registration, Google OAuth, password reset, OTP verification.
- `orderController.js`: Online customer order placement, order tracking, status updates, invoice triggering.
- `paymentController.js`: Razorpay order creation, payment signature verification, webhook processing.
- `productController.js`: Product creation, updating, variant pricing, MongoDB Atlas search queries.
- `customCakeController.js`: 3D Custom Cake themes, flavors, tier pricing calculation.
- `staffController.js`: Staff POS in-shop order creation, KOT printing, staff dashboard analytics.
- `adminController.js` & `adminBulkController.js`: Admin user management, store settings, bulk stock toggles.
- `googleReviewsController.js`: Google place reviews scraping & client presentation.
- `analyticsController.js`: Store revenue reports, order volume charts, category performance statistics.

#### Detailed Backend Models (`backend/src/models/`)
- `User.js`: User accounts, addresses, roles (`user`, `staff`, `admin`), FCM tokens, wishlists.
- `Product.js`: Product schema, multi-category tags, multi-weight price matrix, discount coupons, ratings.
- `Order.js`: Online order schema, line items, SKU generator pre-save hook, Razorpay payment IDs, delivery OTP.
- `InShopOrder.js`: Staff POS order schema, counter payment method (`CASH`, `UPI`), KOT sequence number.
- `CustomCakeTheme.js`, `CustomCakeFlavor.js`, `CustomCakeColor.js`, `CustomCakeThemeColor.js`: Custom 3D cake builder configuration tables.
- `Category.js`, `Addon.js`, `Occasion.js`, `Banner.js`: Store catalog taxonomies and marketing banners.
- `Payment.js`: Transaction logs, payment status history, refund records.
- `GoogleReview.js`: Apify scraped Google Business reviews.
- `Notification.js`, `AdminFcmToken.js`: Notification records and administrator push tokens.
- `OtpSession.js`: Temporary OTP storage with expiry indexes.

---

## 3. Frontend Application Structure (`frontend/`)

| File / Folder | Purpose & Architectural Responsibility | Active Usage | Dependencies |
| :--- | :--- | :--- | :--- |
| `frontend/index.html` | HTML5 root entry point, Google Fonts, meta tags, and app mounting target (`#root`). | **Active Core** | Browser DOM |
| `frontend/src/App.jsx` | Main React component mounting top-level context providers, Toast container, global Socket listeners, and React Router routes. | **Active Core** | `react-router-dom`, `react-hot-toast` |
| `frontend/src/main.jsx` | React DOM root rendering application inside `React.StrictMode`. | **Active Core** | `react-dom` |
| `frontend/vite.config.js` | Vite bundler configuration with `@vitejs/plugin-react`. | **Active Core** | `vite` |
| `frontend/tailwind.config.js` | Custom Tailwind CSS theme colors, fonts, shadows, and responsive breakpoints. | **Active Core** | `tailwindcss` |

### 3.1 Frontend Component Taxonomy (`frontend/src/`)

```
frontend/src/
├── components/       # Reusable UI components (Navbar, Footer, Banners, MapSelector, Confetti)
├── context/          # React Contexts (AuthContext, CartContext, FilterContext, ThemeContext)
├── custom-cakes/     # 3D Custom Cake Studio (CustomCake.jsx, 3D Canvas visualizer)
├── hooks/            # Custom React hooks (useCart, useAuth, useDebounce)
├── pages/            # Page view components (Home, Shop, Cart, Checkout, Login, Admin, Staff)
├── product/          # Product details page and variant selection components
├── redux/            # Redux Toolkit store and cartSlice.js
├── routes/           # Protected, Admin, and Staff Route Guards
├── services/         # Axios API clients (authService, productService, orderService)
└── sockets/          # Socket.io client manager (socketManager.js)
```

---

## 4. Utility, Maintenance & Obsolete Files Analysis

| File Name | Location | Purpose & Function | Status / Recommendation |
| :--- | :--- | :--- | :--- |
| `fix.js` | Root | Patch script for fixing product category fields. | **Utility / One-time Maintenance Script** |
| `fix_shop.js` | Root | Data cleanup script for shop page categories. | **Utility / One-time Maintenance Script** |
| `setup-and-import.bat` | Root | Batch file for local database seeding on Windows. | **Dev Setup Helper** |
| `backend/add_hooks.js` | `backend/` | One-off script for appending Excel sync hooks. | **Obsolete Maintenance Script** |
| `backend/clear_orders.js` | `backend/` | Script for clearing test orders during development. | **Dev Cleanup Utility** |
| `backend/test-upstash.js` | `backend/` | Connection test for Upstash Redis. | **Test / Diagnostic Script** |
