# Konveksi Management System
## Master Plan & System Requirements

Version: 1.0  
Status: Planning

---

# 1. Overview

Konveksi Management System adalah website internal untuk membantu pengelolaan usaha konveksi kecil, mulai dari:

- Pengelolaan customer
- Pengelolaan owner/admin
- Product & size management
- Price management
- Customer order
- Order progress
- Stock/inventory
- Pengiriman
- Pendapatan
- Pengeluaran bahan baku
- History transaksi
- Payroll/gaji pekerja
- Dashboard bisnis

Sistem menggunakan satu website yang sama untuk seluruh role.

Tidak membutuhkan integrasi dengan sistem eksternal pada versi awal.

---

# 2. User Roles

Terdapat 3 role utama:

## 2.1 Super Admin

Super Admin memiliki akses penuh terhadap sistem.

Responsibilities:

- Membuat akun Customer
- Membuat akun Owner
- Generate initial password
- Reset password
- Mengaktifkan/nonaktifkan user
- Melihat seluruh data
- Mengelola konfigurasi sistem

## 2.2 Owner

Owner adalah pengguna utama untuk mengelola operasional konveksi.

Access:

- Dashboard
- Orders
- Products
- Stock
- Delivery
- Revenue
- Expenses
- Payroll
- Customers
- Reports
- History

Owner dapat melakukan CRUD terhadap data operasional.

## 2.3 Customer

Customer memiliki akses terbatas.

Access:

- Dashboard
- Request Order / Request Order
- Current Orders
- Order History
- Order Detail
- Order Receipt / Bukti Pemesanan
- Profile
- Change Password

Customer tidak dapat:

- Mengubah product
- Mengubah harga
- Melihat customer lain
- Melihat financial report
- Mengelola stock
- Mengelola employee
- Mengelola payroll

---

# 3. Authentication

## 3.1 Login

User login menggunakan:

- Username / Email
- Password

Setelah login, sistem menentukan dashboard berdasarkan role.

---

# 4. First Login

Ketika Super Admin membuat akun Customer atau Owner:

1. Super Admin membuat account
2. Sistem generate initial password
3. User menerima username + initial password
4. User melakukan login
5. Sistem mendeteksi `must_change_password = true`
6. User diarahkan ke `/change-password`
7. User wajib mengganti password
8. Setelah berhasil, `must_change_password = false`
9. User dapat mengakses dashboard

User tidak dapat melewati halaman change password.

---

# 5. Main Navigation

## Super Admin

- Dashboard
- Users
- Customers
- Owners
- Products
- Orders
- Stock
- Delivery
- Revenue
- Expenses
- Payroll
- Reports
- Settings

## Owner

- Dashboard
- Orders
- Products
- Stock
- Delivery
- Customers
- Revenue
- Expenses
- Payroll
- Reports
- History

## Customer

- Dashboard
- Request Order
- My Orders
- Order History
- Profile

---

# 6. Dashboard

Dashboard menampilkan informasi berdasarkan role.

## 6.1 Owner Dashboard

### Today's Summary

- Order baru
- Order sedang diproses
- Order selesai
- Order dikirim
- Revenue hari ini
- Expense hari ini

### Monthly Summary

- Total order bulan ini
- Total revenue
- Total expense
- Estimasi profit

### Stock Alert

- Low stock
- Out of stock

### Order Progress

```text
REQUESTED
    ↓
CONFIRMED
    ↓
PRODUCTION
    ↓
READY
    ↓
DELIVERING
    ↓
COMPLETED
```

---

# 7. Product Management

Product adalah master data barang yang dapat dipesan customer.

Contoh:

### Product

Kemeja Batik TK

Sizes:

- 1
- 2
- 3
- 4
- 5
- 6

Price:

Rp 75.000

Contoh lain:

Kemeja SMP

Sizes:

- 10
- 11
- 12

Contoh product tanpa size:

- Dasi SD
- Dasi TK

---

# 8. Product Structure

Product memiliki:

- Product ID
- Product Code
- Product Name
- Description
- Category
- Has Size
- Price
- Active
- Created At
- Updated At

---

# 9. Product Size

