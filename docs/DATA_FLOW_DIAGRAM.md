# Data Flow Diagram (DFD)

## Recent Updates (Nov 2025)

### Key Improvements
1. **API Response Standardization**: All endpoints return `{ status_code, message, data }` format
2. **ApiResponseTrait**: Centralized response handling in backend (21+ controllers)
3. **Frontend Helper Functions**: `isSuccess()`, `getData()`, `getMessage()`, `getErrorMessage()`
4. **JWT Auto-Refresh**: Automatic token refresh with request queuing mechanism
5. **Backward Compatibility**: Response interceptor injects `success` for legacy code
6. **Variant Handling**: Products with/without variants handled via `loadVariants()` method
7. **Area ID Fallback**: 3-pattern search (Kelurahan+Kota, Kota, Kelurahan) for missing area_id
8. **Stock Management**: Automatic stock reduction when order status changes to "Dikemas"
9. **Security**: Clean callback URLs (no query params), encrypted product IDs in frontend
10. **UI Consistency**: Order IDs displayed as ATH{4digit}{3digit} format in frontend

---

## API Response Flow

```mermaid
flowchart TB
    subgraph Backend ["Backend (Laravel)"]
        Controller[Controller]
        Trait[ApiResponseTrait]
        Response[JSON Response]
    end
    
    subgraph Frontend ["Frontend (React)"]
        Axios[Axios Instance]
        Interceptor[Response Interceptor]
        Helpers[Helper Functions]
        Component[React Component]
    end
    
    Controller -->|uses| Trait
    Trait -->|generates| Response
    Response -->|"{ status_code, message, data }"| Axios
    Axios -->|raw response| Interceptor
    Interceptor -->|"inject success for backward compat"| Helpers
    Helpers -->|"isSuccess(), getData()"| Component
```

### Response Processing Flow

```mermaid
flowchart LR
    A[API Response] --> B{status_code exists?}
    B -->|Yes| C[Use status_code]
    B -->|No| D[Use HTTP status]
    C --> E{success undefined?}
    D --> E
    E -->|Yes| F[Inject success = status_code >= 200 && < 300]
    E -->|No| G[Keep existing success]
    F --> H[Return to Component]
    G --> H
```

---

## JWT Token Refresh Flow

```mermaid
flowchart TB
    A[API Request] --> B{Token in localStorage?}
    B -->|No| C[Request without Auth]
    B -->|Yes| D[Add Bearer Token Header]
    D --> E[Send Request]
    E --> F{Response Status?}
    F -->|200 OK| G[Return Data]
    F -->|401 Token Expired| H{Is Refreshing?}
    H -->|No| I[Call /auth/refresh]
    H -->|Yes| J[Add to Queue]
    I --> K{Refresh Success?}
    K -->|Yes| L[Store New Token]
    L --> M[Retry Original Request]
    L --> N[Execute Queued Requests]
    K -->|No| O[Clear Token & Redirect Login]
    M --> G
    N --> G
    J --> P[Wait for Refresh]
    P --> G
```

---

## Level 0: Context Diagram

```mermaid
flowchart TB
    Customer([Customer])
    Admin([Admin])
    System[Athleon E-Commerce System]
    Midtrans[Midtrans Payment Gateway]
    Biteship[Biteship Shipping API]
    BinderByte[BinderByte Tracking API]
    WilayahAPI[Wilayah.id API]
    
    Customer -->|Browse Products, Order, Payment| System
    System -->|Order Confirmation, Tracking Info| Customer
    
    Admin -->|Manage Products, Orders, Reports| System
    System -->|Analytics, Reports| Admin
    
    System -->|Payment Request| Midtrans
    Midtrans -->|Payment Status| System
    
    System -->|Shipping Rate Request| Biteship
    Biteship -->|Shipping Options| System
    
    System -->|Tracking Request| BinderByte
    BinderByte -->|Tracking History| System
    
    System -->|Region Data Request| WilayahAPI
    WilayahAPI -->|Province/City/District Data| System
```

---

## Level 1: Main Processes

