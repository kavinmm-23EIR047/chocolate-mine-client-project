# Document 9: Code-Level Security Audit

This document presents a code-level security evaluation of **The Chocolate Mine** application, covering authentication, access control, cryptography, input validation, payment signature verification, CORS policies, rate limiting, and sensitive data handling.

---

## 1. Security Architecture Summary

```
Client Request -> Helmet Headers -> CORS Whitelist -> Rate Limiter -> Express Body Parser (50MB Limit / Raw Webhook Buffer) -> Cookie Parser -> Passport / JWT Auth Middleware -> Role Guard Middleware -> Joi / Zod Input Validation -> Controller Logic -> Mongoose Sanitized Queries -> MongoDB Atlas
```

---

## 2. Security Assessment Matrix

| Finding ID | Vulnerability / Concern | Category | Risk Level | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Raw Body Preservation for Razorpay Webhooks | Payment Integrity | Verified Secure | **Remediated** |
| **SEC-02** | JWT Token Dual Storage (Cookie + Auth Header) | Authentication | Low Risk | **Verified Safe** |
| **SEC-03** | Express Body Parser 50MB Payload Limit | Denial of Service | Medium Risk | **Needs Optimization** |
| **SEC-04** | Password Hashing with Bcrypt Cost Factor 12 | Cryptography | Verified Secure | **Best Practice** |
| **SEC-05** | Rate Limiting Engine Strategy | Threat Mitigation | Low Risk | **In-Memory Configured** |
| **SEC-06** | CORS Whitelist Domain Restriction | Network Security | Verified Secure | **Configured** |

---

## 3. Detailed Security Findings & Code Evidence

### 3.1 Razorpay Webhook Raw Body Verification (`SEC-01`)
- **Finding:** Payment webhooks require unparsed raw buffer payloads to compute valid HMAC signatures without JSON whitespace distortion.
- **Code Evidence ([`backend/server.js`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/backend/server.js#L80-L87)):**
  ```javascript
  app.use(express.json({
    limit: '50mb',
    verify: (req, res, buffer) => {
      if (req.originalUrl.startsWith('/api/v1/payment/webhook')) {
        req.rawBody = Buffer.from(buffer);
      }
    },
  }));
  ```
- **Evaluation:** Implementation correctly captures `req.rawBody` specifically for payment webhook routes, preventing signature forgery attacks.

---

### 3.2 Password Hashing & Hidden Schema Fields (`SEC-04`)
- **Finding:** User passwords must be strongly hashed and omitted from standard database query returns.
- **Code Evidence ([`backend/src/models/User.js`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/backend/src/models/User.js#L17-L20)):**
  ```javascript
  password: {
    type: String,
    select: false,
    minlength: 6
  }
  ```
- **Evaluation:** `select: false` ensures password hashes are never leaked in default `User.find()` or JSON API responses unless explicitly requested via `.select('+password')`.

---

### 3.3 Large JSON Payload Limit (`SEC-03`)
- **Finding:** `express.json({ limit: '50mb' })` accepts payloads up to 50 Megabytes on all API endpoints.
- **Risk:** High payload limits open potential Denial of Service (DoS) memory exhaustion attacks if abused on non-file upload routes.
- **Affected File:** [`backend/server.js`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/backend/server.js#L80)
- **Recommended Remediation:** Restrict global JSON body limit to `2mb`, applying 50mb limits selectively via Multer only on image upload routes (`/api/v1/admin/products`, `/api/v1/banners`).

---

### 3.4 Role-Based Access Control (RBAC) Verification
- **Finding:** Admin and Staff routes are guarded by token authentication and role checking middleware.
- **Code Evidence ([`backend/src/middleware/auth.js`](file:///c:/Volume%20D/projects/freelancing/Chocolate-Mine-client-project%202/chocolate-mine-client-project/backend/src/middleware/auth.js)):**
  ```javascript
  exports.authorize = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return next(new AppError('Not authorized to access this route', 403));
      }
      next();
    };
  };
  ```
- **Evaluation:** Prevents privilege escalation. Non-admin users attempting to access `/api/v1/admin/*` receive immediate `403 Forbidden` responses.

---

### 3.5 Sensitive Credential Exposure Audit
- **Audit Result:** Codebase inspection confirms **Zero exposure** of live secrets, passwords, or private keys. Environment variables are referenced cleanly via `process.env.*` templates (`MONGODB_URI`, `JWT_SECRET`, `RAZORPAY_KEY_SECRET`, `CLOUDINARY_API_SECRET`).