Product dapat memiliki size atau tidak.

Field:

`has_size`

Default:

`false`

Jika:

`has_size = false`

Maka product tidak memiliki pilihan size.

Contoh:

Dasi SD

Jika:

`has_size = true`

Maka saat create product akan muncul pilihan size.

Contoh:

Kemeja Batik TK:

- 1
- 2
- 3
- 4
- 5
- 6

---

# 10. Product CRUD

Owner dapat:

- Create Product
- View Product
- Edit Product
- Deactivate Product
- Delete Product

Sebaiknya product yang pernah digunakan pada order tidak benar-benar dihapus.

Gunakan:

`active = false`

atau soft delete.

Alasannya:

Order lama harus tetap dapat ditampilkan.

---

# 11. Price Management

Harga merupakan bagian dari master product.

Contoh:

Kemeja Batik TK:

`Rp 75.000`

Jika harga berubah:

`Rp 80.000`

Product menggunakan harga terbaru untuk order baru.

Order lama tetap menggunakan harga ketika order dibuat.

---

# 12. Customer Order

Customer dapat membuat order.

Flow:

```text
Customer
    ↓
Request Order
    ↓
Select Product
    ↓
Select Size
    ↓
Input Quantity
    ↓
Add Message
    ↓
Submit Order
    ↓
Order Created
    ↓
Owner Review
    ↓
Order Confirmation
```

---

# 13. Order Form

Order terdiri dari beberapa item.

Contoh:

| Product | Size | Qty | Price | Total |
|---|---:|---:|---:|---:|
| Kemeja Batik TK | 1 | 10 | 75.000 | 750.000 |
| Kemeja Batik TK | 2 | 15 | 75.000 | 1.125.000 |
| Kemeja Batik TK | 3 | 10 | 75.000 | 750.000 |
| Dasi TK | - | 20 | 15.000 | 300.000 |

---

# 14. Duplicate Product + Size Rule

Dalam satu order:

`Product + Size` tidak boleh duplicate.

Valid:

```text
Kemeja Batik TK - Size 1
Kemeja Batik TK - Size 2
Kemeja Batik TK - Size 3
```

Tidak valid:

```text
Kemeja Batik TK - Size 1
Kemeja Batik TK - Size 1
```

## Frontend Behavior

Ketika:

`Product A + Size 1`

sudah dipilih pada row pertama, maka row berikutnya:

- Product A tetap dapat dipilih
- Size 1 untuk Product A harus disabled
- Size 2, 3, dst tetap tersedia

Backend juga wajib melakukan validasi yang sama.

---

# 15. Product Without Size

Jika product:

`has_size = false`

Maka size:

`NULL`

atau ditampilkan sebagai:

`N/A`

Contoh:

| Product | Size | Qty |
|---|---|---:|
| Dasi SD | N/A | 20 |

---

# 16. Order Message

Customer dapat memberikan pesan tambahan.

Contoh:

> Harap dikirim sebelum tanggal 20 November.

Field:

`customer_message`

---

# 17. Order Snapshot

## IMPORTANT

Order tidak boleh bergantung pada master Product untuk informasi historis.

Jangan hanya menggunakan:

```text
order_item.product_id
```

karena Product dapat:

- Diubah
- Harga berubah
- Nama berubah
- Size berubah
- Dinonaktifkan
- Dihapus

Ketika order dibuat, data product disalin ke Order Item.

Contoh master:

```text
Product ID:
1001

Name:
Kemeja Batik TK

Price:
75000
```

Snapshot:

```text
Order Item

product_id = 1001

product_code = KBT-TK
product_name = Kemeja Batik TK
size = 2

unit_price = 75000
quantity = 10

total_price = 750000
```

`product_id` boleh tetap disimpan sebagai reference tambahan jika diperlukan.

Tetapi histori order tidak boleh bergantung pada `product_id`.

---

# 18. Recommended Order Item Structure

Order Item menyimpan snapshot:

- Product ID (optional reference)
- Product Code
- Product Name
- Size
- Quantity
- Unit Price
- Total Price

Contoh:

```text
order_item

id
order_id

product_id

product_code
product_name

size_code
size_name

quantity

unit_price
total_price
```

---

# 19. Why Snapshot?

Misalnya:

2026-10-01:

```text
Kemeja Batik TK
Rp 75.000
```

Customer order:

```text
10 pcs
```

Total:

```text
Rp 750.000
```

Kemudian pada 2026-11-01 owner mengubah harga:

```text
Rp 85.000
```

Order lama tetap:

```text
10 x Rp 75.000
= Rp 750.000
```

Jadi histori transaksi tetap immutable.

---

# 20. Order Status

Recommended status:

```text
REQUESTED
CONFIRMED
REJECTED
PRODUCTION
READY
DELIVERING
COMPLETED
CANCELLED
```

## Status Flow

Normal:

```text
REQUESTED
    ↓
CONFIRMED
    ↓
PRODUCTION
    ↓
READY
    ↓
DELIVERING
    ↓
COMPLETED
```

Rejected:

```text
REQUESTED
    ↓
REJECTED
```

Cancelled:

```text
CONFIRMED / PRODUCTION
    ↓
CANCELLED
```

---

# 21. Order History

Customer dapat melihat seluruh order miliknya.

Contoh:

| Order No | Date | Total | Status |
|---|---|---:|---|
| ORD-2026-001 | 01 Oct | 2.500.000 | COMPLETED |
| ORD-2026-002 | 05 Oct | 1.200.000 | PRODUCTION |
| ORD-2026-003 | 08 Oct | 850.000 | REQUESTED |

---

# 22. Order Detail

Customer dapat membuka detail order.

Informasi:

- Order number
- Order date
- Items
- Quantity
- Price
- Total
- Customer message
- Order status
- Delivery information
- Payment information
- Order history/status timeline

---

# 23. Bukti Pemesanan

Setiap order dapat memiliki bukti pemesanan.

Format awal:

PDF.

Contoh:

```text
BUKTI PEMESANAN

Order No:
ORD-2026-001

Customer:
SD XYZ

Date:
08 October 2026

--------------------------------

Kemeja Batik TK
Size 1
Qty 10
Rp 75.000

Kemeja Batik TK
Size 2
Qty 15
Rp 75.000

Dasi TK
Qty 20
Rp 15.000

--------------------------------

TOTAL
Rp 2.175.000
```

Customer dapat:

- View
- Download
- Print

---

# 24. Inventory / Stock Management

Stock management digunakan untuk mengetahui jumlah barang/material yang tersedia.

Ada dua kemungkinan jenis inventory.

## Finished Goods

Barang jadi:

- Kemeja
- Celana
- Dasi
- Rok
- dll.

## Raw Materials

Bahan:

- Kain
- Benang
- Kancing
- Resleting
- Label
- dll.

---

# 25. Stock Structure

Stock dapat memiliki:

- Item
- SKU
- Category
- Quantity
- Unit
- Minimum Stock
- Location
- Active

Contoh:

```text
Kain Batik
SKU: FAB-BTK-001

Stock:
120 meter

Minimum:
30 meter
```

---

# 26. Stock Movement

Jangan hanya menyimpan current stock.

Sebaiknya terdapat stock movement.

Contoh:

```text
STOCK IN
+100

PRODUCTION USAGE
-20

ADJUSTMENT
-5
```

Current stock:

```text
75
```

---

# 27. Stock Movement Types

```text
PURCHASE
PRODUCTION_USAGE
ADJUSTMENT_IN
ADJUSTMENT_OUT
RETURN
OTHER
```

---

# 28. Raw Material Expense

Owner dapat mencatat pembelian bahan.

Contoh:

```text
Date:
08 Oct 2026

Material:
Kain Batik

Quantity:
100 meter

Price:
Rp 5.000.000

Supplier:
Supplier A
```

Expense otomatis masuk ke financial report.

---

# 29. Expense Management

Selain bahan baku, owner dapat mencatat expense lain.

Contoh:

- Bahan baku
- Listrik
- Transport
- Packaging
- Maintenance
- Operasional
- Lain-lain

---

# 30. Revenue

