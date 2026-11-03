# Document 3: Website User & Operational Manual

Welcome to **The Chocolate Mine User Manual**. This guide provides clear, step-by-step instructions for website customers, store operational staff, and store administrators.

---

## 1. Customer User Guide

### 1.1 Navigating & Browsing the Website
1. Open your web browser and navigate to [https://thechocolatemine.in/](https://thechocolatemine.in/).
2. Use the top navigation bar to access primary sections:
   - **Home:** Featured seasonal banners, trending collections, 3D cake teaser, and customer reviews.
   - **Shop:** Complete product catalog with filter controls.
   - **Custom Cake:** Interactive 3D Custom Cake Studio.
   - **Occasions:** Curated collections for Birthdays, Anniversaries, Weddings, and Festivals.
   - **Stores:** Physical store addresses and Google Maps directions.

---

### 1.2 Searching & Filtering Products
1. Click the **Search Icon** (magnifying glass) in the top navigation header.
2. Type any keyword (e.g. *"Truffle"*, *"Red Velvet"*, *"Eggless"*). Results render instantly.
3. On the **Shop Page** (`/shop`), filter products using the left side panel:
   - **Category Filter:** Select Chocolate Cakes, Cupcakes, Brownies, or Hampers.
   - **Price Slider:** Adjust minimum and maximum budget thresholds.
   - **Dietary Filter:** Check *Eggless Only* or *Sugar-Free*.
   - **Sort By:** Sort items by *Price: Low to High*, *Price: High to Low*, or *Highest Rated*.

---

### 1.3 Configuring Products & Custom 3D Cakes

#### Standard Products:
1. Click any product card to open its **Details Page**.
2. Select your desired weight (e.g., *0.5 kg*, *1.0 kg*, *2.0 kg*). Notice how the price updates automatically.
3. Choose optional party add-ons (e.g., *Birthday Candle Set*, *Gold Acrylic Topper*).
4. Enter a custom message to be piped in chocolate icing on the cake (e.g. *"Happy 25th Birthday Ananya!"*).

#### Custom 3D Cake Studio (`/custom-cake`):
1. Navigate to **Custom Cake** in the navigation bar.
2. Use the interactive 3D visualizer controls:
   - **Tiers:** Choose 1-Tier, 2-Tier, or 3-Tier structure.
   - **Sponge Flavor:** Select Belgian Chocolate, Dark Truffle, Vanilla Bean, etc.
   - **Cream Color:** Choose primary frosting color using the color palette.
   - **Eggless Option:** Toggle *Yes* for 100% pure vegetarian preparation.
3. Observe the live 3D cake model updating as you make selections.
4. Click **Add Custom Cake to Cart**.

---

### 1.4 Managing Cart & Checkout

1. Click the **Shopping Bag** icon at the top right to open your Cart.
2. Adjust item quantities using the **+** and **-** buttons, or click the Trash icon to remove an item.
3. Click **Proceed to Checkout**.
4. **Log In or Register:** If you are not logged in, enter your mobile number/email to receive an OTP or click *Sign in with Google*.
5. **Address Selection:** Choose a saved delivery address or enter a new address. You can pin your exact building location on the interactive map.
6. **Delivery Schedule:** Select your preferred Delivery Date and Time Slot (e.g. *Evening 4:00 PM – 8:00 PM*).
7. **Coupon Code:** Enter a promotional discount code (e.g. `WELCOME10`) and click **Apply**.

---

### 1.5 Payment Processing & Order Confirmation

1. Choose your payment method:
   - **Online Payment (Razorpay):** Supports UPI (GPay, PhonePe, Paytm), Credit Cards, Debit Cards, and NetBanking.
2. Click **Pay & Place Order**.
3. A secure Razorpay modal window will appear. Complete your payment authorization.
4. Upon successful authorization, you will be redirected to the **Order Success** page displaying your unique Order Number (e.g. `TCM-2026-0142`).
5. An instant order confirmation will be sent to your WhatsApp and Email.

---

### 1.6 Tracking Orders & Managing Profile

1. Visit `/track` or click **Track Order** from the account menu.
2. Enter your `TCM-YYYY-XXXX` Order Number.
3. View the live progress bar:
   - `Order Placed` -> `Confirmed` -> `Kitchen Baking` -> `Out for Delivery` -> `Delivered`.
4. Manage your saved addresses, view past invoices, and rate delivered items in your **Customer Dashboard** (`/account/dashboard`).

---

## 2. Store Staff & Counter POS Manual

### 2.1 Staff Login & Dashboard Access
1. Navigate to `/login` and sign in using your designated Staff credentials.
2. You will be automatically redirected to the **Staff POS Control Center** (`/staff/dashboard`).

### 2.2 Processing Walk-In / Counter Orders
1. On the Staff Dashboard, select **Create In-Shop Order**.
2. Select items ordered by the walk-in customer from the rapid-select grid.
3. Specify customer Name, Phone Number, and Payment Method (*Cash* or *Counter UPI*).
4. Click **Submit In-Shop Order**.
5. The system will automatically launch the **Kitchen Order Ticket (KOT)** print preview. Click **Print** to send the ticket to the kitchen printer.

### 2.3 Managing Kitchen & Delivery Pipeline
1. View active orders organized into columns: `New Orders`, `Preparing`, `Ready for Dispatch`, `Out for Delivery`.
2. When a cake is baked, click **Mark as Preparing** or **Ready**.
3. When handing the order to a delivery partner, click **Dispatch Order**.

---

## 3. Admin Control Panel Guide

### 3.1 Managing Product Catalog (`/admin/products`)
1. Access `/admin/products`.
2. To add a product, click **+ Add Product**.
3. Upload product images (Cloudinary will optimize them automatically).
4. Fill in Product Name, Categories, Occasions, Description, and Multi-Weight Pricing Table.
5. Click **Save Product**.

### 3.2 Order Management & Reports (`/admin/orders`)
1. View all customer online orders and store counter sales.
2. Filter by status (`Paid`, `Pending`, `Delivered`).
3. Click any order row to view detailed item customisations, delivery address, payment transaction ID, and download PDF tax invoices.
4. Click **Export Orders** to download an Excel sheet (`.xlsx`) for accounting.

### 3.3 Managing Coupons & Promotions (`/admin/banners`)
1. Manage store promotion banners and dynamic discount coupons.
2. Set discount type (*Percentage* or *Flat Rupee Amount*), expiry dates, and minimum order values.
