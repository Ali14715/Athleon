# 🏆 ATHLEON - E-Commerce Platform

Full-stack e-commerce application for sports and athletic products built with Laravel 12, React 18, and Inertia.js. Features include JWT authentication, Midtrans payment integration, Biteship shipping, real-time package tracking, and comprehensive admin dashboard.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Usage](#-usage)
- [License](#-license)

## ✨ Features

### Customer Features
- 🔐 JWT Authentication with OTP password reset
- 🛒 Shopping cart and buy-now checkout
- 💳 Midtrans Snap payment integration
- 📦 Real-time package tracking (18+ couriers via BinderByte API)
- ⭐ Product ratings and reviews
- ❤️ Wishlist functionality
- 📍 Multiple shipping addresses with area-based rates
- 🔔 Real-time notifications
- 🌙 Dark mode support
- 🔑 Change password functionality

### Admin Features
- 📊 Advanced analytics dashboard with charts
- 📈 Revenue trends and growth tracking
- 📑 Export reports (PDF/Excel) for orders, products, and revenue
- 👥 User management
- 🏷️ Product and category management
- 📦 Order management with status tracking
- 🎨 Banner management for homepage
- 🚚 Shipping integration with Biteship

## 🛠️ Tech Stack

**Backend:**
- Laravel 12
- PHP 8.2+
- JWT Authentication (php-open-source-saver/jwt-auth)
- MySQL 8
- Midtrans PHP SDK
- DomPDF & Maatwebsite Excel for exports

**Frontend:**
- React 18 with TypeScript
- Inertia.js for SSR
- Tailwind CSS & shadcn/ui components
- Recharts for analytics visualization
- React Query for state management
- Vite for build tooling

**External Services:**
- Midtrans Snap (Payment Gateway)
- Biteship API (Shipping Rates)
- BinderByte API (Package Tracking)

## 📦 Requirements

- PHP 8.2+
- Composer 2
- Node.js 18+ and npm/pnpm
- MySQL 8 / MariaDB 10.6+
- Laragon/XAMPP/Docker (optional)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd athleon-full
```

### 2. Install Dependencies
```bash
# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install
```

### 3. Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Generate JWT secret
php artisan jwt:secret
```

### 4. Database Setup
```bash
# Create database (MySQL)
mysql -u root -p
CREATE DATABASE athleon;
exit;

# Run migrations and seeders
php artisan migrate --seed
```

### 5. Storage Link
```bash
# Create symbolic link for public storage
php artisan storage:link
```

### 6. Start Development Servers
```bash
# Terminal 1: Start Laravel server
php artisan serve

# Terminal 2: Start Vite dev server
npm run dev
```

The application will be available at `http://127.0.0.1:8000`

## 🔐 Environment Variables

Configure the following variables in your `.env` file:

### Core Application
```env
APP_NAME=ATHLEON
APP_ENV=local
APP_KEY=         # Generated via php artisan key:generate
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

VITE_APP_URL=http://127.0.0.1:8000
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

### Database
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=athleon
DB_USERNAME=root
DB_PASSWORD=
```

### JWT Authentication
```env
JWT_SECRET=       # Generated via php artisan jwt:secret
JWT_TTL=60        # Token lifetime in minutes
```

### Midtrans Payment (Sandbox)
```env
MIDTRANS_SERVER_KEY=<your-sandbox-server-key>
MIDTRANS_CLIENT_KEY=<your-sandbox-client-key>
MIDTRANS_IS_PRODUCTION=false
VITE_MIDTRANS_CLIENT_KEY=${MIDTRANS_CLIENT_KEY}
VITE_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js
```

Get keys from: https://dashboard.sandbox.midtrans.com/

### Biteship Shipping (Sandbox)
```env
BITESHIP_API_KEY=<your-sandbox-api-key>
BITESHIP_BASE_URL=https://api.biteship.com/v1
BITESHIP_ORIGIN_AREA_ID=IDBA1234          # Your store area ID
BITESHIP_ORIGIN_POSTAL_CODE=40115         # Your store postal code
```

Get API key from: https://biteship.com/

### BinderByte Tracking
```env
BINDERBYTE_API_KEY=<your-api-key>
BINDERBYTE_BASE_URL=https://api.binderbyte.com/v1
```

Get API key from: https://binderbyte.com/

### Mail Configuration (Optional)
```env
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@athleon.com"
MAIL_FROM_NAME="${APP_NAME}"
```

## 📁 Project Structure

```
athleon-full/
├── app/
│   ├── Exports/              # Excel/PDF export classes
│   │   ├── OrdersExport.php
│   │   ├── ProductsExport.php
│   │   └── RevenueExport.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/        # Admin controllers
│   │   │   │   ├── DashboardController.php
│   │   │   │   ├── ExportController.php
│   │   │   │   ├── ProdukController.php
│   │   │   │   └── ...
│   │   │   ├── Customer/     # Customer controllers
│   │   │   │   ├── KeranjangController.php
│   │   │   │   ├── PesananController.php
│   │   │   │   └── ...
│   │   │   ├── AuthController.php
│   │   │   ├── CheckoutController.php
│   │   │   ├── PaymentController.php
│   │   │   └── TrackingController.php
│   │   └── Middleware/
│   │       ├── RoleMiddleware.php
│   │       └── JwtMiddleware.php
│   ├── Models/               # Eloquent models
│   │   ├── User.php
│   │   ├── Produk.php
│   │   ├── Pesanan.php
│   │   └── ...
│   └── Services/
│       └── BiteshipService.php
├── database/
│   ├── migrations/           # Database migrations
│   └── seeders/              # Database seeders
├── resources/
│   ├── js/
│   │   ├── components/       # React components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── Layout.tsx
│   │   │   └── AdminLayout.tsx
│   │   ├── pages/            # Inertia pages
│   │   │   ├── admin/        # Admin pages
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Orders.tsx
│   │   │   │   └── Products.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── Catalog.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── ChangePassword.tsx
│   │   │   └── ...
│   │   ├── context/          # React context
│   │   │   ├── NotificationContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   └── lib/
│   │       └── api.ts        # Axios instance
│   ├── views/
│   │   └── exports/          # PDF templates
│   │       ├── orders-pdf.blade.php
│   │       ├── products-pdf.blade.php
│   │       └── revenue-pdf.blade.php
│   └── css/
│       └── app.css
├── routes/
│   ├── api.php               # API routes
│   └── web.php               # Inertia routes
├── public/
│   └── storage/              # Public storage (symlink)
├── storage/
│   └── app/
│       └── public/           # File uploads
├── .env                      # Environment variables
├── composer.json             # PHP dependencies
├── package.json              # Node dependencies
└── vite.config.js            # Vite configuration
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (returns JWT token)
- `POST /api/auth/logout` - Logout
- `POST /api/auth/me` - Get authenticated user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/send-otp` - Send OTP for password reset
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/reset-password-otp` - Reset password with OTP

### Products (Public)
- `GET /api/produk` - Get all products
- `GET /api/produk/{id}` - Get product detail
- `GET /api/kategori` - Get all categories
- `GET /api/banners` - Get homepage banners

### Customer (JWT Protected)
- `GET /api/customer/keranjang` - Get cart items
- `POST /api/customer/keranjang` - Add to cart
- `POST /api/customer/buy-now` - Direct checkout
- `GET /api/customer/pesanan` - Get orders
- `POST /api/customer/pesanan/{id}/cancel` - Cancel order
- `POST /api/customer/pesanan/{id}/rate` - Rate order
- `GET /api/customer/alamat` - Get addresses
- `POST /api/customer/alamat` - Add address
- `POST /api/customer/checkout/process` - Process checkout
- `POST /api/customer/payment/check-status` - Check payment status

### Admin (JWT Protected, Role: admin)
- `GET /api/admin/dashboard` - Get dashboard stats
- `GET /api/admin/produk` - Manage products
- `GET /api/admin/pesanan` - Manage orders
- `GET /api/admin/users` - Manage users
- `GET /api/admin/export/orders/pdf` - Export orders to PDF
- `GET /api/admin/export/orders/excel` - Export orders to Excel
- `GET /api/admin/export/products/pdf` - Export products to PDF
- `GET /api/admin/export/products/excel` - Export products to Excel
- `GET /api/admin/export/revenue/pdf` - Export revenue report to PDF
- `GET /api/admin/export/revenue/excel` - Export revenue report to Excel

### Tracking (Public)
- `GET /api/tracking?waybill={resi}&courier={code}` - Track package
- `GET /api/tracking/couriers` - Get supported couriers

## 🎯 Usage

### Default Admin Account
After running seeders, use these credentials:
```
Email: admin@athleon.com
Password: password
```

### Test Payment (Midtrans Sandbox)
Use these test cards:
- **Success**: Card `4811 1111 1111 1114` | CVV `123` | Exp `01/25`
- **Failed**: Card `4911 1111 1111 1113` | CVV `123` | Exp `01/25`

### Package Tracking
Supported couriers (via BinderByte):
- JNE, J&T Express, SiCepat, TIKI, Pos Indonesia
- Anteraja, Wahana, Ninja Xpress, ID Express
- SAP Express, Lion Parcel, Paxel, RPX
- JET Express, DSE, First Logistics, Lazada
- Shopee Express, REX

## 📸 Screenshots

### Customer Features
- **Home Page**: Product catalog with banners and dark mode
- **Product Detail**: Variants, ratings, wishlist, buy now
- **Checkout**: Multiple addresses, shipping rates, Midtrans payment
- **Orders**: Status tracking, package tracking, rating system

### Admin Features
- **Dashboard**: Revenue trends, sales charts, top products, export reports
- **Products**: CRUD operations, variants, image upload
- **Orders**: Status management, shipping tracking
- **Users**: Customer management

## 🔧 Development

### Run Migrations
```bash
php artisan migrate
```

### Run Seeders
```bash
php artisan db:seed
```

### Clear Cache
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Build for Production
```bash
npm run build
```

## 📄 License

This project is open-sourced software licensed under the MIT license.

```
BITESHIP_API_KEY=<sandbox-api-key>
BITESHIP_BASE_URL=https://api.biteship.com/v1
BITESHIP_ORIGIN_AREA_ID=IDBA1234
BITESHIP_ORIGIN_POSTAL_CODE=40115
BITESHIP_ORIGIN_ADDRESS=Gudang Athleon, Bandung
BITESHIP_COURIERS=jne,jnt,sicepat
BITESHIP_DEFAULT_WEIGHT=1000        # grams per item
BITESHIP_ITEM_LENGTH=20             # centimeters
BITESHIP_ITEM_WIDTH=15
BITESHIP_ITEM_HEIGHT=10
```

Set `BITESHIP_ORIGIN_*` to match the warehouse location provided in your Biteship dashboard. Courier codes accept comma-separated lists (e.g., `jne,jnt,sicepat,anteraja`).

## Shipping API Usage

- `POST /api/customer/shipping/rates`
	- Body: `{ "destination_postal_code": "40115", "destination_address": "Bandung", "couriers": "jne,jnt" }`
	- Uses the authenticated customer cart to build the item payload and returns Biteship rates.
- `POST /api/customer/shipping/track`
	- Body: `{ "waybill_id": "TEST123", "courier_code": "jne" }`
	- Proxies the request to `POST /trackings/check` on Biteship.

`CheckoutController@process` and `Customer\PesananController@store` now expect the selected courier details:

```
{
	"shipping_cost": 18000,
	"shipping_courier_code": "jne",
	"shipping_courier_service": "jne-REG",
	"tracking_number": null
}
```

Those values are stored on `pesanan` (`ongkir`, `kurir_code`, `kurir_service`, `tracking_number`) and included in the payment total so Midtrans reflects the grand total.

## Useful Commands

- `php artisan test` – run the backend test suite
- `php artisan migrate:fresh --seed` – reset schema with seed data
- `npm run build` – production Vite build for the React client

## Troubleshooting

- `401 Unauthorized` on API routes: ensure the JWT token is stored in `localStorage` and the shared Axios client (`resources/js/lib/api.ts`) points to `VITE_API_BASE_URL`.
- Midtrans token errors: double-check `MIDTRANS_IS_PRODUCTION` and the Snap script URL match the environment you are targeting.
- Empty shipping rates: confirm the destination data matches a valid Indonesian postal code and that the Biteship API key has access to the requested couriers.