Revenue berasal dari order yang sudah dianggap selesai / paid sesuai aturan bisnis.

Contoh dashboard:

```text
October 2026

Revenue
Rp 45.000.000

Expense
Rp 28.000.000

Estimated Profit
Rp 17.000.000
```

---

# 31. Revenue Report

Filter:

- Today
- This Week
- This Month
- This Year
- Custom Date Range

Contoh:

```text
January
Rp 30M

February
Rp 42M

March
Rp 35M
```

---

# 32. Expense Report

Contoh:

```text
Raw Material
Rp 20.000.000

Operational
Rp 3.000.000

Transport
Rp 2.000.000

Payroll
Rp 10.000.000
```

---

# 33. Profit

Basic calculation:

```text
Profit = Revenue - Expense
```

Untuk versi awal, ini cukup.

Nanti dapat dikembangkan menjadi:

```text
Gross Profit
Net Profit
COGS
Operational Expense
Payroll
Other Expense
```

---

# 34. Delivery Management

Order yang sudah:

`READY`

dapat masuk ke delivery.

Data:

- Order
- Delivery date
- Delivery method
- Recipient
- Address
- PIC
- Delivery status
- Notes

Status:

```text
READY
    ↓
DELIVERING
    ↓
DELIVERED
```

---

# 35. Delivery History

Owner dapat melihat:

| Order | Customer | Date | Status |
|---|---|---|---|
| ORD-001 | SD XYZ | 08 Oct | Delivered |
| ORD-002 | SMP ABC | 09 Oct | Delivering |

Customer hanya dapat melihat delivery order miliknya.

---

# 36. Employee / Worker Management

Owner dapat mengelola pekerja.

Data:

- Employee ID
- Name
- Phone
- Position
- Join Date
- Active
- Salary Type

Salary type:

```text
MONTHLY
DAILY
PER_ORDER
PER_UNIT
```

---

# 37. Payroll

Owner dapat membuat payroll.

Contoh:

```text
Employee:
Budi

Period:
October 2026

Base Salary:
Rp 3.000.000

Overtime:
Rp 500.000

Bonus:
Rp 250.000

Deduction:
Rp 100.000

Total:
Rp 3.650.000
```

---

# 38. Payroll History

Payroll tidak boleh berubah ketika data employee berubah.

Payroll menyimpan snapshot:

```text
employee_id

employee_name

salary_period

base_salary

overtime

bonus

deduction

total_salary

status
```

Status:

```text
DRAFT
CALCULATED
PAID
CANCELLED
```

---

# 39. Audit / History

Untuk data penting, sistem sebaiknya menyimpan:

- Created By
- Created At
- Updated By
- Updated At

Untuk transaksi penting:

- Order status history
- Stock movement
- Expense
- Payroll
- Price changes

---

# 40. Order Status History

Contoh:

```text
08 Oct 09:00
REQUESTED

08 Oct 10:30
CONFIRMED
by Owner

09 Oct 08:00
PRODUCTION

12 Oct 15:00
READY

13 Oct 09:00
DELIVERING

13 Oct 16:00
COMPLETED
```

Ini berguna agar owner/customer dapat mengetahui progress.

---

# 41. Recommended Database Concept

Main entities:

```text
users
roles

customers
employees

products
product_sizes

orders
order_items
order_status_histories

deliveries

stock_items
stock_movements

expenses
expense_categories

payrolls
payroll_items

payments (optional)

audit_logs
```

---

# 42. Relationship Principle

Master data:

```text
Product
Customer
Employee
```

Transaction:

```text
Order
Expense
Stock Movement
Payroll
Delivery
```

Transaction menyimpan snapshot informasi penting.

---

# 43. Product vs Order

Recommended:

```text
PRODUCT
---------
id
code
name
price
has_size
active


PRODUCT_SIZE
------------
id
product_id
size_code
size_name
active


ORDER
---------
id
order_number
customer_id
status
total_amount
customer_message
created_at


ORDER_ITEM
----------
id
order_id

product_id

product_code
product_name

size_code
size_name

quantity
unit_price
total_price
```

`product_code`, `product_name`, `size_code`, `size_name`, dan `unit_price` adalah snapshot.

