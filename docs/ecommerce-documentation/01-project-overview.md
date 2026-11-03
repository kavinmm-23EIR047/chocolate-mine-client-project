# Document 1: Project Overview

**Project Name:** The Chocolate Mine E-Commerce Platform  
**Website URL:** [https://thechocolatemine.in/](https://thechocolatemine.in/)  
**Audit Date:** September 12, 2026  
**Auditor:** Senior Software Architect & Quality Engineering Team  

---

## 1. Project Purpose & Executive Summary

**The Chocolate Mine** is a full-stack e-commerce web platform engineered specifically for an artisan bakery, gourmet chocolate boutique, and custom cake design business based in Coimbatore, Tamil Nadu, India. 

The primary objective of the platform is to provide a seamless, highly engaging online storefront for customers to browse handcrafted chocolates, specialty cakes, desserts, and custom celebratory cakes, while equipping store management and operational staff with a unified admin portal and Point-of-Sale (POS) order processing engine.

The platform bridges online retail with physical store operations, supporting home delivery, in-shop pickup, live order status updates via WebSockets, multi-channel customer notifications (SMS, WhatsApp, Email, Push Notifications, Telegram), automated tax invoice generation, and custom 3D interactive cake visualizers.

---

## 2. Business Domain & Objectives

### Business Domain
- **Industry:** Retail E-Commerce, Artisan Confectionery & Gourmet Bakery.
- **Geographic Coverage:** Primary fulfillment in Coimbatore, Tamil Nadu with expandability for regional delivery.
- **Product Types:** Custom Cakes, Designer Cakes, Gourmet Chocolates, Cupcakes, Desserts, Celebration Addons (candles, toppers, flower bouquets, party accessories).

### Core Business Objectives
1. **Direct-to-Consumer (D2C) Sales Expansion:** Enable direct online ordering without third-party aggregator commissions.
2. **Interactive Cake Customization:** Provide customers with an online 3D cake visualizer where they can select tiers, sponge flavors, cream colors, frosting themes, eggless options, and custom inscriptions.
3. **Omnichannel Fulfillment & Staff POS:** Empower store staff to take in-shop counter orders, print Kitchen Order Tickets (KOT), update order stages, and dispatch delivery drivers.
4. **Automated Notification Matrix:** Keep customers updated at every stage of order processing (Payment Received -> Baking -> Out for Delivery -> Delivered) via WhatsApp, Telegram, Email, SMS, and Push Notifications.
5. **Real-time Synchronization:** Provide store managers with real-time analytics, inventory management, and socket-driven order alerts.

---

## 3. Target Customers & User Roles

The platform supports four distinct user personas across client and administrative workflows:

| User Role | Description & Primary Capabilities | Access Scope |
| :--- | :--- | :--- |
| **Guest User** | Unauthenticated site visitor. Can browse catalog, view products, apply filters, customize 3D cakes, and calculate cart totals. | Public routes only. Prompted to log in or register before checkout. |
| **Customer** | Authenticated online buyer. Can save shipping addresses, place online orders via Razorpay, track live delivery status, view order history, submit reviews, and manage profile/wishlist. | Public + Protected User Dashboard (`/account/*`, `/checkout`). |
| **Staff Member** | In-store operational staff / Kitchen operator. Can view live orders, print KOT tickets, generate customer invoices, accept counter/in-shop cash & UPI orders, and update kitchen statuses. | Dedicated Staff Portal (`/staff/*`). |
| **Store Administrator** | Business owner / Administrator. Complete system control over products, categories, occasions, addons, staff management, user accounts, discount coupons, sales analytics, and Google Review sync. | Full Access Admin Portal (`/admin/*`). |

---

## 4. Product Categories & Catalog Structure

The Chocolate Mine categorizes products across multiple dimensions:

1. **Custom & Designer Cakes:** Tiers (1, 2, or 3 Tiers), Sponge Flavors, Cream Colors, Frosting Themes, Photo Cakes, Eggless & Sugar-free choices.
2. **Occasion Collections:** Birthday, Anniversary, Valentine's Day, Weddings, Corporate Events, Festive Specials.
3. **Gourmet Chocolates & Confectionery:** Handcrafted Truffles, Chocolate Bars, Gift Boxes, Assorted Hampers.
4. **Addons & Party Accessories:** Party Poppers, Birthday Candles, Foil Balloons, Custom Greeting Cards, Knife Sets.

---

## 5. Scope of Implemented Features

The project source code implements and integrates the following major subsystem capabilities:

- **Customer Storefront:**
  - Modern React single-page application with responsive layouts.
  - Interactive 3D Custom Cake visualizer powered by Three.js & `@react-three/fiber`.
  - Dynamic product search, category filtering, price ranges, and multi-location support.
  - Cart state persistence with guest-to-user cart synchronization.
  - Phone Number OTP verification via Twilio / Nodemailer.
  - Razorpay payment gateway integration with webhooks and signature verification.
  - Interactive delivery location picker powered by Leaflet & OpenStreetMap.
  - Real-time order tracking timeline with WebSocket updates.

- **Admin & Operations Management:**
  - Role-Based Access Control (RBAC) separating Admin, Staff, and Customer privileges.
  - Dynamic Product & Variant Management with multi-weight pricing tables.
  - Real-time Order Control Center with status updates and driver assignment.
  - In-Shop POS Order Creation engine supporting custom line items and instant KOT print triggers.
  - PDF Invoice and Custom Cake Specification Sheet generation using `pdfkit` and `jspdf`.
  - Customer analytics dashboard tracking sales revenue, order volumes, and popular categories.
  - Google Reviews sync job powered by Apify web scraper integration.

---

## 6. Major System Integrations

| Integration Service | Vendor / Protocol | Functional Purpose |
| :--- | :--- | :--- |
| **Payment Gateway** | Razorpay API & Webhooks | Online payment creation, signature verification, automatic refund triggers. |
| **Cloud Storage** | Cloudinary API | Dynamic image upload, automated image transformation, thumbnail generation. |
| **SMS Service** | Twilio Messaging API | Mobile phone OTP verification, order status SMS alerts. |
| **Email Service** | Nodemailer (SMTP / Gmail) | Order confirmation emails, PDF invoice attachments, password reset tokens. |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Browser foreground & background order status push notifications. |
| **Real-time Sockets** | Socket.IO (WebSocket) | Instant notification dispatch for new orders to staff and live status updates to customers. |
| **Maps & Geolocation** | Leaflet / OpenStreetMap | Delivery address pin selection and latitude/longitude lookup. |
| **Scraper & Reviews** | Apify API | Automated extraction and synchronization of Google Place reviews. |
| **Caching Layer** | Redis / Upstash Redis | Fast rate-limiting and query caching. |

---

## 7. System Boundaries & Constraints

1. **Host Environment:** Frontend hosted on Vercel Edge Network (`thechocolatemine.in`), Backend REST service hosted on Render (`Node.js 20+`), Database hosted on MongoDB Atlas Cluster.
2. **Fulfillment Boundaries:** Delivery calculation logic is tailored to store range (Coimbatore region).
3. **Database Constraints:** Relies on Mongoose ODM over MongoDB Atlas Document Store.

---

## 8. Assumptions & Limitations of the Audit

- **Audit Scope:** The audit is strictly based on the source code located in the workspace repository.
- **Live Infrastructure:** Live database credentials, secret keys, and third-party production accounts (Razorpay Live, Cloudinary Production, Twilio API) are masked for security and assessed based on implementation correctness in code.
- **Non-Destructive Testing:** Build checks and static analysis were run non-destructively without modifying production records.
