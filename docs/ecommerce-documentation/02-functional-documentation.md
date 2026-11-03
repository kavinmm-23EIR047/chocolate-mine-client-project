# Document 2: Complete Functional Documentation

This document provides a comprehensive specification of all verified customer-facing, staff operational, and administrative capabilities within **The Chocolate Mine** e-commerce platform.

---

## 1. Feature Classification Matrix Overview

| Module | Feature Name | User Role | Status |
| :--- | :--- | :--- | :--- |
| **Storefront** | Interactive Hero Banner & Featured Collections | Guest / Customer | Implemented and verified |
| **Catalog** | Dynamic Product Listing, Filtering & Sorting | Guest / Customer | Implemented and verified |
| **Custom Cake** | 3D Interactive Custom Cake Studio | Guest / Customer | Implemented and verified |
| **Product** | Variant Selection, Addon Picker & Cake Message | Guest / Customer | Implemented and verified |
| **Cart** | Client & Persistent Cart Management | Guest / Customer | Implemented and verified |
| **Checkout** | Multi-step Address & Delivery Slot Selection | Customer | Implemented and verified |
| **Payment** | Razorpay Online Payment & Webhook Handling | Customer | Implemented and verified |
| **Order Tracking** | Live Order Tracking & WebSocket Updates | Customer | Implemented and verified |
| **Auth** | User Registration, JWT & Google OAuth2 | Guest / Customer | Implemented and verified |
| **Auth** | Phone Number OTP Verification (Twilio/Email) | Guest / Customer | Implemented and verified |
| **User Account** | Address Book, Order History & Profile | Customer | Implemented and verified |
| **User Account** | Product Reviews & Rating Submissions | Customer | Implemented and verified |
| **Admin** | Product & Multi-Variant Price Manager | Store Admin | Implemented and verified |
| **Admin** | Category, Occasion & Addon Management | Store Admin | Implemented and verified |
| **Admin** | Order Management & Staff Assignment | Store Admin | Implemented and verified |
| **Admin** | Custom Cake Theme & Flavor Administration | Store Admin | Implemented and verified |
| **Admin** | Banner & Promotion Management | Store Admin | Implemented and verified |
| **Admin** | Google Reviews Apify Scraper Sync | Store Admin | Implemented and verified |
| **Admin** | Sales Analytics & Export (Excel/PDF) | Store Admin | Implemented and verified |
| **Staff POS** | In-Shop Counter Ordering & KOT Ticket Printing | Staff Member | Implemented and verified |

---

## 2. Customer-Side Functional Specifications

### 2.1 Interactive Hero Banner & Featured Collections
1. **Feature Name:** Hero Banner Carousel & Category Highlights
2. **Purpose:** Display seasonal promotions, featured cake collections, and marketing banners to incoming site visitors.
3. **User Role:** Guest User, Customer.
4. **How it Works:** The frontend fetches dynamic active banners from `/api/v1/banners` and renders an animated slider with action call-to-action buttons.
5. **Main Steps:**
   - User visits home page (`/`).
   - `BannerCarousel.jsx` requests dynamic banners from backend.
   - Banners display image overlays, title headlines, subheadings, and link destinations (`/shop`, `/custom-cake`).
6. **Related Frontend Pages:** [`frontend/src/pages/Home.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/pages/Home.jsx), [`frontend/src/components/BannerCarousel.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/components/BannerCarousel.jsx)
7. **Related Backend APIs:** `GET /api/v1/banners`
8. **Related Database Models:** `Banner` collection
9. **Validation Rules:** Banner must have `active: true`.
10. **Business Rules:** Banners ordered by `order` priority index; automatically filtered for non-expired promotions.
11. **Error Handling:** Fallbacks to default fallback images if dynamic banner fetch fails.
12. **Current Implementation Status:** **Implemented and verified**

---