---

# 44. Important Rule

Master data dapat berubah.

Transaction history harus immutable.

Contoh:

```text
PRODUCT
Price = 80.000
```

tidak boleh menyebabkan:

```text
OLD ORDER
Price = 75.000
```

berubah menjadi:

```text
80.000
```

---

# 45. Customer Order Validation

Backend wajib melakukan validation.

Jangan hanya mengandalkan frontend.

## Product Exists

Product harus active.

## Size Validation

Jika:

```text
has_size = true
```

size wajib valid.

Jika:

```text
has_size = false
```

size harus NULL.

## Duplicate Validation

Combination:

```text
product + size
```

tidak boleh duplicate dalam satu order.

## Quantity

Quantity harus:

```text
> 0
```

---

# 46. Example Order Request

Request:

```json
{
  "items": [
    {
      "productId": 1,
      "sizeCode": "1",
      "quantity": 10
    },
    {
      "productId": 1,
      "sizeCode": "2",
      "quantity": 20
    },
    {
      "productId": 5,
      "sizeCode": null,
      "quantity": 10
    }
  ],
  "message": "Mohon selesai sebelum 20 Oktober"
}
```

Backend kemudian mengambil:

```text
Product
Product Name
Product Code
Current Price
Size
```

dan membuat snapshot ke:

```text
order_items
```

---

# 47. Security

Authentication:

- Password hashed
- Never store plain password
- JWT atau Session-based authentication

Authorization:

```text
SUPER_ADMIN
OWNER
CUSTOMER
```

Endpoint harus memiliki authorization.

Contoh:

```text
/customer/orders
```

Customer hanya dapat melihat order miliknya.

Tidak boleh hanya mengandalkan:

```text
GET /orders/123
```

Backend harus melakukan ownership validation.

---

# 48. Suggested Backend Architecture

Jika menggunakan Spring Boot:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

Recommended package:

```text
auth
user
customer
product
order
inventory
delivery
expense
revenue
payroll
report
```

---

# 49. Suggested Technology Stack

Backend:

```text
Java 21
Spring Boot
Spring Security
Spring Data JPA
PostgreSQL
Flyway
Bean Validation
OpenAPI / Swagger
```

Frontend:

```text
React / Next.js
```

atau jika ingin lebih sederhana:

```text
React + Vite
```

Authentication:

```text
JWT
```

PDF:

```text
OpenPDF / JasperReports
```

---

# 50. Development Phase

## Phase 1 — Foundation

- Project setup
- Database
- Authentication
- Authorization
- User management
- First login
- Change password

## Phase 2 — Product

- Product CRUD
- Product size
- Product price
- Active/inactive
- Product validation

## Phase 3 — Customer Order

- Request order
- Dynamic order rows
- Product selection
- Size selection
- Duplicate size prevention
- Quantity
- Message
- Order creation
- Order snapshot

## Phase 4 — Order Management

Owner:

- View orders
- Confirm
- Reject
- Production
- Ready
- Delivery
- Complete

Customer:

- Current order
- Status
- History
- Order detail
- PDF receipt

## Phase 5 — Inventory

- Stock item
- Stock in
- Stock out
- Stock adjustment
- Stock movement
- Low stock alert

## Phase 6 — Expense & Revenue

- Expense
- Raw material purchase
- Revenue
- Monthly report
- Profit calculation

## Phase 7 — Delivery

- Delivery management
- Delivery status
- Delivery history

## Phase 8 — Payroll

- Employee
- Salary configuration
- Payroll
- Payroll history
- Salary report

## Phase 9 — Dashboard & Reports

- Revenue chart
- Expense chart
- Profit
- Order statistics
- Stock statistics
- Monthly report
- Employee/payroll report

---

# 51. MVP

Untuk versi pertama, jangan langsung membuat semuanya.

Recommended MVP:

## Authentication

- Login
- Role
- User management
- First login
- Change password

## Product

- Product CRUD
- Size
- Price

## Order

- Customer request order
- Order validation
- Order snapshot
- Owner confirmation
- Order status
- Order history

## Dashboard

