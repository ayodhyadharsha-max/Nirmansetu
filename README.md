# NirmanSetu (निर्माण सेतु)
### On-Demand Construction Materials Marketplace for Ayodhya, Uttar Pradesh, India
*Inspired by HomeRun (home-run.co) • Powered by Hyperlocal Approved Building-Material Suppliers*

---

## 1. Project Overview & Business Model

**NirmanSetu** is an on-demand B2B & B2C construction materials marketplace engineered specifically for the rapid infrastructure, hospitality, temple, and residential construction boom in **Ayodhya Dham, Faizabad, and surrounding districts in Uttar Pradesh, India**.

### Core Business Model: Hyperlocal Partner Fulfillment
- **Zero Owned Warehouses or Inventory**: We do not purchase or store cement bags, steel rods, or bricks in proprietary facilities.
- **Partner Stockist Fulfillment**: We partner with approved, licensed building-material stockists, brick kilns, hardware distributors, and sanitary dealers across Ayodhya Dham (Tedhi Bazar, Ramkot, Naya Ghat) and Faizabad (Civil Lines, Deokali Road, Darshannagar).
- **Rapid Site Logistics**: Orders are routed dynamically to the closest partner merchant with verified stock. Dispatch is coordinated using local 3-wheeler auto loaders, Tata Ace tempos, and tipper trucks with **two-factor OTP dropoff verification**.
- **Transparent Commercials**:
  - Customers receive 100% genuine, batch-verified materials with authentic GST invoices for Input Tax Credit (ITC).
  - Partner merchants receive guaranteed dispatch volume with prompt weekly settlement cycles.
  - Platform retains a nominal marketplace facilitation margin (3.5% to 6%).

---

## 2. Technical Architecture

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14 (App Router)** | High-performance React SSR/SSG with optimized server components and SEO. |
| **Language** | **TypeScript (Strict Mode)** | Full end-to-end type safety across the database, APIs, and UI layers. |
| **Styling & UI** | **Tailwind CSS + Lucide Icons** | Responsive, mobile-first construction ecommerce design inspired by HomeRun. |
| **Database** | **PostgreSQL (through Supabase)** | Single source of truth with relational integrity, JSONB support, and ACID transactions. |
| **Authentication** | **Supabase Auth** | Secure SMS OTP and email authentication for customers, contractors, and suppliers. |
| **Asset Storage** | **Supabase Storage** | S3-compatible storage for product catalogs, brand assets, supplier KYC docs, and quotation PDFs. |
| **Authorization** | **Row Level Security (RLS)** | Database-enforced role-based access policies (Public, Customer, Supplier, Admin). |
| **Input Validation** | **Zod** | Server-side runtime schema validation on every API mutation. |
| **Monetary Standard** | **Pure Integer Paise (BIGINT)** | Strict prohibition of floating-point arithmetic for payments and pricing. |

---

## 3. Database Architecture (16 Required Domains)

All tables feature `gen_random_uuid()` primary keys, foreign key constraints with explicit `ON DELETE` rules, timestamps with auto-updating triggers, and check constraints.

```
                      ┌──────────────────────┐
                      │   auth.users (Auth)  │
                      └──────────┬───────────┘
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │   public.profiles    │
                      └──────┬────────┬──────┘
                             │        │
             ┌───────────────┘        └────────────────┐
             ▼                                         ▼
  ┌──────────────────────┐                  ┌──────────────────────┐
  │  customer_addresses  │                  │      suppliers       │
  └──────────┬───────────┘                  └──────────┬───────────┘
             │                                         │
             ▼                                         ▼
  ┌──────────────────────┐                  ┌──────────────────────┐
  │        orders        │◀───[Assigned]────│  supplier_products   │
  └──────────┬───────────┘                  └──────────┬───────────┘
             │                                         │
             ▼                                         ▼
  ┌──────────────────────┐                  ┌──────────────────────┐
  │     order_items      │                  │   product_variants   │
  └──────────────────────┘                  └──────────┬───────────┘
                                                       │
                                                       ▼
                                            ┌──────────────────────┐
                                            │       products       │
                                            └──────────┬───────────┘
                                                       │
                                                       ▼
                                            ┌──────────────────────┐
                                            │ categories & brands  │
                                            └──────────────────────┘
```

