# Sequence Diagram

## Recent Updates (Nov 2025)

### Key Flow Improvements
1. **API Response Standardization**: All endpoints now return `{ status_code, message, data }` format
2. **JWT Auto-Refresh**: Automatic token refresh when expired, with request queuing
3. **Checkout Flow**: Added area_id fallback with 3-pattern Biteship search
4. **Variant Handling**: Cart items load variants dynamically via `loadVariants()` method
5. **Stock Reduction**: Automatic stock decrease when order status becomes "Dikemas"
6. **Payment Callback**: Clean callback URL without query parameters for security
7. **RadioGroup Fix**: Shipping methods use compound keys (courier-service) for unique selection

---

## 0. JWT Token Refresh Flow (NEW)

```mermaid
sequenceDiagram
    actor Client
    participant Interceptor as Axios Interceptor
    participant API
    participant AuthController
    participant JWT
    
    Note over Client,JWT: Auto Token Refresh Flow
    Client->>Interceptor: API Request with expired token
    Interceptor->>API: Request with Bearer token
    API-->>Interceptor: 401 "Token expired"
    
    alt Token Expired (not invalid)
        Interceptor->>Interceptor: Set isRefreshing = true
        Interceptor->>AuthController: POST /auth/refresh
        AuthController->>JWT: Refresh token
        alt Refresh Success
            JWT-->>AuthController: New JWT token
            AuthController-->>Interceptor: { status_code: 200, data: { token, user } }
            Interceptor->>Interceptor: Store new token in localStorage
            Interceptor->>Interceptor: Notify queued requests
            Interceptor->>API: Retry original request with new token
            API-->>Interceptor: Success response
            Interceptor-->>Client: Response data
        else Refresh Failed
            JWT-->>AuthController: Refresh token expired
            AuthController-->>Interceptor: 401 Error
            Interceptor->>Interceptor: Clear localStorage
            Interceptor->>Interceptor: Redirect to /login
            Interceptor-->>Client: Session expired toast
        end
    else Token Invalid
        Interceptor->>Interceptor: Clear localStorage
        Interceptor->>Interceptor: Redirect to /login
        Interceptor-->>Client: Session expired toast
    end
    
    Note over Client,JWT: Concurrent Requests During Refresh
    Client->>Interceptor: Request A (token expired)
    Interceptor->>AuthController: POST /auth/refresh
    Client->>Interceptor: Request B (same expired token)
    Interceptor->>Interceptor: Add to refreshSubscribers queue
    Client->>Interceptor: Request C (same expired token)
    Interceptor->>Interceptor: Add to refreshSubscribers queue
    AuthController-->>Interceptor: New token
    Interceptor->>Interceptor: Execute all queued requests with new token
    Interceptor-->>Client: Response A, B, C
```

---

## 1. Customer Registration & Login Flow

```mermaid
sequenceDiagram
    actor Customer
    participant Frontend
    participant AuthController
    participant Database
    participant JWT
    
    Note over Customer,JWT: Registration Process
    Customer->>Frontend: Fill registration form
    Frontend->>AuthController: POST /auth/register
    AuthController->>Database: Check email exists
    alt Email already exists
        Database-->>AuthController: Email found
        AuthController-->>Frontend: Error: Email taken
        Frontend-->>Customer: Show error
    else Email available
        Database-->>AuthController: Email available
        AuthController->>Database: Create user (role=customer)
        Database-->>AuthController: User created
        AuthController->>JWT: Generate token
        JWT-->>AuthController: JWT token
        AuthController-->>Frontend: Success + token + user
        Frontend-->>Customer: Registration success
    end
    
    Note over Customer,JWT: Login Process
    Customer->>Frontend: Enter email & password
    Frontend->>AuthController: POST /auth/login
    AuthController->>Database: Find user by email
    Database-->>AuthController: User record
    AuthController->>AuthController: Verify password
    alt Password invalid
        AuthController-->>Frontend: Error: Invalid credentials
        Frontend-->>Customer: Show error
    else Password valid
        AuthController->>JWT: Generate token
        JWT-->>AuthController: JWT token
        AuthController-->>Frontend: Success + token + user
        Frontend->>Frontend: Store token in localStorage
        Frontend-->>Customer: Redirect to home
    end
```

