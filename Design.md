# Design Document — Inventory Management System

## 1. Overview

The Inventory Management System (IMS) is a web-based application that allows an
Admin (and optionally Staff) to manage products, categories, suppliers,
customers, purchases, and sales, while tracking stock levels and generating
reports in real time.

**Purpose:** Learn full-stack fundamentals (HTML/CSS/JS on the frontend,
Node.js/Express on the backend, MySQL as the database) by building a
real, practical CRUD + business-logic application.

**Tech Stack**

| Layer      | Technology              |
|------------|--------------------------|
| Frontend   | HTML, CSS, JavaScript (vanilla) |
| Backend    | Node.js, Express.js      |
| Database   | MySQL                    |
| Auth       | Session-based or JWT (optional) |
| File Upload| Multer                   |

---

## 2. Goals & Non-Goals

**Goals**
- Full CRUD for products, categories, suppliers, customers
- Purchase workflow that increases stock
- Sales workflow that decreases stock (with stock validation)
- Dashboard summarizing key metrics
- Basic reporting (sales, purchase, stock, profit)
- Simple, session-based authentication with role support

**Non-Goals (v1)**
- Multi-warehouse / multi-branch inventory
- Real-time notifications / websockets
- Payment gateway integration
- Mobile app

---

## 3. User Roles & Permissions

| Role  | Permissions |
|-------|-------------|
| Admin | Full access: manage users, all CRUD modules, reports, settings |
| Staff (optional) | Access to Products, Purchases, Sales, Customers; no user management, limited reports |

Role is stored on the `users` table (`role` ENUM: `admin`, `staff`) and
checked via middleware on protected routes.

---

## 4. High-Level Architecture

```
┌──────────────────┐        HTTP (fetch/JSON)       ┌───────────────────────┐
│   Frontend (SPA-  │  ─────────────────────────▶   │   Backend (Express)   │
│   like, multi-page│                                │   REST API            │
│   HTML/CSS/JS)     │  ◀─────────────────────────   │   Controllers/Routes  │
└──────────────────┘                                 └──────────┬────────────┘
                                                                  │ mysql2 (pool)
                                                                  ▼
                                                        ┌───────────────────┐
                                                        │      MySQL         │
                                                        │  inventory schema  │
                                                        └───────────────────┘
```

**Pattern:** MVC on the backend (Routes → Controllers → Models), REST APIs
consumed by plain JS on the frontend via `fetch`. Multer handles image
uploads to `backend/uploads/`, served statically.

---

## 5. Folder Structure

```
Inventory-System/
│
├── frontend/
│   ├── css/
│   │   ├── style.css
│   │   ├── dashboard.css
│   │   └── login.css
│   ├── js/
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   ├── products.js
│   │   ├── category.js
│   │   ├── supplier.js
│   │   ├── customer.js
│   │   ├── purchase.js
│   │   └── sales.js
│   ├── images/
│   ├── login.html
│   ├── dashboard.html
│   ├── products.html
│   ├── category.html
│   ├── suppliers.html
│   ├── customers.html
│   ├── purchase.html
│   ├── sales.html
│   └── report.html
│
├── backend/
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── product.routes.js
│   │   ├── category.routes.js
│   │   ├── supplier.routes.js
│   │   ├── customer.routes.js
│   │   ├── purchase.routes.js
│   │   ├── sales.routes.js
│   │   └── report.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   ├── category.controller.js
│   │   ├── supplier.controller.js
│   │   ├── customer.controller.js
│   │   ├── purchase.controller.js
│   │   ├── sales.controller.js
│   │   └── report.controller.js
│   ├── models/
│   │   └── db.js               (MySQL connection pool)
│   ├── middleware/
│   │   ├── auth.middleware.js  (session/JWT check)
│   │   └── upload.middleware.js (Multer config)
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
└── database/
    └── inventory.sql
```

---

## 6. Database Design

### 6.1 Entity Relationship Summary

```
users
categories ──< products >── suppliers
customers ──< sales >── sale_items >── products
suppliers ──< purchases >── purchase_items >── products
```

- One category has many products
- One supplier has many products and many purchases
- One customer has many sales
- One sale has many sale_items (line items); one purchase has many purchase_items

### 6.2 Table Schemas