### Table Catalog Summary
1. **`profiles`**: Extends Supabase auth. Users with roles (`customer`, `contractor`, `supplier`, `delivery_partner`, `admin`), phone, GSTIN, and verification flags.
2. **`service_zones`**: Regional clusters (Ayodhya Dham Core, Faizabad Urban Core, Darshannagar Industrial Hub).
3. **`service_pincodes`**: Postal PIN codes (224123, 224001, 224133, 224122, 224229) with delivery SLAs and fee configurations.
4. **`customer_addresses`**: Site delivery addresses, GPS lat/long, truck accessibility, and custom unloading instructions.
5. **`categories`**: Material categories with hierarchical parent-child relationships and standard GST rates (e.g. 28% for cement, 18% for steel).
6. **`brands`**: Verified manufacturers (UltraTech, Tata Tiscon, Dr. Fixit, Supreme, Havells, Asian Paints).
7. **`products`**: Master catalog with technical specifications, HSN codes, and unit of measure.
8. **`product_variants`**: SKUs, diameters (10mm, 12mm, 16mm), pack sizes, weights, and minimum order quantities.
9. **`suppliers`**: Partner dealer profiles with GSTIN, PAN, bank payout info, and KYC verification status.
10. **`supplier_products`**: Direct pricing link between suppliers and variants with cost in paise, selling price in paise, and live stock count.
11. **`coupons`**: Promotional discount rules (percentage or fixed paise) with validity windows and minimum cart thresholds.
12. **`carts` & `cart_items`**: User and guest shopping carts with server-side stock and pricing validation.
13. **`orders` & `order_items`**: Immutable transactional ledger. Stores immutable address snapshot, integer paise totals, delivery OTP hash, and supplier assignment.
14. **`order_status_history`**: Audit trail of every lifecycle status transition (`draft` -> `submitted` -> `confirmed` -> `po_issued` -> `materials_packed` -> `out_for_delivery` -> `delivered`).
15. **`payments` & `payment_events`**: Payment transaction log with idempotency keys, gateway IDs (Razorpay), and raw webhook audit logs.
16. **`bulk_enquiries` & `quotations` & `quotation_items`**: B2B RFQ system for hotels, ashrams, and contractors to receive custom wholesale pricing.
17. **`supplier_purchase_orders` & `supplier_po_items`**: Automated dispatch orders generated for partner merchants upon customer checkout.
18. **`delivery_assignments`**: Vehicle and driver fleet dispatch (Auto, Tata Ace, Tipper) with pickup and delivery OTP checks.
19. **`notifications`**: Multi-channel alert queue (SMS, WhatsApp, In-App, Email).
20. **`admin_settings` & `audit_logs`**: Dynamic platform key-value configuration and immutable administrative action logging.

---

## 4. Monetary Policy: Strict Zero-Float Standard

Payment errors, rounding discrepancies, and tax reconciliation issues in e-commerce are frequently caused by binary floating-point representation (`0.1 + 0.2 = 0.30000000000000004`).

**NirmanSetu enforces pure integer arithmetic:**
- **Database Layer**: Every financial column is stored as `BIGINT` in **integer paise** (₹1.00 = 100 paise; ₹385.00 = 38,500 paise).
- **Backend & Logic**: Calculations use `@/lib/money.ts` helper routines:
  - `formatPaiseToRupees(paise)` converts `38500` -> `₹385`.
  - `calculateTaxPaise(taxablePaise, gstRatePct)` computes GST via basis-point integer math.
  - `calculateOrderTotals()` computes `totalPaise = subtotalPaise + taxPaise + deliveryFeePaise - discountPaise`.
- **Database Constraints**: Table constraints reject any order where `total_paise != subtotal_paise + tax_paise + delivery_fee_paise - discount_paise`.

---

## 5. Security & Row Level Security (RLS)

- **RLS Enabled Globally**: All 27 tables have Row Level Security enabled.
- **Service Role Key Isolation**: The privileged `SUPABASE_SERVICE_ROLE_KEY` is restricted strictly to `src/lib/supabase/admin.ts` and will throw an immediate fatal error if invoked in browser context.
- **Granular Access Control**:
  - Unauthenticated guests can read active categories, brands, products, variants, and service PIN codes.
  - Customers can only read and modify their own addresses, carts, orders, and enquiries.
  - Suppliers can only view and update their assigned inventory and purchase orders.
  - Sensitive platform financials (margins, supplier costs, audit logs) are restricted strictly to administrators.

---

## 6. Directory Structure