### 2.2 Dynamic Product Listing, Search, Filtering & Sorting
1. **Feature Name:** Product Catalog, Multi-Filter & Search Engine
2. **Purpose:** Allow customers to browse products by category, occasion, price range, sub-category, and keyword search.
3. **User Role:** Guest User, Customer.
4. **How it Works:** Performs client-side and MongoDB Atlas Search queries (`/api/v1/products`, `/api/v1/search`) with filter parameters (price min/max, category, occasion, rating, sort order).
5. **Main Steps:**
   - User navigates to `/shop` or opens the header search bar.
   - User types a query or selects category badges (e.g. "Chocolate Cakes", "Cupcakes").
   - Results update dynamically with pagination and skeleton loaders.
6. **Related Frontend Pages:** [`frontend/src/pages/Shop.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/pages/Shop.jsx), [`frontend/src/pages/OccasionProducts.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/pages/OccasionProducts.jsx), [`frontend/src/components/search/SearchOverlay.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/components/search/SearchOverlay.jsx)
7. **Related Backend APIs:** `GET /api/v1/products`, `GET /api/v1/search`, `GET /api/v1/categories`, `GET /api/v1/occasions`
8. **Related Database Models:** `Product`, `Category`, `Occasion` collections
9. **Validation Rules:** Price range inputs must be numeric; search strings are sanitized.
10. **Business Rules:** Inactive products (`isActive: false`) are hidden from public responses.
11. **Error Handling:** Displays empty state view ("No products found matching your search") when no items match criteria.
12. **Current Implementation Status:** **Implemented and verified**

---

### 2.3 3D Interactive Custom Cake Studio
1. **Feature Name:** 3D Custom Cake Studio & Customization Engine
2. **Purpose:** Provide an interactive 3D studio where customers configure custom cake tiers, sponge flavors, cream colors, frosting themes, eggless options, and custom cake inscriptions.
3. **User Role:** Guest User, Customer.
4. **How it Works:** Renders a dynamic 3D cake mesh using `@react-three/fiber` and `@react-three/drei`, reacting in real time to tier changes, color pickers, texture selections, and custom text inputs.
5. **Main Steps:**
   - Customer accesses `/custom-cake`.
   - Customer chooses Tiers (1-Tier, 2-Tier, 3-Tier), Weight (0.5kg, 1kg, 2kg+), Sponge Type, Cream Color, Frosting Style, and Eggless preference.
   - Customer inputs message on cake and optional photo reference URL.
   - Dynamic cost calculation recalculates final custom cake price.
   - Customer adds configured cake to cart.
6. **Related Frontend Pages:** [`frontend/src/custom-cakes/CustomCake.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/custom-cakes/CustomCake.jsx)
7. **Related Backend APIs:** `GET /api/v1/custom-cakes/flavours`, `POST /api/v1/custom-cakes/price-calculate`
8. **Related Database Models:** `CustomCakeTheme`, `CustomCakeFlavor`, `CustomCakeColor`, `CustomCakeThemeColor`
9. **Validation Rules:** Required options (Flavors, Weight, Tiers) must be selected before cart addition.
10. **Business Rules:** Base price calculated based on weight tier multiplier + premium flavor add-on prices.
11. **Error Handling:** 3D Canvas fallback to 2D image preview if WebGL is unsupported.
12. **Current Implementation Status:** **Implemented and verified**

---

### 2.4 Product Detail, Variant Pricing & Addon Selection
1. **Feature Name:** Product Detail View & Addon Attachments
2. **Purpose:** Show detailed specifications, image galleries, weight variant dropdowns, eggless toggles, message inputs, and party add-ons (candles, toppers).
3. **User Role:** Guest User, Customer.
4. **How it Works:** Fetches product details by slug (`/api/v1/products/slug/:slug`) and allowed addons (`/api/v1/addons`). Dynamically updates price based on selected weight/flavor matrix.
5. **Main Steps:**
   - Customer selects a product card.
   - Page renders image gallery with zoom, rating summary, short & detailed description.
   - Customer selects weight variant (e.g. 0.5 kg @ ₹450, 1 kg @ ₹850).
   - Customer checks optional party addons (e.g. Happy Birthday Topper +₹50).
   - Customer clicks "Add to Cart" or "Buy Now".
