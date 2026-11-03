# Document 12: Deployment & Maintenance Guide

This document provides a guide for deploying, configuring, maintaining, and troubleshooting **The Chocolate Mine** e-commerce platform across development and production environments.

---

## 1. Environment & Infrastructure Requirements

- **Runtime Environments:** Node.js v20.x or higher, npm v10.x or higher.
- **Database Server:** MongoDB Atlas v7.0+ (Mongoose ODM).
- **Caching Server:** Upstash Redis or Redis v7.0+ instance.
- **Frontend Hosting:** Vercel Edge Network (`thechocolatemine.in`).
- **Backend Hosting:** Render Web Service (Linux Node Container).
- **Media CDN:** Cloudinary Cloud Account.

---

## 2. Environment Variables Configuration

### 2.1 Backend Environment Template (`backend/.env`)
```ini
# Server Environment
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://thechocolatemine.in
BACKEND_URL=https://chocolate-mine-api.onrender.com

# Database Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chocolatemine?retryWrites=true&w=majority

# Redis Configuration
REDIS_URL=redis://:<password>@<host>:<port>
UPSTASH_REDIS_REST_URL=https://<instance>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<token>

# JWT Authentication
JWT_SECRET=<strong-random-32-byte-secret>
JWT_EXPIRE=30d
COOKIE_EXPIRE=30

# Google OAuth2 Credentials
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=<razorpay-key-id>
RAZORPAY_KEY_SECRET=<razorpay-key-secret>
RAZORPAY_WEBHOOK_SECRET=<razorpay-webhook-secret>

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# Notification Credentials
TWILIO_ACCOUNT_SID=<twilio-account-sid>
TWILIO_AUTH_TOKEN=<twilio-auth-token>
TWILIO_PHONE_NUMBER=<twilio-phone-number>

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<store-email@gmail.com>
SMTP_PASS=<google-app-password>

TELEGRAM_BOT_TOKEN=<telegram-bot-token>
TELEGRAM_CHAT_ID=<telegram-channel-id>
```

---

### 2.2 Frontend Environment Template (`frontend/.env`)
```ini
VITE_API_URL=https://chocolate-mine-api.onrender.com/api/v1
VITE_SOCKET_URL=https://chocolate-mine-api.onrender.com
VITE_RAZORPAY_KEY_ID=<razorpay-key-id>
VITE_FIREBASE_API_KEY=<firebase-api-key>
VITE_FIREBASE_PROJECT_ID=<firebase-project-id>
```

---

## 3. Local Setup & Startup Instructions

```bash
# 1. Clone Repository
git clone https://github.com/kavinmm-23EIR047/chocolate-mine-client-project.git
cd chocolate-mine-client-project

# 2. Install Backend Dependencies
cd backend
npm install

# 3. Install Frontend Dependencies
cd ../frontend
npm install

# 4. Start Backend Server (Development Mode)
cd ../backend
npm start

# 5. Start Frontend Vite Dev Server (in separate terminal)
cd ../frontend
npm run dev
```

---

## 4. Production Hosting Configuration

### 4.1 Frontend Single-Page Rewrite Configuration (`frontend/vercel.json`)
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 5. Routine Maintenance & Troubleshooting

| Task / Problem | Solution / Action | Frequency |
| :--- | :--- | :--- |
| **MongoDB Atlas Backups** | Enable automated daily Atlas snapshots with 30-day retention. | Daily Automated |
| **Google Reviews Sync** | Verify `googleReviewsSyncJob.js` execution logs in backend console. | Weekly |
| **Render Cold Start Mitigation** | Verify keep-alive self-ping logs in server console. | Continuous |
| **CORS Access Denied** | Add new domain origin to `allowedOrigins` array in `backend/server.js`. | As Needed |
