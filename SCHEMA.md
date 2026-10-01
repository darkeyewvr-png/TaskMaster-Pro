# Multi-Tenant Field Operations SaaS Architecture & Schema Definition

## 1. Architecture Overview
This multi-tenant SaaS platform provides strict logical tenant isolation at the database layer (Row Level Security design). Every persistent document in Firestore belongs to an explicit `companyId`.

### Key Tenant Isolation Rules:
1. **Tenant Identification**: Every user document in `users/{userId}` contains a verified `companyId` and `role` (`super_admin` | `technician`).
2. **Logical Partitioning**: Every collection (`jobs`, `clients`, `billing`, `complianceReports`, `stockTakes`, `shiftLogs`) requires an indexed `companyId` field.
3. **Cross-Tenant Prevention**: Users belonging to Company A are blocked by Firestore Security Rules and Server-Side Middleware from reading, querying, creating, modifying, or deleting records belonging to Company B.
4. **Role-Based Access Control (RBAC)**:
   - **Super Admin / Business Owner**: Full read/write access to company settings, subscription billing, all staff accounts, all clients, all invoices, pricing, and all jobs.
   - **Field Technician**: Restricted access to jobs assigned to their UID/team, client contact details for those jobs, inspection checklists, site photo uploads, and digital signature capture. They cannot alter subscription tiers, view company financial reports, or delete historical invoices.

---

## 2. Entity Schema Definitions