6. **Related Frontend Pages:** [`frontend/src/product/ProductDetails.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/product/ProductDetails.jsx)
7. **Related Backend APIs:** `GET /api/v1/products/slug/:slug`, `GET /api/v1/addons`
8. **Related Database Models:** `Product`, `Addon` collections
9. **Validation Rules:** Weight choice mandatory if product `hasVariants` or `hasWeights` is true.
10. **Business Rules:** Addon line items attached directly inside product cart item schema.
11. **Error Handling:** Shows toast notification if out-of-stock item is selected.
12. **Current Implementation Status:** **Implemented and verified**

---

### 2.5 Cart & Persistent Local / Sync Cart Management
1. **Feature Name:** Cart Drawer & Guest-to-User Cart Synchronization
2. **Purpose:** Manage shopping cart state, quantity updates, addon totals, price breakdowns, and persist cart items across sessions.
3. **User Role:** Guest User, Customer.
4. **How it Works:** Managed via `CartContext.jsx` and Redux `cartSlice.js`. Guest carts saved in `localStorage`; upon login, guest cart merges with server database cart (`/api/v1/cart`).
5. **Main Steps:**
   - User adds products or custom cakes to cart.
   - Cart drawer opens sliding from right with item summary, individual prices, addons, and total.
   - User updates quantities or deletes items.
   - Subtotal, delivery estimate, and final grand total recalculate dynamically.
6. **Related Frontend Pages:** [`frontend/src/pages/Cart.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/pages/Cart.jsx), [`frontend/src/context/CartContext.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/context/CartContext.jsx)
7. **Related Backend APIs:** `GET /api/v1/cart`, `POST /api/v1/cart`, `PUT /api/v1/cart/:itemId`, `DELETE /api/v1/cart/:itemId`
8. **Related Database Models:** `User` (cart subdocument / session)
9. **Validation Rules:** Quantity must be an integer > 0.
10. **Business Rules:** Out-of-stock items flag warning before checkout.
11. **Error Handling:** Automatic sync retry on connection re-establishment.
12. **Current Implementation Status:** **Implemented and verified**

---

### 2.6 Multi-Step Checkout, Location Picker & Delivery Slots
1. **Feature Name:** Multi-Step Checkout & Address Management
2. **Purpose:** Collect delivery address details, pin location on map, select delivery date & time slot, and validate coupon codes.
3. **User Role:** Customer.
4. **How it Works:** Customer selects from saved addresses or adds new address using `MapSelector.jsx` (Leaflet Map). Customer selects delivery slot (e.g. Morning 9 AM - 12 PM, Evening 4 PM - 8 PM, or In-Shop Pickup).
5. **Main Steps:**
   - Customer proceeds from Cart to `/checkout`.
   - Step 1: Address selection / GPS pin selection on Leaflet Map.
   - Step 2: Delivery Date picker + Delivery Slot selection.
   - Step 3: Coupon Code entry & subtotal discount calculation (`/api/v1/coupon/validate`).
   - Step 4: Payment method selection (Razorpay Online vs COD/Pickup).
6. **Related Frontend Pages:** [`frontend/src/pages/Checkout.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/pages/Checkout.jsx), [`frontend/src/components/MapSelector.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/components/MapSelector.jsx)
7. **Related Backend APIs:** `POST /api/v1/orders`, `POST /api/v1/coupon/validate`, `GET /api/v1/users/addresses`
8. **Related Database Models:** `Order`, `User`, `Category` collections
9. **Validation Rules:** Address phone, street, pincode mandatory; delivery date cannot be in the past.
10. **Business Rules:** Minimum advance baking lead time applied for custom multi-tier cakes.
11. **Error Handling:** Form validation errors highlighted in red using React Hook Form + Zod.
12. **Current Implementation Status:** **Implemented and verified**

---

### 2.7 Razorpay Payment Processing & Verification
1. **Feature Name:** Razorpay Gateway Checkout & Signature Verification
2. **Purpose:** Process online payments securely via UPI, Credit/Debit Cards, NetBanking, and Wallets using Razorpay.
3. **User Role:** Customer.
4. **How it Works:** Backend initializes Razorpay Order ID (`/api/v1/payment/create-order`). Frontend opens standard Razorpay Checkout Modal. Upon payment success, Razorpay payload (payment_id, order_id, signature) sent to `/api/v1/payment/verify` for server-side HMAC-SHA256 verification.
5. **Main Steps:**
   - Customer clicks "Pay Now" on Checkout.
   - Backend returns `razorpayOrderId` and amount in paise.
   - Razorpay Modal opens on client screen.
   - Customer completes payment on Razorpay.
   - Client sends signature to server; server verifies HMAC signature; order status transitions to `confirmed` and payment status to `paid`.
   - Customer redirected to `/order-success`.
6. **Related Frontend Pages:** [`frontend/src/pages/Checkout.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/pages/Checkout.jsx), [`frontend/src/pages/OrderSuccess.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/pages/OrderSuccess.jsx)
7. **Related Backend APIs:** `POST /api/v1/payment/create-order`, `POST /api/v1/payment/verify`, `POST /api/v1/payment/webhook`
8. **Related Database Models:** `Order`, `Payment` collections
9. **Validation Rules:** HMAC-SHA256 signature must match Razorpay secret key.
10. **Business Rules:** Webhook listener serves as fallback to prevent unpaid order confirmation.
11. **Error Handling:** Failed payment attempts recorded with reason; user prompted to retry without re-entering cart items.
12. **Current Implementation Status:** **Implemented and verified**

---

### 2.8 Real-time Order Tracking Timeline
1. **Feature Name:** Live Order Status Timeline & WebSocket Engine
2. **Purpose:** Provide live order status visibility (Confirmed -> Kitchen Preparing -> Out for Delivery -> Delivered).
3. **User Role:** Customer, Guest (via Tracking Code).
4. **How it Works:** Customer visits `/track/:orderId` or searches by tracking code. Socket.IO connection subscribes to order updates, updating the timeline dynamically without page refreshes.
5. **Main Steps:**
   - Customer views live status bar with step indicators.
   - Store staff updates status on staff dashboard.
   - Socket event `order_status_updated` fires; UI animates to next milestone.
6. **Related Frontend Pages:** [`frontend/src/pages/OrderTracking.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/pages/OrderTracking.jsx)
7. **Related Backend APIs:** `GET /api/v1/orders/track/:trackingCode`, WebSocket `join_order_room`
8. **Related Database Models:** `Order` collection
9. **Validation Rules:** Order number/tracking code must follow `TCM-YYYY-XXXX` format.
10. **Business Rules:** Public tracking hides sensitive user payment fields.
11. **Error Handling:** Shows "Order Not Found" toast if tracking code is invalid.
12. **Current Implementation Status:** **Implemented and verified**