```
nirmansetu/
├── .env.example                     # Environment template with security safeguards
├── .gitignore                       # Prevents credential leakage
├── package.json                     # NPM configuration & dependencies
├── tsconfig.json                    # Strict TypeScript configuration with @/* path aliases
├── tailwind.config.ts               # Construction ochre/gold & slate design system
├── next.config.mjs                  # Next.js configuration
├── scripts/
│   ├── seed-database.js             # Database seed execution script
│   └── test-integrity.js            # Automated integrity & schema test suite (11/11 tests)
├── supabase/
│   ├── migrations/                  # Version-controlled SQL migrations
│   │   ├── 20261018000001_core_schema.sql
│   │   ├── 20261018000002_catalog_and_suppliers.sql
│   │   ├── 20261018000003_commerce_orders_payments.sql
│   │   ├── 20261018000004_b2b_rfq_fulfillment.sql
│   │   └── 20261018000005_ops_notifications_admin.sql
│   ├── schema_full.sql              # Consolidated one-click schema setup
│   └── seed.sql                     # Authentic Ayodhya pilot seed data
└── src/
    ├── config/
    │   └── brand.ts                 # Configurable brand identity & Ayodhya hubs
    ├── types/
    │   └── database.ts              # Full TypeScript types for all 16 domains
    ├── lib/
    │   ├── money.ts                 # Integer paise monetary arithmetic utilities
    │   ├── supabase/
    │   │   ├── client.ts            # Browser Supabase client
    │   │   ├── server.ts            # Server-side cookie-aware Supabase client
    │   │   └── admin.ts             # Privileged server-only Supabase client
    │   └── validations/
    │       ├── address.ts           # Address Zod validation
    │       ├── cart.ts              # Cart Zod validation
    │       ├── enquiry.ts           # B2B Bulk RFQ Zod validation
    │       └── order.ts             # Order checkout Zod validation
    ├── components/
    │   ├── Header.tsx               # Brand header, PIN selector, live search & cart trigger
    │   ├── CategoryNav.tsx          # Sub-navigation material categories
    │   ├── HeroBanner.tsx           # Ayodhya value prop & quick SLA checker
    │   ├── ProductCatalog.tsx       # Live materials grid with supplier attribution
    │   ├── MaterialCalculatorModal.tsx # Interactive IS 456 material quantity estimator
    │   ├── BulkEnquiryModal.tsx     # B2B quotation RFQ modal
    │   ├── CartDrawer.tsx           # Sliding cart drawer with site checkout
    │   ├── LocalSupplierTransparency.tsx # Partner model explanation
    │   └── Footer.tsx               # Compliance, regional hubs & legal disclosures
    └── app/
        ├── globals.css              # Tailwind base & custom scrollbar
        ├── layout.tsx               # Root HTML layout & dynamic metadata
        ├── page.tsx                 # Full marketplace homepage
        └── api/
            ├── pincode/check/       # PIN code serviceability endpoint
            ├── cart/                # Cart retrieval and mutation endpoint
            ├── orders/create/       # Atomic order checkout endpoint
            ├── enquiries/           # B2B RFQ quotation submission endpoint
            └── calculator/          # Construction material calculator endpoint
```

---

## 7. Setup & Local Startup Guide

### Step 1: Install Dependencies
```bash
cd /Users/rishabhjaiswal/.gemini/antigravity/scratch/nirmansetu
npm install
```

### Step 2: Configure Environment Variables
Copy the template to your local environment file:
```bash
cp .env.example .env.local
```
Fill in your Supabase project keys:
- `NEXT_PUBLIC_SUPABASE_URL`: Found in Supabase Dashboard -> Project Settings -> API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Found in Supabase Dashboard -> Project Settings -> API
- `SUPABASE_SERVICE_ROLE_KEY`: Found in Supabase Dashboard -> Project Settings -> API (Secret)

To customize the marketplace brand identity, adjust:
```bash
NEXT_PUBLIC_BRAND_NAME="NirmanSetu"
NEXT_PUBLIC_BRAND_TAGLINE="Ayodhya's On-Demand Building Materials Marketplace"
NEXT_PUBLIC_BRAND_CITY="Ayodhya"
NEXT_PUBLIC_BRAND_STATE="Uttar Pradesh"
```

### Step 3: Run Database Migrations
Open your Supabase project dashboard at [supabase.com](https://supabase.com):
1. Navigate to the **SQL Editor**.
2. Open `supabase/schema_full.sql` from this repository.
3. Paste and click **Run**. This creates all tables, enums, triggers, and Row Level Security policies.
4. Open `supabase/seed.sql`, paste and click **Run**. This populates the authentic Ayodhya district service zones (224123, 224001, etc.), categories, verified manufacturer brands, demonstration products, and model partner suppliers.

Alternatively, if using the Supabase CLI:
```bash
supabase db push
```

### Step 4: Execute System Integrity Verification
Run the automated test suite and TypeScript validation:
```bash
npm test
npm run type-check
```

### Step 5: Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 8. Automated Checks & Quality Verification

- **System Test Suite (`npm test`)**: 11 of 11 tests passing.
- **TypeScript Typecheck (`npm run type-check`)**: 0 errors.
- **Next.js Production Build (`npm run build`)**: Compiled successfully. Static pages and dynamic API routes generated.
