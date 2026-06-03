# MongoDB Data Import & Setup Guide

## Quick Start: Import Your 51 Cake Products

### Step 1: Move the Fixed Data File
```bash
# The corrected JSON file is already at:
# d:\properties.products-fixed.json

# Copy it to the backend folder for the import script:
# D:\client projects Ak webflair technologies\Chocolate-Mine-client-project\backend\
```

### Step 2: Setup Categories
```bash
cd backend
node scripts/setupCategories.js
```

This will create:
- ✅ Bento Cakes
- ✅ Vanilla Cakes
- ✅ Chocolate Cakes
- ✅ Red Velvet Cakes
- ✅ Chocolates (future use)
- ✅ Candles (future use)
- ✅ Flowers (future use)

### Step 3: Import Products
```bash
cd backend
node scripts/importProducts.js
```

This will:
1. Connect to MongoDB
2. Clear existing products
3. Import all 51 products with **correct category & cakeType formats**
4. Show summary by category

### Expected Output
```
✅ Successfully imported 51 products!

📊 Products by Category:
   bento-cakes: 10 products
   vanilla-cakes: 15 products
   chocolate-cakes: 15 products
   red-velvet-cakes: 11 products
```

## Frontend Features Added

### Shop Page (`frontend/src/pages/Shop.jsx`)
✅ **New Cake Type Filter** with buttons:
- Bento Cakes
- Vanilla Cakes
- Chocolate Cakes
- Red Velvet Cakes

✅ **Existing Filters** (still working):
- Categories
- Occasions
- Minimum Rating
- Price Range
- Sort By (Newest, Price, Rating)
- Search

### Home Page
✅ Category circles now show: Bento, Vanilla, Chocolate, Red Velvet

### All Frontend Pages
✅ Support cake-specific filtering via:
- `cakeType` query parameter
- RTK Query integration

## Data Format Fixed

### Before (❌ Data Issues)
```json
{
  "category": "bento cakes",    // spaces, not dashes
  "cakeType": "bento"           // incomplete
}
```

### After (✅ Correct Format)
```json
{
  "category": "bento-cakes",    // dashes, lowercase
  "cakeType": "bento-cakes"     // matches category
}
```

## Running the Full Stack

### Terminal 1: Backend
```bash
cd backend
$env:PORT='5001'; node server.js
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

### Check Status
- Backend health: `http://localhost:5001/health`
- Frontend dev: `http://localhost:5173`
- Test filters: Go to Shop page → See cake type filters

## Verification Checklist

After import, verify:

- [ ] 51 products in MongoDB
- [ ] Products grouped by cake type
- [ ] Shop page shows cake type filter buttons
- [ ] Filter buttons respond to clicks
- [ ] Products filter correctly by cake type
- [ ] Home page shows category circles
- [ ] Price filter still works
- [ ] Occasion filter still works
- [ ] Search works with product names

## Troubleshooting

### Import Script Not Running
```bash
# Ensure you're in the backend directory
cd D:\client projects Ak webflair technologies\Chocolate-Mine-client-project\backend

# Check if .env file exists with MONGODB_URI
cat .env | grep MONGODB

# Run with verbose output
node scripts/importProducts.js
```

### Categories Not Showing
```bash
# Re-run category setup
node scripts/setupCategories.js

# Verify in MongoDB:
# Collections → categories → should see 7 documents
```

### Products Not Filtering
1. Check browser console for API errors
2. Verify backend is running on port 5001
3. Check RTK Query with Redux DevTools
4. Review Shop.jsx console logs

## Next Steps

1. **Run import scripts** (Step 1-3 above)
2. **Restart backend server** (new port 5001)
3. **Refresh frontend** (http://localhost:5173)
4. **Test filters** in Shop page
5. **Verify products** display correctly

---

**All 51 products ready to display with full cake filtering! 🎂**