```sql
CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

-- USERS
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,      -- hashed (bcrypt)
    role ENUM('admin', 'staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIES
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SUPPLIERS
CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    company VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CUSTOMERS
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category_id INT,
    supplier_id INT,
    purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity INT NOT NULL DEFAULT 0,
    barcode VARCHAR(100) UNIQUE,
    description TEXT,
    image VARCHAR(255),
    low_stock_threshold INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- PURCHASES (header)
CREATE TABLE purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- PURCHASE ITEMS (line items)
CREATE TABLE purchase_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- SALES (header)
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- SALE ITEMS (line items)
CREATE TABLE sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Helpful indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_purchases_supplier ON purchases(supplier_id);
```

### 6.3 Stock Update Logic (Transactions)

- **Purchase saved:** insert into `purchases` + `purchase_items`, then
  `UPDATE products SET quantity = quantity + :qty WHERE id = :product_id`.
- **Sale saved:** validate `quantity <= products.quantity` for each item
  first; if valid, insert into `sales` + `sale_items`, then
  `UPDATE products SET quantity = quantity - :qty WHERE id = :product_id`.
- Both operations are wrapped in a MySQL **transaction**
  (`START TRANSACTION` ... `COMMIT` / `ROLLBACK`) so partial failures don't
  corrupt stock counts.

---

## 7. API Design

Base URL: `/api`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | Authenticate user, create session/JWT |
| POST | /auth/logout | Destroy session |
| POST | /auth/change-password | Update logged-in user's password |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /products | List (supports `?search=&category=&page=`) |
| GET | /products/:id | Get single product |
| POST | /products | Create (multipart/form-data, image upload) |
| PUT | /products/:id | Update |
| DELETE | /products/:id | Delete |

### Categories / Suppliers / Customers
Standard REST CRUD, e.g.:
```
GET    /categories
POST   /categories
PUT    /categories/:id
DELETE /categories/:id
```
(same pattern for `/suppliers`, `/customers`)

### Purchases
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /purchases | List purchases |
| POST | /purchases | Create purchase (items[], increments stock) |

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /sales | List sales |
| POST | /sales | Create sale (items[], decrements stock, validates availability) |

### Dashboard & Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /dashboard/summary | Counts + today's sales/purchases + revenue + low stock |
| GET | /reports/sales?from=&to= | Sales report |
| GET | /reports/purchases?from=&to= | Purchase report |
| GET | /reports/stock | Current stock report |
| GET | /reports/profit?from=&to= | Profit report (selling - purchase price × qty sold) |

### Sample Request/Response

```
POST /api/sales
{
  "customer_id": 4,
  "items": [
    { "product_id": 12, "quantity": 2, "price": 250.00 },
    { "product_id": 7,  "quantity": 1, "price": 899.00 }
  ]
}

201 Created
{
  "success": true,
  "sale_id": 88,
  "total_amount": 1399.00
}
```

---

## 8. Frontend Design

- Multi-page app (one HTML file per module) rather than a full SPA framework
  — matches the "learn the fundamentals" goal.
- Each page's JS file (`products.js`, `sales.js`, etc.) handles:
  - Fetching data (`fetch` + `async/await`)
  - Rendering dynamic tables
  - Form validation before submit
  - Search/filter/pagination on the client or via query params
- A shared `auth-check.js` (or inline check) guards pages by verifying a
  valid session/token, redirecting to `login.html` if absent.
- Dashboard page (`dashboard.html`) calls `/api/dashboard/summary` and
  renders the 8 summary cards (Total Products, Categories, Suppliers,
  Customers, Today's Sales, Today's Purchases, Low Stock Products, Revenue).

### 8.1 Research notes

`meyersmanx.com/collections/inventory` blocks automated fetching
(`robots.txt`), so it couldn't be crawled directly — but the brand's public
pages and press coverage give a clear read on the visual world it comes
from: Bruce Meyers' 1964 fiberglass dune buggy, California beach and
off-road culture, hand-built automotive fabrication, VIN/chassis plates,
and analog dashboard instruments (speedometers, fuel gauges). That
"garage-built vehicle" vocabulary — stamped metal plates, gauge dials,
collection grids of physical parts — is the actual idea worth borrowing,
**not** its literal color palette. This system reinterprets that vocabulary
for a data-dense B2B inventory tool instead of copying a consumer brand
skin.