```mermaid
flowchart TB
    Customer([Customer])
    Admin([Admin])
    
    subgraph System ["Athleon System"]
        P1[1.0 Product Browsing]
        P2[2.0 Cart Management]
        P3[3.0 Checkout & Payment]
        P4[4.0 Order Processing]
        P5[5.0 Shipping Management]
        P6[6.0 Notification System]
        P7[7.0 Admin Dashboard]
    end
    
    DB[(Database)]
    
    Customer -->|Browse, Search| P1
    P1 -->|Product Data| Customer
    P1 <-->|Read| DB
    
    Customer -->|Add/Update Items| P2
    P2 -->|Cart Data| Customer
    P2 <-->|Read/Write| DB
    
    Customer -->|Checkout Request| P3
    P3 -->|Payment Info| Customer
    P3 <-->|Create Order| DB
    
    P3 -->|New Order| P4
    P4 <-->|Update Status| DB
    P4 -->|Order Updates| P6
    
    P4 -->|Shipping Info| P5
    P5 <-->|Tracking Data| DB
    P5 -->|Tracking Updates| P6
    
    P6 -->|Notifications| Customer
    P6 <-->|Notification Logs| DB
    
    Admin -->|Manage Data| P7
    P7 <-->|CRUD Operations| DB
    P7 -->|Reports, Analytics| Admin
```

---

## Level 2: Detailed Process Flows

### 2.1 Product Browsing Process

```mermaid
flowchart LR
    Customer([Customer])
    
    subgraph Browsing ["1.0 Product Browsing"]
        P1.1[1.1 Get Product List]
        P1.2[1.2 Search Products]
        P1.3[1.3 Filter by Category]
        P1.4[1.4 View Product Detail]
        P1.5[1.5 Get Product Reviews]
    end
    
    DB_Produk[(produk)]
    DB_Kategori[(kategori)]
    DB_Review[(item_pesanan)]
    
    Customer -->|Request Products| P1.1
    Customer -->|Search Query| P1.2
    Customer -->|Select Category| P1.3
    Customer -->|Select Product| P1.4
    
    P1.1 -->|Query| DB_Produk
    P1.2 -->|LIKE Search| DB_Produk
    P1.3 -->|Filter| DB_Kategori
    P1.3 -->|Join| DB_Produk
    P1.4 -->|Get Detail| DB_Produk
    P1.4 -->|Trigger| P1.5
    P1.5 -->|Get Ratings| DB_Review
    
    DB_Produk -->|Product List| P1.1
    P1.1 -->|Display| Customer
```

### 2.2 Cart Management Process

```mermaid
flowchart TB
    Customer([Customer])
    
    subgraph Cart ["2.0 Cart Management"]
        P2.1[2.1 View Cart]
        P2.2[2.2 Add to Cart]
        P2.3[2.3 Update Quantity]
        P2.4[2.4 Remove Item]
        P2.5[2.5 Calculate Total]
    end
    
    DB_Keranjang[(keranjang)]
    DB_ItemKeranjang[(item_keranjang)]
    DB_Produk[(produk)]
    DB_Varian[(produk_varian)]
    
    Customer -->|View Cart| P2.1
    Customer -->|Add Product| P2.2
    Customer -->|Change Qty| P2.3
    Customer -->|Delete Item| P2.4
    
    P2.1 -->|Get Cart ID| DB_Keranjang
    P2.1 -->|Get Items| DB_ItemKeranjang
    P2.1 -->|Join Product Info| DB_Produk
    P2.1 -->|Trigger| P2.5
    
    P2.2 -->|Check/Create Cart| DB_Keranjang
    P2.2 -->|Get Price| DB_Produk
    P2.2 -->|Load Variants via loadVariants| DB_Varian
    P2.2 -->|Insert Item| DB_ItemKeranjang
    
    P2.3 -->|Update Qty| DB_ItemKeranjang
    P2.4 -->|Delete Item| DB_ItemKeranjang
    
    P2.5 -->|Calculate| DB_ItemKeranjang
    P2.5 -->|Total Price| Customer
```

### 2.3 Checkout & Payment Process

