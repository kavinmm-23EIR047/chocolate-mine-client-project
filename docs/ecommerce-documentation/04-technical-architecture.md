# Document 4: Technical Architecture

This document provides a technical specification of the system architecture, component topology, authentication model, payment gateway verification, data pipelines, real-time WebSocket infrastructure, and hosting deployment model for **The Chocolate Mine**.

---

## 1. High-Level System Architecture

The application is built on a modern decoupled **MERN** architecture (MongoDB, Express.js, React, Node.js) with real-time WebSocket capabilities, cloud media hosting, and third-party API integrations.

```mermaid
graph TD
    ClientApp["Frontend Single Page App<br/>(React 19 + Vite + Tailwind CSS)<br/>Hosted on Vercel"]
    AdminStaffApp["Admin & Staff POS Portals<br/>(React SPA Dashboards)<br/>Hosted on Vercel"]
    
    BackendAPI["Backend REST API & Sockets Server<br/>(Node.js + Express 5 + Socket.IO)<br/>Hosted on Render"]
    
    MongoDatabase[("Primary Database<br/>MongoDB Atlas Cluster<br/>(Mongoose ODM)")]
    RedisCache[("Cache & Rate Limiter<br/>Upstash / Redis")]
    
    Razorpay["Razorpay Payment Gateway<br/>(API & HMAC Webhooks)"]
    Cloudinary["Cloudinary CDN<br/>(Media & Image Processing)"]
    Twilio["Twilio SMS API<br/>(Phone OTP Verification)"]
    Nodemailer["Nodemailer / SMTP<br/>(Email Notifications & PDF Invoices)"]
    FCM["Firebase Cloud Messaging<br/>(Browser Push Notifications)"]
    Apify["Apify Scraper Engine<br/>(Google Reviews Sync)"]

    ClientApp -->|HTTP/REST & WebSockets| BackendAPI
    AdminStaffApp -->|HTTP/REST & WebSockets| BackendAPI
    
    BackendAPI -->|Mongoose ODM| MongoDatabase
    BackendAPI -->|Redis Commands| RedisCache
    
    BackendAPI -->|Payment Verification| Razorpay
    BackendAPI -->|Image Uploads| Cloudinary
    BackendAPI -->|SMS Alerts| Twilio
    BackendAPI -->|Email & PDF Attachments| Nodemailer
    BackendAPI -->|Push Alerts| FCM
    BackendAPI -->|Web Scraping| Apify
```

---

## 2. Frontend Architecture

### Core Stack
- **Framework:** React 19 (`react`, `react-dom`) initialized with Vite (`vite`).
- **State Management:** Dual-layer state architecture:
  - **Global Application & Cart State:** Redux Toolkit (`@reduxjs/toolkit`, `react-redux`) via `cartSlice.js`.
  - **Authentication & UI Contexts:** React Context API (`AuthContext`, `ThemeContext`, `LocationContext`, `WishlistContext`).
  - **Server Data Caching:** `@tanstack/react-query` for asynchronous API state handling.
- **Routing:** `react-router-dom` v7 with route guard wrappers (`AdminRoute`, `StaffRoute`, `ProtectedRoute`, `GuestRoute`, `PhoneVerificationGate`).
- **Styling & UI Components:** Tailwind CSS v3, Framer Motion v12 (animations), Lucide React & React Icons.
- **3D Graphics & Visualiser:** Three.js (`three`), `@react-three/fiber`, `@react-three/drei` for real-time 3D cake rendering.
- **Maps & Location:** Leaflet (`leaflet`, `react-leaflet`) for interactive address pinning.

---

## 3. Backend Architecture

### Core Stack
- **Runtime & Framework:** Node.js 20+, Express.js 5 (`express`).
- **Real-Time Communication:** Socket.IO v4 (`socket.io`).
- **Security & Middleware:** Helmet (`helmet`), CORS (`cors`), Compression (`compression`), Cookie Parser (`cookie-parser`), Morgan logging (`morgan`).
- **Database Access:** Mongoose ODM v9 (`mongoose`) connected to MongoDB Atlas.
- **Task Scheduling:** Node Cron (`node-cron`) for automated Google Reviews sync.

---

## 4. Sequence Diagrams & Request Flows

