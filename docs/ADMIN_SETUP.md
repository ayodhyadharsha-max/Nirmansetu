# NirmanSetu Ayodhya: Administrator & Supplier Security Architecture

This document outlines the security architecture, role-based access control (RBAC), supplier data isolation rules, safe first-admin setup procedures, and audit logging implementations for **NirmanSetu** (Ayodhya, Uttar Pradesh).

---

## 1. Zero Hardcoded Credentials Policy

In accordance with strict security standards:
- **No hardcoded administrative passwords or backdoor master tokens exist** in the repository.
- Administrative privileges are granted strictly via server-side role resolution (`requireAdmin()`) authenticated through cryptographically signed sessions or Supabase Auth JWTs.
- Browser-supplied claims are never trusted for authorization decisions.

---

## 2. Bootstrapping the First Administrator

To promote a designated founding engineer or store operations lead to `admin` without exposing passwords:

### Safe Command-Line Bootstrap
Run the setup utility directly on the server environment with environment variables loaded:

```bash
# Option A: Promote by email address
node scripts/setup-admin.js --email ops-lead@nirmansetu.in

# Option B: Promote by existing authenticated Supabase user UUID
node scripts/setup-admin.js --userId 3fa85f64-5717-4562-b3fc-2c963f66afa6
```

### Database Direct SQL Method
Alternatively, an authorized database administrator with direct connection access to PostgreSQL can execute:

```sql
UPDATE public.user_profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'operations@nirmansetu.in';

-- Record in immutable audit log
INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_user_id, new_values)
VALUES (
  'BOOTSTRAP_ADMIN_SETUP',
  'user_profiles',
  'operations@nirmansetu.in',
  'DBA_DIRECT',
  '{"role": "admin"}'::jsonb
);
```

---

## 3. Strict Server-Side Role Enforcement

All privileged endpoints enforce authorization at the HTTP handler level:

| Role | Permitted Capabilities | Prohibited Boundaries |
| :--- | :--- | :--- |
| **`customer`** | Place orders, view own order history, save jobsite delivery addresses, calculate construction materials. | Cannot view administrative metrics, other customers' data, internal wholesale costs, or supplier purchase orders. Cannot change own role. |
| **`supplier`** | Manage own stock, update wholesale supply rates, confirm lead times, view own assigned POs, update dispatch status. | **Strictly isolated**: Cannot view or modify another supplier's inventory, wholesale rates, or POs. Cannot approve own account or publish public catalog prices directly. |
| **`admin`** | Full visibility across all 6 Ayodhya hubs, verify/reject supplier applications, manage public selling prices, issue supplier POs, configure delivery fees, view security audit trails, export CSVs. | Actions are permanently logged in `public.audit_logs`. |

---

## 4. Supplier Data Isolation Rules

1. **Wholesale Pricing Privacy**: Public selling prices displayed to contractors and retail builders are determined exclusively from approved catalog data. Internal supplier wholesale costs and negotiated margins are never exposed over public APIs or CSV exports.
2. **Horizontal Privilege Isolation (`checkSupplierIsolation`)**:
   - Every supplier request evaluates `checkSupplierIsolation(targetSupplierId, callerSession)`.
   - If a supplier attempts to view or update any resource belonging to another supplier, an immediate `HTTP 403 Forbidden` exception is thrown and logged.
3. **Pending Merchant Gate**:
   - Newly registered suppliers remain in `pending` status.
   - Any attempt by an unverified supplier to publish inventory or fulfill purchase orders is rejected with `HTTP 400 Action blocked`.

---

## 5. Security Audit Trail (`audit_logs`)

All sensitive mutations create an immutable audit record:
- Supplier application submissions and status updates (`verified`, `rejected`, `suspended`).
- Administrative price overrides and PIN code delivery fee adjustments.
- Supplier Purchase Order issuances and fulfillment state transitions (`accepted`, `packed`, `dispatched`, `completed`).
- User role promotions (privilege escalation prevention).

Audit logs record the actor ID, action name, target entity, timestamp, previous state snapshot, and new state payload.