```mermaid
flowchart TB
    Customer([Customer])
    
    subgraph Checkout ["3.0 Checkout & Payment"]
        P3.1[3.1 Select Address]
        P3.2[3.2 Calculate Shipping]
        P3.3[3.3 Choose Shipping Method]
        P3.4[3.4 Choose Payment Method]
        P3.5[3.5 Create Order]
        P3.6[3.6 Generate Payment Token]
        P3.7[3.7 Process Payment]
    end
    
    DB_Alamat[(alamat_user)]
    DB_Pesanan[(pesanan)]
    DB_ItemPesanan[(item_pesanan)]
    DB_Pembayaran[(pembayaran)]
    Biteship[Biteship API]
    Midtrans[Midtrans API]
    
    Customer -->|Select| P3.1
    P3.1 -->|Get Addresses| DB_Alamat
    P3.1 -->|Check area_id| P3.1
    P3.1 -->|If null: 3-pattern search| Biteship
    Biteship -->|area_id found| P3.1
    P3.1 -->|Update area_id| DB_Alamat
    P3.1 -->|Chosen Address| P3.2
    
    P3.2 -->|Area ID + Items| Biteship
    Biteship -->|Shipping Options| P3.2
    P3.2 -->|Display with unique keys| Customer
    
    Customer -->|Choose Courier| P3.3
    P3.3 -->|Save Choice| P3.4
    
    Customer -->|Choose Method| P3.4
    P3.4 -->|Create| P3.5
    
    P3.5 -->|Insert Order| DB_Pesanan
    P3.5 -->|Load variants for items| DB_Varian
    P3.5 -->|Copy Cart Items with variants| DB_ItemPesanan
    P3.5 -->|Order Created| P3.6
    
    P3.6 -->|Create Payment Record| DB_Pembayaran
    P3.6 -->|Request Token with clean callback| Midtrans
    Midtrans -->|Snap Token| P3.6
    P3.6 -->|Token| Customer
    
    Customer -->|Pay| P3.7
    P3.7 -->|Payment Info| Midtrans
    Midtrans -->|Callback| P3.7
    P3.7 -->|Update Payment Status| DB_Pembayaran
    P3.7 -->|Update Order Status| DB_Pesanan
```

### 2.4 Order Processing

```mermaid
flowchart TB
    Admin([Admin])
    
    subgraph OrderProcess ["4.0 Order Processing"]
        P4.1[4.1 View Orders]
        P4.2[4.2 Update Status]
        P4.3[4.3 Pack Order]
        P4.4[4.4 Ship Order]
        P4.5[4.5 Complete Order]
        P4.6[4.6 Cancel Order]
    end
    
    DB_Pesanan[(pesanan)]
    DB_Pembayaran[(pembayaran)]
    DB_Pengiriman[(pengiriman)]
    NotifSystem[Notification System]
    
    Admin -->|View List| P4.1
    P4.1 -->|Query Orders| DB_Pesanan
    P4.1 -->|Join Payment| DB_Pembayaran
    DB_Pesanan -->|Order List| P4.1
    P4.1 -->|Display| Admin
    
    Admin -->|Update| P4.2
    P4.2 -->|Update Status| DB_Pesanan
    P4.2 -->|Trigger| NotifSystem
    
    Admin -->|Mark Packed| P4.3
    P4.3 -->|Status = Dikemas| DB_Pesanan
    P4.3 -->|Auto Reduce Stock| DB_Produk
    P4.3 -->|Create Record| DB_Pengiriman
    P4.3 -->|Notify| NotifSystem
    
    Admin -->|Input Resi| P4.4
    P4.4 -->|Status = Dikirim| DB_Pesanan
    P4.4 -->|Update Tracking| DB_Pengiriman
    P4.4 -->|Notify| NotifSystem
    
    Admin -->|Mark Done| P4.5
    P4.5 -->|Status = Selesai| DB_Pesanan
    P4.5 -->|Notify| NotifSystem
    
    Admin -->|Cancel| P4.6
    P4.6 -->|Status = Dibatalkan| DB_Pesanan
    P4.6 -->|Notify| NotifSystem
```

### 2.5 Shipping Management

```mermaid
flowchart TB
    Customer([Customer])
    System[System]
    
    subgraph Shipping ["5.0 Shipping Management"]
        P5.1[5.1 Calculate Rates]
        P5.2[5.2 Create Shipment]
        P5.3[5.3 Track Shipment]
        P5.4[5.4 Update Tracking]
    end
    
    Biteship[Biteship API]
    BinderByte[BinderByte API]
    DB_Pengiriman[(pengiriman)]
    DB_Pesanan[(pesanan)]
    
    Customer -->|Request Rates| P5.1
    P5.1 -->|Origin + Destination| Biteship
    Biteship -->|Rate Options| P5.1
    P5.1 -->|Display Rates| Customer
    
    System -->|Order Shipped| P5.2
    P5.2 -->|Create Shipment| DB_Pengiriman
    P5.2 -->|Update Order| DB_Pesanan
    
    Customer -->|Track Request| P5.3
    P5.3 -->|Get Tracking No| DB_Pengiriman
    P5.3 -->|Query AWB| BinderByte
    BinderByte -->|Tracking History| P5.3
    P5.3 -->|Display Status| Customer
    
    System -->|Periodic Update| P5.4
    P5.4 -->|Get Active Shipments| DB_Pengiriman
    P5.4 -->|Batch Query| BinderByte
    BinderByte -->|Status Updates| P5.4
    P5.4 -->|Update History| DB_Pengiriman
```