---

## 2. Browse & Add to Cart Flow

```mermaid
sequenceDiagram
    actor Customer
    participant Frontend
    participant ProdukController
    participant KeranjangController
    participant Database
    
    Note over Customer,Database: Browse Products
    Customer->>Frontend: Visit product catalog
    Frontend->>ProdukController: GET /produk?kategori=padel
    ProdukController->>Database: Query products
    Database-->>ProdukController: Product list
    ProdukController-->>Frontend: Paginated products
    Frontend-->>Customer: Display products
    
    Note over Customer,Database: View Product Detail
    Customer->>Frontend: Click product
    Frontend->>ProdukController: GET /produk/{id}
    ProdukController->>Database: Get product with variants
    Database-->>ProdukController: Product detail
    ProdukController-->>Frontend: Product + variants + reviews
    Frontend-->>Customer: Display detail page
    
    Note over Customer,Database: Add to Cart
    Customer->>Frontend: Select variants + quantity
    Frontend->>Frontend: Validate stock client-side
    Frontend->>KeranjangController: POST /customer/keranjang<br/>{produk_id, varian_ids, jumlah}
    KeranjangController->>Database: Get user cart
    alt Cart not exists
        KeranjangController->>Database: Create cart for user
    end
    KeranjangController->>Database: Check product stock
    alt Stock insufficient
        Database-->>KeranjangController: Stock not enough
        KeranjangController-->>Frontend: Error: Stock insufficient
        Frontend-->>Customer: Show error toast
    else Stock available
        KeranjangController->>Database: Calculate prices
        KeranjangController->>Database: Add/Update cart item
        Database-->>KeranjangController: Item added
        KeranjangController-->>Frontend: Success + cart data
        Frontend->>Frontend: Update cart badge count
        Frontend-->>Customer: Show success toast
    end
```

---

## 3. Checkout & Payment Flow

```mermaid
sequenceDiagram
    actor Customer
    participant Frontend
    participant CheckoutController
    participant PaymentController
    participant Database
    participant Biteship
    participant Midtrans
    
    Note over Customer,Midtrans: Checkout Initiation
    Customer->>Frontend: Click checkout
    Frontend->>CheckoutController: GET /customer/checkout/summary
    CheckoutController->>Database: Get cart items + default address
    Database-->>CheckoutController: Cart + Address
    CheckoutController-->>Frontend: Checkout summary
    Frontend-->>Customer: Display checkout page
    
    Note over Customer,Midtrans: Calculate Shipping
    Customer->>Frontend: Confirm/change address
    Frontend->>Frontend: Check if address has area_id
    alt area_id is null
        Frontend-->>Customer: Show warning message
        Frontend->>AlamatController: GET /customer/alamat (auto-fix)
        AlamatController->>Biteship: Search area (3-pattern fallback)<br/>1. Kelurahan + Kota<br/>2. Kota only<br/>3. Kelurahan only
        Biteship-->>AlamatController: area_id found
        AlamatController->>Database: Update address.area_id
        AlamatController-->>Frontend: Updated address list
    end
    Frontend->>CheckoutController: POST /customer/checkout/shipping-rates<br/>{destination_area_id}
    CheckoutController->>Database: Get cart items
    CheckoutController->>CheckoutController: Load variants with loadVariants()<br/>(handles products without variants)
    CheckoutController->>CheckoutController: Prepare shipping payload
    CheckoutController->>Biteship: Calculate shipping rates
    Biteship-->>CheckoutController: Shipping options
    CheckoutController-->>Frontend: Available couriers + prices
    Frontend-->>Customer: Display shipping options<br/>(RadioGroup with unique compound keys)
    
    Note over Customer,Midtrans: Create Order
    Customer->>Frontend: Select courier + payment method
    Frontend->>CheckoutController: POST /customer/checkout/process<br/>{address, courier, payment_method}
    CheckoutController->>Database: Start transaction
    CheckoutController->>Database: Create order (status=Belum Dibayar)
    CheckoutController->>CheckoutController: Load variants for each cart item<br/>(handles products with/without variants)
    CheckoutController->>Database: Copy cart items to order_items<br/>(with variant details)
    CheckoutController->>Database: Clear cart
    CheckoutController->>Database: Create payment record (status=pending)
    Database-->>CheckoutController: Order created
    
    Note over Customer,Midtrans: Generate Payment Token
    CheckoutController->>PaymentController: Create Snap Token
    PaymentController->>Database: Get order details
    PaymentController->>PaymentController: Prepare transaction data<br/>(with clean callback URL: /orders)
    PaymentController->>Midtrans: Request Snap Token<br/>(no query params in callback)
    Midtrans-->>PaymentController: Snap Token
    PaymentController->>Database: Update payment.snap_token
    PaymentController-->>CheckoutController: Snap Token
    CheckoutController-->>Frontend: Success + snap_token
    
    Note over Customer,Midtrans: Payment Process
    Frontend->>Frontend: Load Midtrans Snap
    Frontend-->>Customer: Show payment modal
    Customer->>Midtrans: Select payment method & pay
    Midtrans->>Midtrans: Process payment
    
    alt Payment Success
        Midtrans->>PaymentController: POST /payment/notification<br/>(webhook)
        PaymentController->>PaymentController: Verify signature
        PaymentController->>Database: Update payment.status = paid
        PaymentController->>Database: Update order.status = Sudah Dibayar
        PaymentController->>Database: Create notification
        PaymentController-->>Midtrans: OK
        Midtrans-->>Customer: Payment success page
        Customer->>Frontend: Return to app
        Frontend->>Frontend: Poll order status
        Frontend-->>Customer: Show order success
    else Payment Failed
        Midtrans->>PaymentController: POST /payment/notification<br/>(status=failed)
        PaymentController->>Database: Update payment.status = failed
        PaymentController->>Database: Update order.status = Dibatalkan
        PaymentController-->>Midtrans: OK
        Midtrans-->>Customer: Payment failed page
    end
```