---

## 3. Admin & Staff Functional Specifications

### 3.1 Admin Product & Multi-Variant Price Manager
1. **Feature Name:** Product CRUD & Variant Pricing Table Editor
2. **Purpose:** Full administrative control over catalog items, images, categories, variant prices, stock status, and feature flags.
3. **User Role:** Store Administrator.
4. **How it Works:** Form interface allowing image uploads via Cloudinary (`upload.js`), dynamic weight-price matrix rows, featured/bestseller toggles, and Joi validation.
5. **Main Steps:**
   - Admin navigates to `/admin/products`.
   - Admin views table of all products with stock switches.
   - Admin clicks "Create Product" or "Edit".
   - Admin uploads main image + gallery, fills multi-weight prices, and saves.
6. **Related Frontend Pages:** [`frontend/src/pages/admin/AdminProducts.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/pages/admin/AdminProducts.jsx), [`frontend/src/pages/admin/ProductForm.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/pages/admin/ProductForm.jsx)
7. **Related Backend APIs:** `GET /api/v1/admin/products`, `POST /api/v1/admin/products`, `PUT /api/v1/admin/products/:id`, `DELETE /api/v1/admin/products/:id`
8. **Related Database Models:** `Product`, `Category` collections
9. **Validation Rules:** Product name, price/weight array, description mandatory.
10. **Business Rules:** Slug generated automatically via `slugify`.
11. **Error Handling:** Multer file type filter returns 400 for non-image uploads.
12. **Current Implementation Status:** **Implemented and verified**