The goal is a look that couldn't be swapped onto a generic SaaS template:
grid-based "collection" browsing for products/stock (like flipping through
a parts catalog) instead of a bare admin table, and a dashboard built
around a **gauge motif** instead of generic stat cards.

### 8.2 Design tokens

**Color** (named, not decorative defaults — deliberately *not* the common
AI palette of warm-cream-+-terracotta or near-black-+-neon):

| Token | Hex | Use |
|-------|-----|-----|
| `--canvas` (Warehouse Putty) | `#EAE4D8` | Page background — warm, chalky, not cream |
| `--ink` (Panel Ink) | `#242620` | Primary text, dark surfaces — warm near-black, not pure black |
| `--primary` (Manifest Blue) | `#35566B` | Primary actions, nav, links — faded denim/ocean, not violet or blue-600 |
| `--accent` (Signal Amber) | `#C8862B` | Warnings, low-stock gauge needle, highlights — mustard/ochre, not terracotta |
| `--success` (Stock Green) | `#4F7942` | In-stock states, positive deltas — avocado/fern, not lime |
| `--danger` (Rust Red) | `#9A3324` | Out-of-stock, delete, destructive actions |
| `--line` (Hairline Sand) | `#C9BFAE` | Borders, dividers, table rules |

No gradients as decoration. The only permitted gradient is a tight,
functional one inside the gauge signature element (see 8.4) — never on
buttons, cards, or backgrounds.

**Typography** (two roles + one utility face, chosen as a pair — not
reached for individually):

- **Display — `Space Grotesk` (700/500):** condensed-feeling, slightly
  mechanical letterforms that read like stamped panel lettering. Used for
  page titles, module headers, and the dashboard gauge labels. Set in
  uppercase with wide tracking for section eyebrows only where a section
  genuinely is a labeled panel (e.g. "PRODUCTS" as a module header) — not
  decoratively everywhere.
- **Body — `Public Sans` (400/500):** neutral, highly legible humanist
  sans for forms, table cells, and body copy. Deliberately not Inter, to
  avoid the default-system-font look.
- **Utility/Data — `IBM Plex Mono` (400/500):** for SKUs, barcodes,
  quantities, prices, and timestamps in tables. Tabular figures make
  columns of numbers actually scannable, and the monospace rhythm nods to
  receipt/label printing, which fits an inventory tool.

**Layout concept**

```
┌───────────────────────────────────────────────────────────┐
│  PEGBOARD NAV (left, 72px icons+label)  │  TOP BAR: search, user, role  │
│  ─────────────────────────              ├───────────────────────────────┤
│  ▣ Dashboard                             │                                │
│  ▣ Products                              │   GAUGE ROW (dashboard only)  │
│  ▣ Categories                            │   ◐ Stock  ◐ Revenue  ◐ Low   │
│  ▣ Suppliers                             │                                │
│  ▣ Customers                             │   COLLECTION GRID              │
│  ▣ Purchases                             │   [img][img][img][img]        │
│  ▣ Sales                                 │   card  card  card  card      │
│  ▣ Reports                               │   (toggle → dense table view) │
└───────────────────────────────────────────────────────────┘
```

The nav reads like a pegboard of labeled tools (a nod to a garage
workshop), not a generic sidebar list. Product/stock pages default to a
**collection grid** — image, name, category tag, price, and a stock pill —
styled like flipping through a parts catalog, with a one-click toggle to a
dense monospace table for staff who just need to scan numbers fast.
Forms (Add/Edit Product, etc.) open as a right-side panel, not a modal
dead-center, so the underlying list stays visible for context.

### 8.3 Signature element