---

## 4. Admin Order Processing Flow

```mermaid
sequenceDiagram
    actor Admin
    participant Frontend
    participant AdminPesananController
    participant Database
    participant NotificationSystem
    actor Customer
    
    Note over Admin,Customer: View Orders
    Admin->>Frontend: Access order list
    Frontend->>AdminPesananController: GET /admin/pesanan
    AdminPesananController->>Database: Query orders (paginated)
    Database-->>AdminPesananController: Order list
    AdminPesananController-->>Frontend: Orders with status
    Frontend-->>Admin: Display order table
    
    Note over Admin,Customer: Pack Order
    Admin->>Frontend: Select paid order
    Frontend->>AdminPesananController: GET /admin/pesanan/{id}
    AdminPesananController->>Database: Get order detail
    Database-->>AdminPesananController: Order + items
    AdminPesananController-->>Frontend: Order detail
    Frontend-->>Admin: Display order detail
    
    Admin->>Frontend: Click "Pack Order"
    Frontend->>AdminPesananController: POST /admin/pesanan/{id}/pack
    AdminPesananController->>Database: Check order.status = Sudah Dibayar
    alt Status not valid
        AdminPesananController-->>Frontend: Error: Invalid status
        Frontend-->>Admin: Show error
    else Status valid
        AdminPesananController->>Database: Update order.status = Dikemas
        AdminPesananController->>Database: Reduce product stock automatically<br/>(triggered by status change)
        AdminPesananController->>Database: Create pengiriman record
        Database-->>AdminPesananController: Updated
        AdminPesananController->>NotificationSystem: Trigger notification
        NotificationSystem->>Database: Create notification
        NotificationSystem->>Customer: Send push/email
        AdminPesananController-->>Frontend: Success
        Frontend-->>Admin: Show success toast
    end
    
    Note over Admin,Customer: Ship Order
    Admin->>Frontend: Enter tracking number
    Frontend->>AdminPesananController: POST /admin/pesanan/{id}/ship<br/>{tracking_number, courier}
    AdminPesananController->>Database: Update order.status = Dikirim
    AdminPesananController->>Database: Update tracking_number
    AdminPesananController->>Database: Update pengiriman
    AdminPesananController->>NotificationSystem: Trigger shipped notification
    NotificationSystem->>Database: Create notification
    NotificationSystem->>Customer: Send tracking link
    AdminPesananController-->>Frontend: Success
    Frontend-->>Admin: Show success
    
    Note over Admin,Customer: Customer Completes Order
    Customer->>Frontend: Receive package
    Frontend->>AdminPesananController: POST /customer/pesanan/{id}/complete
    AdminPesananController->>Database: Update order.status = Selesai
    AdminPesananController->>NotificationSystem: Trigger completed notification
    AdminPesananController-->>Frontend: Success
    Frontend-->>Customer: Show rating form
```