- Total orders
- On progress
- Completed
- Revenue

## PDF

- Order receipt

Dengan MVP ini sistem sudah dapat digunakan untuk operasional sehari-hari.

---

# 52. Version 2

Setelah MVP stabil:

- Inventory
- Raw material
- Expense
- Delivery
- Revenue report
- Profit
- Stock alert

---

# 53. Version 3

Advanced management:

- Payroll
- Employee management
- Advanced reports
- Audit log
- Monthly financial report
- Customer analytics
- Product analytics

---

# 54. Initial Menu Structure

## Owner

```text
🏠 Dashboard

📦 Orders
   ├── New Orders
   ├── On Progress
   ├── Ready
   ├── Delivery
   └── History

🛍 Products
   ├── Product List
   ├── Categories
   └── Sizes

📊 Inventory
   ├── Stock
   ├── Stock Movement
   └── Low Stock

🚚 Delivery
   ├── Pending
   ├── On Delivery
   └── History

💰 Finance
   ├── Revenue
   ├── Expenses
   └── Reports

👷 Employees
   ├── Employee List
   └── Payroll

👥 Customers

📈 Reports

⚙️ Settings
```

## Customer

```text
🏠 Dashboard

🛒 Request Order

📦 My Orders

📜 Order History

👤 Profile
```

## Super Admin

```text
🏠 Dashboard

👥 Users
   ├── Customers
   ├── Owners
   └── User Management

⚙️ System Settings
```

---

# 55. Core Business Flow

```text
                  SUPER ADMIN
                       │
                       ▼
                Create User
                       │
                       ▼
              Initial Password
                       │
                       ▼
                    LOGIN
                       │
                       ▼
              Change Password
                       │
              ┌────────┴────────┐
              ▼                 ▼
           CUSTOMER           OWNER
              │                 │
              │                 │
         Request Order      Manage Product
              │                 │
              ▼                 ▼
            ORDER          Manage Stock
              │                 │
              ▼                 ▼
         Confirmation      Manage Expense
              │                 │
              ▼                 ▼
         Production         Dashboard
              │
              ▼
            READY
              │
              ▼
          DELIVERY
              │
              ▼
          COMPLETED
              │
              ▼
           REVENUE
```

---

# 56. Final Architecture Principle

Master data:

```text
User
Customer
Employee
Product
Product Size
```

Transactional data:

```text
Order
Order Item
Delivery
Stock Movement
Expense
Payroll
```

Historical transaction data harus menyimpan snapshot dari informasi yang dapat berubah.

Dengan prinsip ini:

```text
Master Data Change
        ↓
New Transaction
        ↓
menggunakan data terbaru

Old Transaction
        ↓
TETAP menggunakan snapshot lama
```

Ini menjadi prinsip utama desain database sistem.

---

# 57. Future Enhancement

Jika bisnis semakin besar, sistem dapat dikembangkan menjadi:

- Supplier Management
- Purchase Order
- Production Management
- Production Batch
- Material Consumption
- Manufacturing Cost
- Customer Invoice
- Payment Tracking
- Partial Payment
- Down Payment
- Outstanding Payment
- WhatsApp Notification
- Email Notification
- Barcode / QR Code
- Customer Portal
- Financial Dashboard

---

# 58. Next Recommended Design Step

Setelah master plan ini disetujui, tahap berikutnya adalah membuat **Database Design & ERD** secara konkret.

Dokumen berikutnya sebaiknya mencakup:

1. ERD
2. Semua tabel
3. Semua kolom
4. PK/FK
5. Index
6. Unique constraint
7. Enum/status
8. Soft delete strategy
9. Audit fields
10. Order snapshot design
11. Stock movement design
12. Payroll snapshot design
13. User-role authorization design
14. Contoh data
15. Flyway migration structure

Setelah database design selesai, baru diturunkan menjadi:

```text
Database
   ↓
JPA Entity
   ↓
Repository
   ↓
Service
   ↓
DTO
   ↓
Controller
   ↓
Frontend
```

Dengan urutan ini, implementasi Spring Boot akan lebih terstruktur dan mengurangi perubahan besar di tengah development.