A hand-drawn-style **radial gauge** (SVG, ~90–120° sweep like a fuel or
speedometer needle) is the one bold, repeated motif: it renders "% of
low-stock threshold remaining" on product cards, and drives the three key
dashboard numbers (Stock Health, Today's Revenue, Low Stock Count) instead
of flat stat cards. It's the single "spend your boldness here" element —
everything else on the page stays quiet and disciplined around it.

### 8.4 Anti-patterns (explicitly avoided)

- No warm-cream + terracotta-serif combo, and no near-black + neon-accent
  combo — the two most common "AI-generated" defaults.
- No decorative gradients on buttons, hero sections, or cards.
- No default Inter/system-ui-only type stack.
- No numbered `01 / 02 / 03` markers unless content is a genuine sequence.
- No pill-shaped buttons everywhere "because it looks modern" — radius is
  used deliberately (small radius on data-dense elements, slightly larger
  on cards) and stated as a token, not scattered inconsistently.
- No stock icon packs that don't match the mechanical/gauge visual
  language — a small custom SVG icon set is built instead.

### 8.5 shadcn on a vanilla stack

shadcn/ui is a React + Tailwind component library, and this project is
plain HTML/CSS/JS — so "using shadcn" here means adopting its underlying
**system**, not the React package:

- **CSS variable theming**, the same mechanism shadcn uses
  (`--background`, `--foreground`, `--primary`, `--radius`, etc.), defined
  in `frontend/css/tokens.css` from the palette in 8.2 — never shadcn's
  own default zinc/slate/violet theme.
- **Tailwind CSS (CDN or CLI build)** for utility classes, with
  `tailwind.config.js` `theme.extend` pointing at the same CSS variables,
  so the utility classes and the design tokens stay in sync.
- **shadcn's accessible component patterns** (dialog, dropdown, popover,
  toast, combobox) hand-built in vanilla JS following the same ARIA
  attributes, focus-trap, and keyboard-nav behavior shadcn/Radix ships
  with — implemented in `frontend/js/ui/` as small reusable functions
  (e.g. `openDialog()`, `initDropdown()`), not copy-pasted React code.
- Result: shadcn's accessibility and structural discipline, restyled
  entirely with the tokens above so it doesn't read as a stock shadcn
  theme.

### 8.6 Component notes by module

- **Login (`login.html`):** single centered panel on the putty canvas, no
  illustration filler — the gauge motif appears small, static, as a
  favicon-scale mark next to the product name.
- **Dashboard:** gauge row (8.3) + a compact activity list (recent
  sales/purchases) in the mono utility face.
- **Products / Categories / Suppliers / Customers:** collection grid ↔
  dense table toggle (8.2); Add/Edit as a right-side panel.
- **Purchases / Sales:** a two-column line-item builder — product picker
  on the left, running order summary (styled like a printed receipt, in
  `IBM Plex Mono`) on the right, total updating live as items are added.
- **Reports:** chart area (bar/line, hand-set in the primary/accent
  colors only — no default charting-library rainbow palette) above a
  dense monospace data table with export controls.

---

## 9. Security Considerations

- Passwords hashed with **bcrypt**, never stored in plaintext.
- Use **parameterized queries** (mysql2 placeholders) everywhere — no raw
  string concatenation — to prevent SQL injection.
- Session cookies marked `httpOnly`; if using JWT, store token in memory
  (not `localStorage`) where feasible, or accept the tradeoff for this
  learning project.
- Validate and sanitize all inputs server-side (not just client-side).
- Restrict uploaded file types/size in Multer (images only, e.g. 2MB max).
- Role-based middleware blocks Staff from Admin-only routes (user
  management, deleting other users, etc.).

---

## 10. Reports Logic

| Report | Source | Key Calculation |
|--------|--------|------------------|
| Sales Report | `sales` + `sale_items` | Sum of `quantity * price` grouped by date/product |
| Purchase Report | `purchases` + `purchase_items` | Sum of `quantity * price` grouped by date/supplier |
| Stock Report | `products` | Current `quantity`, flag rows where `quantity <= low_stock_threshold` |
| Profit Report | `sale_items` joined to `products` | `SUM((sale_items.price - products.purchase_price) * sale_items.quantity)` |

---

## 11. Development Roadmap

1. **Project setup** — folder structure, install Node/Express/MySQL deps,
   create `db.js` connection pool, run `inventory.sql`.
2. **Auth** — login page UI, `/auth/login` endpoint, session/JWT, change
   password.
3. **CRUD modules** — Categories → Suppliers → Customers → Products (in
   that order, since Products depends on Categories/Suppliers).
4. **Inventory logic** — Purchases (increment stock), Sales (decrement
   stock, block over-selling), wrap in DB transactions.
5. **Dashboard & Reports** — summary cards, filters, optional CSV/PDF
   export.
6. **Polish** — pagination, search/filter UX, image upload previews,
   basic responsive CSS.

---

## 12. Future Enhancements (Post-v1)

- Export reports to PDF/Excel
- Barcode scanner integration for sales entry
- Multi-branch/warehouse stock tracking
- Email/SMS low-stock alerts
- Audit log of who changed what