---

## 5. Shipping Tracking Flow

```mermaid
sequenceDiagram
    actor Customer
    participant Frontend
    participant TrackingController
    participant Database
    participant BinderByte
    
    Note over Customer,BinderByte: View Order with Tracking
    Customer->>Frontend: View order detail
    Frontend->>Frontend: Check if tracking_number exists
    
    alt No tracking number
        Frontend-->>Customer: Show "Order being processed"
    else Has tracking number
        Frontend-->>Customer: Show "Track Package" button
        Customer->>Frontend: Click track
        Frontend->>TrackingController: GET /tracking<br/>?awb={resi}&courier={code}
        TrackingController->>BinderByte: Request tracking
        BinderByte->>BinderByte: Query courier system
        
        alt Package found
            BinderByte-->>TrackingController: Tracking history
            TrackingController->>Database: Update pengiriman.tracking_history
            TrackingController-->>Frontend: Success + tracking data
            Frontend->>Frontend: Parse tracking timeline
            Frontend-->>Customer: Display tracking history<br/>- Picked up<br/>- In transit<br/>- Out for delivery<br/>- Delivered
        else Package not found
            BinderByte-->>TrackingController: Error: Not found
            TrackingController-->>Frontend: Error message
            Frontend-->>Customer: "Tracking not available yet"
        end
    end
    
    Note over Customer,BinderByte: Get Supported Couriers
    Customer->>Frontend: View courier list
    Frontend->>TrackingController: GET /tracking/couriers
    TrackingController-->>Frontend: Courier list (JNE, J&T, SiCepat, etc)
    Frontend-->>Customer: Display available couriers
```

---

## 6. Wishlist Management Flow

```mermaid
sequenceDiagram
    actor Customer
    participant Frontend
    participant WishlistController
    participant Database
    
    Note over Customer,Database: Add to Wishlist
    Customer->>Frontend: Browse product
    Frontend-->>Customer: Show product card with heart icon
    Customer->>Frontend: Click heart icon
    Frontend->>WishlistController: POST /customer/wishlist<br/>{produk_id}
    WishlistController->>Database: Check if already exists
    
    alt Already in wishlist
        Database-->>WishlistController: Record exists
        WishlistController-->>Frontend: Error: Already in wishlist
        Frontend-->>Customer: Show "Already added"
    else Not in wishlist
        WishlistController->>Database: Insert wishlist record
        Database-->>WishlistController: Success
        WishlistController-->>Frontend: Success + message
        Frontend->>Frontend: Update heart icon (filled)
        Frontend-->>Customer: Show success toast
    end
    
    Note over Customer,Database: View Wishlist
    Customer->>Frontend: Access wishlist page
    Frontend->>WishlistController: GET /customer/wishlist
    WishlistController->>Database: Get user wishlist with product details
    Database-->>WishlistController: Wishlist items
    WishlistController-->>Frontend: Success + data array
    Frontend-->>Customer: Display wishlist grid
    
    Note over Customer,Database: Remove from Wishlist
    Customer->>Frontend: Click remove on wishlist item
    Frontend->>WishlistController: DELETE /customer/wishlist/{produk_id}
    WishlistController->>Database: Delete wishlist record
    Database-->>WishlistController: Deleted
    WishlistController-->>Frontend: Success + message
    Frontend->>Frontend: Remove item from UI
    Frontend-->>Customer: Show "Removed from wishlist"
```

---

## 7. Product Rating & Review Flow

