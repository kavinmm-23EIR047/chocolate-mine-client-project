@echo off
REM Setup and import script for Chocolate Mine products

echo.
echo ========================================
echo Chocolate Mine: Product Setup & Import
echo ========================================
echo.

REM Change to backend directory
cd backend

REM Check if node_modules exist
if not exist node_modules (
  echo Installing dependencies...
  call npm install
  echo.
)

REM Check if .env exists
if not exist .env (
  echo ❌ ERROR: .env file not found!
  echo Please create .env with MONGODB_URI
  pause
  exit /b 1
)

REM Check if properties.products-fixed.json exists
if not exist properties.products-fixed.json (
  echo ❌ ERROR: properties.products-fixed.json not found!
  echo Should be at: backend\properties.products-fixed.json
  pause
  exit /b 1
)

echo ✅ Prerequisites check passed!
echo.

REM Step 1: Setup categories
echo Step 1: Setting up categories...
node scripts/setupCategories.js
if errorlevel 1 (
  echo ❌ Category setup failed!
  pause
  exit /b 1
)

echo.
echo ========================================
echo.

REM Step 2: Import products
echo Step 2: Importing 51 cake products...
node scripts/importProducts.js
if errorlevel 1 (
  echo ❌ Product import failed!
  pause
  exit /b 1
)

echo.
echo ========================================
echo ✅ Setup complete!
echo ========================================
echo.
echo Next steps:
echo   1. Start backend: node server.js  (or set PORT=5001 first)
echo   2. Start frontend: cd ../frontend && npm run dev
echo   3. Open http://localhost:5173
echo   4. Go to Shop page and test cake type filters
echo.
pause