### `companies` Collection (`/companies/{companyId}`)
```json
{
  "id": "comp_basson_001",
  "name": "Basson Elektries (PTY) LTD",
  "slug": "basson-elektries",
  "registrationNumber": "2024/048561/07",
  "vatNumber": "4520288192",
  "phone": "063 086 5287",
  "email": "gerrit@bassonelektries.co.za",
  "address": "14 Industrial Park, Brackenfell, Cape Town",
  "website": "https://bassonelektries.co.za",
  "logoUrl": "/assets/basson-logo.png",
  "brandColor": "#2563eb",
  "accentColor": "#f59e0b",
  "currency": "ZAR",
  "currencySymbol": "R",
  "taxRate": 15.0,
  "subscriptionTier": "pro",
  "subscriptionStatus": "active",
  "trialEndsAt": "2026-11-01T00:00:00.000Z",
  "nextBillingDate": "2026-11-01T00:00:00.000Z",
  "billingGateway": "payfast",
  "planAmount": 1299.00,
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

### `users` Collection (`/users/{uid}`)
```json
{
  "uid": "usr_wayne_01",
  "companyId": "comp_basson_001",
  "email": "wayne@bassonelektries.co.za",
  "name": "Wayne van Rooyen",
  "role": "super_admin",
  "specialty": "Master Electrician & Field Operations",
  "phone": "082 555 0192",
  "isWorking": true,
  "lastShiftToggle": "2026-10-01T07:30:00.000Z",
  "avatarColor": "#2563eb",
  "hourlyRate": 450.00
}
```

### `jobs` Collection (`/jobs/{jobId}`)
```json
{
  "id": "job_94821",
  "companyId": "comp_basson_001",
  "jobNumber": "JOB-2026-089",
  "clientId": "Protea Hotel Waterfront",
  "phone": "021 555 9182",
  "email": "maintenance@proteawaterfront.co.za",
  "location": "Portswood Rd, V&A Waterfront, Cape Town",
  "category": "DB Board Rewiring & Upgrade",
  "priority": "HIGH",
  "status": "WORKING",
  "assignedTechUid": "usr_wayne_01",
  "technician": "Wayne van Rooyen",
  "startDate": "2026-10-01T08:00:00.000Z",
  "endDate": "2026-10-01T17:00:00.000Z",
  "notes": "Emergency main switch tripping intermittently under load.",
  "description": "Inspected main distribution board. Found loose neutral bus connection and unbalanced phase draw.",
  "checklist": [
    { "id": "1", "label": "Main Earth Leakage Trip Test (<30mA at 300ms)", "completed": true },
    { "id": "2", "label": "Neutral & Earth Continuity & Bonding Verified", "completed": true }
  ],
  "photos": [
    { "id": "p1", "url": "data:image/jpeg;base64,...", "label": "DB Board Before", "timestamp": "2026-10-01T08:15:00Z" }
  ],
  "complianceReportId": "coc_10928",
  "quoteId": "quote_5521",
  "invoiceId": "inv_8831",
  "createdAt": "2026-10-01T07:45:00.000Z"
}
```

### `complianceReports` Collection (`/complianceReports/{reportId}`)
```json
{
  "id": "coc_10928",
  "companyId": "comp_basson_001",
  "jobId": "job_94821",
  "clientId": "Protea Hotel Waterfront",
  "reportNumber": "COC-2026-0042",
  "type": "COC_ELECTRICAL",
  "status": "PASSED",
  "inspectorName": "Wayne van Rooyen",
  "inspectorRegNumber": "EIR-ZA-48291",
  "inspectionDate": "2026-10-01T12:30:00.000Z",
  "siteAddress": "Portswood Rd, V&A Waterfront, Cape Town",
  "earthLoopImpedance": "0.24 Ω",
  "neutralEarthLoop": "0.08 Ω",
  "insulationResistance": "120 MΩ",
  "mainBreakerRating": "100A Triple Pole",
  "earthLeakageTripCurrent": "22mA",
  "earthLeakageTripTime": "24ms",
  "surgeProtectionStatus": "INSTALLED",
  "voltageLtoN": "234V",
  "checklist": [
    { "id": "c1", "code": "SEC-1", "category": "Earthing", "item": "Main earthing conductor correctly bonded", "status": "PASS" },
    { "id": "c2", "code": "SEC-2", "category": "Distribution Board", "item": "Labeling and circuit identification complete", "status": "PASS" }
  ],
  "photos": [
    { "id": "ph1", "url": "data:...", "caption": "Earth electrode test spike", "tag": "Earth Spike", "timestamp": "2026-10-01T12:00:00Z" }
  ],
  "inspectorSignature": { "signerName": "Wayne van Rooyen", "signedAt": "2026-10-01T13:00:00Z" },
  "clientSignature": { "signerName": "David Smith (Estate Mgr)", "signedAt": "2026-10-01T13:15:00Z" }
}
```

### `billing` Collection (`/billing/{docId}`)
```json
{
  "id": "inv_8831",
  "companyId": "comp_basson_001",
  "type": "INVOICE",
  "documentNumber": "INV-2026-0182",
  "invoiceNumber": "INV-2026-0182",
  "jobId": "job_94821",
  "clientId": "Protea Hotel Waterfront",
  "date": "2026-10-01T14:00:00.000Z",
  "materials": [
    { "description": "Schneider 63A 3P Breaker", "qty": 1, "unitPrice": 1450.00, "amount": 1450.00 },
    { "description": "Type 2 Surge Arrester 40kA", "qty": 1, "unitPrice": 1850.00, "amount": 1850.00 }
  ],
  "labour": [
    { "description": "Certified Master Electrician Diagnostics & Rewire", "hours": 4.5, "rate": 550.00, "amount": 2475.00 }
  ],
  "subtotal": 5775.00,
  "discount": 0.00,
  "includeVat": true,
  "vatRate": 15.0,
  "vatAmount": 866.25,
  "total": 6641.25,
  "status": "UNPAID",
  "isPaid": false,
  "paymentTerms": "7 Days from Invoice Date"
}
```

---

## 3. Subscription & Billing Gateways
- **PayFast (South Africa)**: Integration uses Merchant ID, Merchant Key, Passphrase hash generation, and IPN server-to-server webhook verification. Recurring monthly tokenization for SaaS plans.
- **Stripe (Global)**: Standard Checkout Sessions with recurring monthly prices (`price_starter`, `price_pro`, `price_enterprise`), webhooks on `invoice.paid` and `customer.subscription.deleted`.
- **Access Locking Logic**: When a tenant's subscription status transitions to `past_due` or `cancelled`, the API and UI restrict job creation and compliance certificate generation while keeping read-only archives accessible.