```mermaid
sequenceDiagram
    actor Customer
    participant Frontend
    participant PesananController
    participant Database
    
    Note over Customer,Database: View Completed Order
    Customer->>Frontend: Access order history
    Frontend->>PesananController: GET /customer/pesanan
    PesananController->>Database: Get user orders
    Database-->>PesananController: Order list
    PesananController-->>Frontend: Orders (filter status=Selesai)
    Frontend-->>Customer: Show completed orders
    
    Note over Customer,Database: Rate Product
    Customer->>Frontend: Select completed order
    Customer->>Frontend: Click "Rate" on product
    Frontend-->>Customer: Show rating modal<br/>(stars + review text)
    Customer->>Frontend: Give rating (1-5) + review
    Frontend->>PesananController: POST /customer/pesanan/{id}/rating<br/>{rating, review}
    PesananController->>Database: Get order detail
    PesananController->>Database: Check order.status = Selesai
    
    alt Order not completed
        PesananController-->>Frontend: Error: Order not completed
        Frontend-->>Customer: Show error
    else Order completed
        PesananController->>Database: Update item_pesanan.rating
        PesananController->>Database: Update item_pesanan.review
        PesananController->>Database: Recalculate product avg rating
        Database-->>PesananController: Updated
        PesananController-->>Frontend: Success + message
        Frontend->>Frontend: Update UI (show rating)
        Frontend-->>Customer: "Thank you for your review!"
    end
    
    Note over Customer,Database: View Product Reviews
    Customer->>Frontend: Browse product detail
    Frontend->>Frontend: Load product reviews from DB
    Frontend-->>Customer: Display reviews with:<br/>- User name<br/>- Rating stars<br/>- Review text<br/>- Date
```

---

## 8. Admin Dashboard & Reports Flow

```mermaid
sequenceDiagram
    actor Admin
    participant Frontend
    participant DashboardController
    participant ExportController
    participant Database
    participant PDFService
    participant ExcelService
    
    Note over Admin,ExcelService: View Dashboard
    Admin->>Frontend: Access admin dashboard
    Frontend->>DashboardController: GET /admin/dashboard
    DashboardController->>Database: Aggregate statistics
    Database->>Database: Calculate total revenue
    Database->>Database: Count orders by status
    Database->>Database: Count total users
    Database->>Database: Get sales data (6 months)
    Database->>Database: Get top 5 products
    Database-->>DashboardController: Statistics object
    DashboardController-->>Frontend: Dashboard data
    Frontend->>Frontend: Render charts (Chart.js)
    Frontend-->>Admin: Display:<br/>- Revenue cards<br/>- Sales chart<br/>- Recent orders<br/>- Top products
    
    Note over Admin,ExcelService: Export Orders Report
    Admin->>Frontend: Access export page
    Frontend-->>Admin: Show date filters + format options
    Admin->>Frontend: Select date range + format (PDF)
    Frontend->>ExportController: GET /admin/export/orders/pdf<br/>?start_date=2024-01-01&end_date=2024-12-31
    ExportController->>Database: Query orders with filters
    Database-->>ExportController: Filtered orders
    ExportController->>PDFService: Generate PDF (DomPDF)
    PDFService->>PDFService: Load view template
    PDFService->>PDFService: Render order data
    PDFService-->>ExportController: PDF binary
    ExportController-->>Frontend: Download PDF file
    Frontend-->>Admin: Save "laporan_pesanan_2024-12-31.pdf"
    
    Note over Admin,ExcelService: Export Revenue Report
    Admin->>Frontend: Select "Export Revenue" (Excel)
    Frontend->>ExportController: GET /admin/export/revenue/excel<br/>?start_date=2024-01-01&end_date=2024-12-31
    ExportController->>Database: Query paid orders
    ExportController->>ExportController: Calculate totals & averages
    ExportController->>ExportController: Group by month
    ExportController->>ExcelService: Generate Excel (Maatwebsite)
    ExcelService-->>ExportController: Excel binary
    ExportController-->>Frontend: Download Excel file
    Frontend-->>Admin: Save "laporan_pendapatan_2024-12-31.xlsx"
```

---

## 9. Password Reset with OTP Flow