### 4.1 Authentication Flow (JWT & OAuth2)

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as React SPA
    participant Backend as Express API
    participant DB as MongoDB Atlas
    participant OAuth as Google OAuth2

    alt Local Credentials Authentication
        Customer->>Frontend: Submit Email & Password
        Frontend->>Backend: POST /api/v1/auth/login
        Backend->>DB: Query User & Select +password
        DB-->>Backend: User Document
        Backend->>Backend: Verify bcrypt hash match
        Backend-->>Frontend: Set HTTP-Only JWT Cookie & return User Object
    else Google OAuth2 Flow
        Customer->>Frontend: Click "Sign in with Google"
        Frontend->>Backend: GET /api/v1/auth/google
        Backend->>OAuth: Redirect to Google Consent
        OAuth-->>Backend: Callback with Authorization Code
        Backend->>DB: Find or Create User by googleId
        Backend-->>Frontend: Redirect to /oauth-callback?token=JWT
    end
```

---

### 4.2 Order Placement & Razorpay Payment Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as React SPA
    participant Backend as Express API
    participant DB as MongoDB Atlas
    participant Razorpay as Razorpay API
    participant Socket as Socket.IO Engine

    Customer->>Frontend: Click "Pay & Place Order"
    Frontend->>Backend: POST /api/v1/orders (Create Pending Order)
    Backend->>DB: Save Order (Status: awaiting_payment)
    Backend->>Razorpay: Create Razorpay Order (Amount in Paise)
    Razorpay-->>Backend: Return razorpay_order_id
    Backend-->>Frontend: Return Order ID & Razorpay Details

    Frontend->>Razorpay: Open Razorpay Modal & Process Payment
    Razorpay-->>Frontend: Payment Success (payment_id, signature)

    Frontend->>Backend: POST /api/v1/payment/verify (Send Signature)
    Backend->>Backend: Verify HMAC-SHA256 Signature match
    
    alt Signature Valid
        Backend->>DB: Update Order (Status: confirmed, Payment: paid)
        Backend->>Socket: Emit 'new_order' to Admin & Staff Rooms
        Backend-->>Frontend: Return Success Confirmation
        Frontend->>Customer: Display Order Success Page
    else Signature Invalid
        Backend->>DB: Update Payment Status: failed
        Backend-->>Frontend: Return Signature Mismatch Error
    end
```

---

### 4.3 Deployment Architecture

```mermaid
graph LR
    subgraph Client Layer
        Browser["User Web Browser / Mobile Device"]
    end
    
    subgraph Vercel CDN Edge
        VercelFrontend["React Production Build<br/>Static Assets & Bundles<br/>(thechocolatemine.in)"]
    end
    
    subgraph Render Platform
        RenderNode["Express 5 Web Server Process<br/>HTTPS Port 5000<br/>Self-Ping Keep Alive Cron"]
    end
    
    subgraph Data & Cloud Services
        MongoAtlas[("MongoDB Atlas<br/>Multi-Region Cluster")]
        RedisCloud[("Redis / Upstash<br/>In-Memory Cache")]
        CloudinaryCDN["Cloudinary Media CDN"]
    end

    Browser -->|HTTPS GET Static| VercelFrontend
    Browser -->|HTTPS API & WSS| RenderNode
    RenderNode -->|Mongoose Driver| MongoAtlas
    RenderNode -->|ioredis| RedisCloud
    RenderNode -->|REST API| CloudinaryCDN
```

---

## 5. Third-Party Integration Matrix

| Integration | Transport Protocol | Authentication Method | Fallback Strategy |
| :--- | :--- | :--- | :--- |
| **Razorpay** | HTTPS REST / Webhooks | Key ID + Secret Key / Webhook Signature | Razorpay Webhook listener syncs orders if client disconnects before signature verification. |
| **Cloudinary** | HTTPS Multipart Upload | API Key + API Secret + Cloud Name | Client-side compression (`browser-image-compression`) limits upload sizes before transmission. |
| **Twilio** | HTTPS REST API | Account SID + Auth Token | Nodemailer Email OTP fallback if SMS delivery fails. |
| **Apify** | HTTPS REST API | Bearer API Token | Cached Google Reviews returned if Apify API rate limit or quota fails. |
