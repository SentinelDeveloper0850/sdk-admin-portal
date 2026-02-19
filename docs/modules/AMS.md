# 📦 Asset Management System (AMS)

## Overview

The Asset Management System (AMS) is a governance module within the SDK Admin Portal designed to:

* Capture assets from procurement efforts
* Maintain traceability to supplier invoices
* Track warranty information
* Support insurance, audit, and compliance reporting

Phase 1 focuses strictly on **Asset Intake from Procurement**.

---

## 🗺️ Roadmap

---

### ✅ Phase 1 — Asset Intake (COMPLETED)

#### 1. Supplier Configuration

* Create suppliers
* Store:

  * Name
  * Contact details
  * Default warranty months
* List + manage suppliers
* Scoped uniqueness for invoices per supplier

---

#### 2. Invoice Intake

* Upload invoice PDF (Cloudinary)
* Capture:

  * Supplier
  * Invoice number (supplier-scoped unique)
  * Purchase date
  * Total amount
  * Notes
* Composite uniqueness enforced:

```ts
(supplierId, invoiceNumber)
```

---

#### 3. Bulk Asset Registration

* Register multiple assets against a single invoice
* Capture:

  * Asset name
  * Category
  * Brand
  * Model
  * Serial number (unique)
  * Purchase price
  * Warranty months
  * Warranty expiry date (calculated)
  * Notes
* Auto asset tagging (AMS-000001 etc.)

---

#### 4. Asset Listing

* Search by:

  * Tag
  * Name
  * Serial
  * Brand / Model
* Filters:

  * Category
  * Status
  * Supplier
  * Warranty expiring (30 / 60 / 90 days)
* Shows:

  * Linked supplier
  * Linked invoice
  * PDF access

---

#### 5. Invoice Management

* Invoices index page
* Invoice detail page:

  * Supplier info
  * Invoice metadata
  * Linked assets
  * Asset count
  * PDF access

---

#### 6. Portal Integration

* Integrated under **Management → Asset Management**
* Follows SDK Admin patterns:

  * `PageHeader` (with `isChild`)
  * SweetAlert notifications
  * Dark mode styling support
  * Money formatting via shared util

---

### 🔧 Phase 1.5 — Corrections & Usability (NEXT)

#### Asset Edit Drawer

* GET asset by id
* PATCH asset:

  * Serial number
  * Category
  * Warranty months
  * Price
  * Notes
  * Status

Optional:

* PATCH invoice metadata (notes / total)

Goal:

> Make correction of data entry mistakes frictionless.

---

### 🚀 Phase 2 — Operational Tracking (PLANNED)

#### Asset Assignment

* Assign asset to:

  * Staff member
  * Branch
  * Region
* Track:

  * Assignment date
  * Returned date
  * Current holder

---

#### Asset Lifecycle States

* In Storage
* Assigned
* Under Repair
* Lost
* Stolen
* Disposed

---

#### Warranty & Insurance Enhancements

* Warranty document upload (per asset)
* Asset photo upload
* Expiry alerts
* Insurance pack export (PDF summary)

---

### 📊 Phase 3 — Reporting & Governance (PLANNED)

* Asset valuation report
* Assets per branch
* Assets per staff member
* Warranty expiring dashboard
* Insurance claim export
* Depreciation tracking (optional)

---

### 🧠 Architectural Notes

* Supplier-scoped invoice uniqueness
* Serial numbers enforced unique
* Assets linked to invoices (one-to-many)
* Invoices linked to suppliers (many-to-one)
* Lean queries used for performance in listing routes
* Cloudinary used for document storage

---

### 🎯 Current Status

Phase 1 (Asset Intake): **Operational**

System is stable and usable for:

* Capturing procurement from invoices
* Registering assets with serial traceability
* Supporting insurance & audit needs

Next development priority:

> Asset edit workflow (Drawer + PATCH endpoint)