```mermaid
sequenceDiagram
    actor Customer
    participant Frontend
    participant AuthController
    participant Database
    participant MailService
    
    Note over Customer,MailService: Request OTP
    Customer->>Frontend: Click "Forgot Password"
    Frontend-->>Customer: Show email input
    Customer->>Frontend: Enter email
    Frontend->>AuthController: POST /auth/send-otp<br/>{email}
    AuthController->>Database: Check if user exists
    
    alt User not found
        AuthController-->>Frontend: Error: Email not registered
        Frontend-->>Customer: Show error
    else User exists
        AuthController->>AuthController: Generate 6-digit OTP
        AuthController->>AuthController: Set expiry (5 minutes)
        AuthController->>Database: Delete old OTP for email
        AuthController->>Database: Save OTP record
        AuthController->>MailService: Send OTP email
        MailService-->>Customer: Email with OTP code
        AuthController-->>Frontend: Success + expires_in
        Frontend-->>Customer: Show OTP input form
    end
    
    Note over Customer,MailService: Verify OTP
    Customer->>Frontend: Enter OTP code
    Frontend->>AuthController: POST /auth/verify-otp<br/>{email, otp}
    AuthController->>Database: Find OTP record
    AuthController->>AuthController: Check expiry
    
    alt OTP expired
        AuthController-->>Frontend: Error: OTP expired
        Frontend-->>Customer: "OTP expired, request new one"
    else OTP valid
        AuthController->>Database: Mark OTP as verified
        AuthController-->>Frontend: Success + valid=true
        Frontend-->>Customer: Show password reset form
    end
    
    Note over Customer,MailService: Reset Password
    Customer->>Frontend: Enter new password
    Frontend->>AuthController: POST /auth/reset-password-otp<br/>{email, otp, password}
    AuthController->>Database: Verify OTP again
    AuthController->>Database: Hash new password
    AuthController->>Database: Update user password
    AuthController->>Database: Delete OTP record
    AuthController-->>Frontend: Success
    Frontend-->>Customer: "Password changed successfully"
    Frontend->>Frontend: Redirect to login
```

---

## 10. Notification System Flow

```mermaid
sequenceDiagram
    participant Event[Order Event]
    participant NotificationController
    participant Database
    participant PushService
    participant MailService
    actor Customer
    
    Note over Event,Customer: Order Status Changes
    Event->>NotificationController: Trigger event<br/>(payment_success, order_shipped, etc)
    NotificationController->>Database: Create notification record
    NotificationController->>Database: Set title, message, type
    Database-->>NotificationController: Notification created
    
    par Send Notifications
        NotificationController->>PushService: Send push notification
        PushService-->>Customer: Push notification
    and
        NotificationController->>MailService: Send email
        MailService-->>Customer: Email notification
    end
    
    Note over Event,Customer: Customer Views Notifications
    Customer->>NotificationController: GET /customer/notifications
    NotificationController->>Database: Get notifications<br/>(paginated, with unread_count)
    Database-->>NotificationController: Notification list
    NotificationController-->>Customer: Display notifications
    
    Note over Event,Customer: Mark as Read
    Customer->>NotificationController: POST /customer/notifications/{id}/read
    NotificationController->>Database: Update is_read = true
    NotificationController->>Database: Count unread notifications
    Database-->>NotificationController: Updated count
    NotificationController-->>Customer: Success + meta.unread_count
```

---

## Sequence Diagram Conventions

### Symbols Used
- `actor`: Human user (Customer, Admin)
- `participant`: System component
- `-->>`: Return/response
- `->>`: Request/call
- `alt/else`: Conditional flow
- `par/and`: Parallel execution
- `Note over`: Descriptive section

### Common Patterns

#### Error Handling
```
alt Success
    Component-->>Frontend: Success response
else Error
    Component-->>Frontend: Error response
    Frontend-->>User: Show error message
end
```

#### Authentication
All authenticated endpoints include JWT token in request headers:
```
Authorization: Bearer {token}
```

#### Transaction Safety
Critical operations (checkout, payment) use database transactions:
```
Database->>Database: BEGIN TRANSACTION
... operations ...
Database->>Database: COMMIT
```