### 2.6 Notification System

```mermaid
flowchart TB
    subgraph Events ["Event Triggers"]
        E1[Payment Success]
        E2[Order Packed]
        E3[Order Shipped]
        E4[Order Delivered]
        E5[Order Cancelled]
    end
    
    subgraph NotifSystem ["6.0 Notification System"]
        P6.1[6.1 Create Notification]
        P6.2[6.2 Send to User]
        P6.3[6.3 Mark as Read]
        P6.4[6.4 Get Notifications]
    end
    
    DB_Notif[(notifications)]
    Customer([Customer])
    
    E1 --> P6.1
    E2 --> P6.1
    E3 --> P6.1
    E4 --> P6.1
    E5 --> P6.1
    
    P6.1 -->|Insert Record| DB_Notif
    P6.1 -->|Trigger| P6.2
    P6.2 -->|Push/Email| Customer
    
    Customer -->|View Notifications| P6.4
    P6.4 -->|Query Unread| DB_Notif
    DB_Notif -->|Notification List| P6.4
    P6.4 -->|Display| Customer
    
    Customer -->|Read Notification| P6.3
    P6.3 -->|Update is_read| DB_Notif
```

### 2.7 Admin Dashboard

```mermaid
flowchart TB
    Admin([Admin])
    
    subgraph Dashboard ["7.0 Admin Dashboard"]
        P7.1[7.1 View Statistics]
        P7.2[7.2 Manage Products]
        P7.3[7.3 Manage Categories]
        P7.4[7.4 Manage Users]
        P7.5[7.5 Generate Reports]
        P7.6[7.6 Manage Banners]
    end
    
    DB[(Database)]
    Export[Export Service]
    
    Admin -->|Access Dashboard| P7.1
    P7.1 -->|Aggregate Data| DB
    DB -->|Statistics| P7.1
    P7.1 -->|Display Charts| Admin
    
    Admin -->|CRUD Products| P7.2
    P7.2 <-->|Operations| DB
    
    Admin -->|CRUD Categories| P7.3
    P7.3 <-->|Operations| DB
    
    Admin -->|CRUD Users| P7.4
    P7.4 <-->|Operations| DB
    
    Admin -->|Request Report| P7.5
    P7.5 -->|Query Data| DB
    DB -->|Report Data| P7.5
    P7.5 -->|Generate PDF/Excel| Export
    Export -->|Download| Admin
    
    Admin -->|CRUD Banners| P7.6
    P7.6 <-->|Operations| DB
```

---

## Data Stores

| Store | Description | Read By | Written By |
|-------|-------------|---------|------------|
| D1: users | User accounts | All processes | Registration, Profile Update |
| D2: produk | Product catalog | Browse, Cart, Checkout | Admin Product Management |
| D3: kategori | Product categories | Browse, Admin | Admin Category Management |
| D4: keranjang | Shopping carts | Cart Management | Cart Operations |
| D5: item_keranjang | Cart items | Cart Management | Cart Operations |
| D6: alamat_user | User addresses | Checkout | Address Management |
| D7: pesanan | Orders | Order Processing, Reports | Checkout Process |
| D8: item_pesanan | Order items | Order Details, Reports | Checkout Process |
| D9: pembayaran | Payments | Payment Check, Reports | Payment Process |
| D10: pengiriman | Shipments | Tracking | Shipping Management |
| D11: notifications | User notifications | Notification System | Event Triggers |
| D12: wishlist | User wishlists | Wishlist View | Wishlist Operations |
| D13: banners | Homepage banners | Public View | Admin Banner Management |
| D14: produk_varian | Product variants | Product View, Cart | Admin Product Management |

---

## External Entities

| Entity | Type | Interaction |
|--------|------|-------------|
| Customer | User | Browse, Order, Track, Review |
| Admin | User | Manage, Monitor, Report |
| Midtrans | API | Payment processing, callbacks |
| Biteship | API | Shipping calculation, tracking |
| BinderByte | API | Package tracking |
| Wilayah.id | API | Indonesian region data |

---

## Data Flow Optimization

### Caching Strategy
- **Product List**: Cache for 5 minutes
- **Categories**: Cache for 1 hour
- **Region Data**: Cache for 24 hours
- **Shipping Rates**: Cache for 1 hour per destination

### Async Processing
- Notification sending
- Report generation
- Tracking updates
- Email sending

### Rate Limiting
- External API calls throttled
- Payment webhook validation
- Admin bulk operations queued