---

### 3.2 Staff POS In-Shop Counter Ordering & KOT Printing
1. **Feature Name:** Staff POS Dashboard & Instant KOT Generator
2. **Purpose:** Enable counter staff to take walk-in orders, process Cash/UPI payments, print Kitchen Order Tickets (KOT), and dispatch kitchen alerts.
3. **User Role:** Staff Member, Store Administrator.
4. **How it Works:** Staff interface (`StaffDashboard.jsx`) optimized for quick item selection, custom weight inputs, walk-in customer details, and single-click browser window printing of thermal KOT tickets.
5. **Main Steps:**
   - Staff opens `/staff/dashboard`.
   - Staff selects products, enters customer phone/name, selects Cash/UPI.
   - Click "Create In-Shop Order".
   - System registers `InShopOrder` document and triggers browser print layout for KOT ticket.
6. **Related Frontend Pages:** [`frontend/src/pages/staff/StaffDashboard.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/pages/staff/StaffDashboard.jsx)
7. **Related Backend APIs:** `POST /api/v1/staff/orders/in-shop`, `GET /api/v1/staff/orders`, `PATCH /api/v1/staff/orders/:id/status`
8. **Related Database Models:** `InShopOrder`, `Order`, `User` collections
9. **Validation Rules:** In-shop payment method must be Cash or UPI; total must be non-zero.
10. **Business Rules:** Assigns dedicated sequential `kotNumber` per order.
11. **Error Handling:** Prevents duplicate submission via UI loading lock.
12. **Current Implementation Status:** **Implemented and verified**

---

### 3.3 Google Reviews Scraper & Admin Sync Engine
1. **Feature Name:** Apify Scraper Google Reviews Integration
2. **Purpose:** Automated scraping and display of verified Google Business reviews on the website frontend.
3. **User Role:** Store Administrator (Management), Guest/Customer (Viewing).
4. **How it Works:** Node cron job (`googleReviewsSyncJob.js`) periodically triggers Apify Google Maps Scraper actor (`apifyReviewsService.js`), syncs 5-star reviews to `GoogleReview` collection, and serves them on the homepage carousel.
5. **Main Steps:**
   - Job executes on schedule or Admin clicks "Sync Google Reviews" in `/admin/google-reviews`.
   - Backend calls Apify REST API to fetch recent place reviews.
   - New reviews inserted; existing reviews updated.
6. **Related Frontend Pages:** [`frontend/src/pages/admin/AdminGoogleReviews.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/pages/admin/AdminGoogleReviews.jsx), [`frontend/src/components/google-reviews/GoogleReviewsCarousel.jsx`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/frontend/src/components/google-reviews/GoogleReviewsCarousel.jsx)
7. **Related Backend APIs:** `GET /api/v1/google-reviews`, `POST /api/v1/admin/google-reviews/sync`
8. **Related Database Models:** `GoogleReview` collection
9. **Validation Rules:** Reviews filtered for minimum star rating threshold (>= 4 stars).
10. **Business Rules:** Prevents duplicate Google Review IDs using MongoDB unique index on `reviewId`.
11. **Error Handling:** Graceful fallback if Apify quota is exhausted or API key is absent.
12. **Current Implementation Status:** **Implemented and verified**
