# NirmanSetu: End-to-End Shopping, Checkout & Payment Architecture

## 1. Overview
NirmanSetu implements an end-to-end, production-grade e-commerce checkout and payment system designed specifically for jobsite delivery in Ayodhya Dham, Uttar Pradesh, India.

All monetary amounts are strictly calculated and stored in **integer paise** ($1\text{ INR} = 100\text{ paise}$). Floating-point arithmetic is prohibited across all client and server operations.

---

## 2. Cart Operations & Server-Side Single Source of Truth
- **Minimum Order Quantities (MOQ)**: Commercial items enforce minimum quantities (e.g., UltraTech PPC cement requires $\ge 5$ bags). Submitting quantities below MOQ or exceeding verified supplier stock is rejected by both client validation and server APIs.
- **Stock & Inventory Validation**: Every cart addition, quantity increment, and checkout submission verifies live local stock (`total_available_stock`) against approved supplier inventory.
- **Guest Cart Persistence**: Unauthenticated users receive a secure session token (`sessionToken`). Line items are stored in persistent client storage and mapped server-side.
- **Post-Login Cart Merging**: When a guest authenticates, `/api/cart/merge` automatically merges guest cart lines into the authenticated account's cart without creating duplicate line items.
- **Server Recalculation**: The browser is never trusted for totals, discounts, or tax figures. `/api/cart` recalculates line subtotals, GST tax, delivery fees, and discounts using trusted database data.

---

## 3. Checkout & Order Submission
- **PIN Code Serviceability**: Validated against Ayodhya postal zones (`224123` Ayodhya Dham, `224001` Faizabad Central, `224133` Darshannagar, `224122` Sohawal, `224229` Bikapur). Unserviceable PIN codes are rejected.
- **Jobsite Address Book**: Customers can select saved delivery addresses or specify a new location with site incharge contact details, landmarks, unloading notes, and truck clearance indicators.
- **Promotional Coupons**: Verified via `/api/cart/coupon`:
  - `AYODHYA10`: 10% discount on orders $\ge ₹5,000$, capped at ₹2,500.
  - `NIRMAN500`: Flat ₹500 off on bulk orders $\ge ₹10,000$.
  - Expired, inactive, or below-threshold coupons are rejected with clear messages.
- **Idempotency Protection**: Every checkout submission transmits a unique `idempotencyKey`. Duplicate submissions (such as double-clicking or network retries) return the existing order without creating duplicate database records or double-charging.
- **Immutable Snapshots**: Order line items (`order_items`) create frozen snapshots of product titles, variant titles, SKUs, HSN codes, commercial units, unit prices, and GST rates at the exact time of purchase. Future catalog changes do not alter historical records.
- **Site Drop-off OTP**: Generates a 4-digit site delivery confirmation PIN. The plain OTP is shown to the customer, while a SHA-256 hash (`delivery_otp_hash`) is stored in the database for driver verification.

---

## 4. Payment Gateway Integration (Razorpay India)

### Test Mode vs. Live Production Mode
The application automatically detects whether genuine Razorpay production credentials are configured:
- **Test Mode (Default without live keys)**:
  - Generates authentic `order_test_...` gateway order IDs.
  - Interactive payment gateway modal enables simulating authorization or user cancellation.
  - Verifies HMAC-SHA256 signatures server-side.
  - `isTestMode: true` is labeled in payment transaction records.
- **Production Mode (With live keys)**:
  - Direct HTTPS API requests to `https://api.razorpay.com/v1/orders` using HTTP Basic Authentication (`RAZORPAY_KEY_ID:RAZORPAY_KEY_SECRET`).
  - Standard Razorpay Checkout JS modal.

### Cryptographic Signature Verification
```ts
const data = `${razorpayOrderId}|${razorpayPaymentId}`;
const expectedSignature = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(data)
  .digest('hex');

// Constant-time comparison to prevent timing attacks
crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expectedSignature, 'utf8'));
```
- Orders are **never** marked as paid until cryptographic verification succeeds.
- Frontend redirects, screenshots, or client success messages are never treated as proof of payment.

### Webhook Handling & Deduplication
- Endpoint: `POST /api/payments/webhook`
- Verified using `X-Razorpay-Signature` against `RAZORPAY_WEBHOOK_SECRET`.
- **Duplicate-Webhook Protection**: Every incoming event ID (`event.id`) is checked against `payment_events`. Duplicate deliveries are acknowledged with HTTP 200 without reprocessing.

### Payment Failure & Non-Duplicate Retry
When a transaction fails or is cancelled by the user:
- The payment transaction status is marked as `failed` with gateway error codes.
- The order remains in `submitted` or `draft` status (`payment_status: 'failed'`).
- The customer can retry payment immediately without duplicating the order or cart items.

---

## 5. Customer Accounts & Workflows
- **Saved Address Book**: Full CRUD via `/api/account/addresses` with PIN code validation and default site selection.
- **Order Details**: Accessible at `/account/orders/[id]` with immutable snapshots, OTP badges, and complete `order_status_history` timeline.
- **Reorder**: 1-click reorder via `/api/orders/[id]/reorder` copies items back into the customer's cart.
- **Cancellation**: Permitted only before dispatch (`draft`, `submitted`, `confirmed`). Once `materials_packed` or `out_for_delivery`, cancellation is rejected.
- **Return Requests**: Permitted within 48 hours of site delivery under Ayodhya quality inspection guarantees.

---

## 6. Environment Variables Template (`.env.local`)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Razorpay Payment Gateway (Test or Live)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_KEY_SECRET="your_key_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# Brand Localization
NEXT_PUBLIC_BRAND_NAME="NirmanSetu"
NEXT_PUBLIC_DEFAULT_PINCODE="224123"
```

*Note: In the development environment, if genuine Razorpay credentials are not provided, live payment acceptance is labeled as **Not Configured (Running in Authenticated Test Mode)**.*
