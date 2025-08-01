# Daily Audit Feature

## 📈 Why the Daily Audit Feature is Needed

At Somdaka Funerals, employees collect client payments using shared speedpoint machines. Each day, they are expected to submit a **batch of their individual receipts**, while the ASSIT system records the official card transactions processed under their name.

Currently, the process of verifying whether employees’ receipts **match the system totals** is done manually by Andy — often requiring hours of comparison, calculations, and note-taking.

---

### ⚠️ The Problem

* **Manual and time-consuming**: Andy spends several hours each week reconciling transactions by hand.
* **Human error**: Risk of missing discrepancies or wrongly flagging employees.
* **No audit trail**: Past issues aren’t easily traceable or reportable.
* **No accountability**: Repeat offenders aren’t automatically tracked or flagged.
* **Lack of visibility**: Management can’t easily see who is consistently out of balance or failing to submit.

---

### ✅ What the Daily Audit Feature Solves

* ⏱ **Saves time** by automating the matching of daily receipts and system balances.
* 🧮 **Calculates discrepancies** instantly and flags `Over`, `Short`, or `Balanced`.
* 💂 **Maintains a daily audit record** per employee per day — with receipt attachments.
* 📊 **Generates weekly summaries**, highlighting issues and trends at a glance.
* 🚩 **Flags repeat offenders** over a rolling 30-day period, allowing proactive follow-up.
* 📁 **Centralizes submission tracking**, making it clear who submitted, who didn’t, and when.

---

### 📈 Business Impact

* ✅ Improved **financial accountability**
* ✅ Stronger **internal controls**
* ✅ Reduced **fraud risk or negligence**
* ✅ Faster **issue resolution**
* ✅ Clear historical audit trail for **management review** or HR action

> In short: The Daily Audit Feature transforms a tedious, manual process into an efficient, transparent, and scalable system — saving hours every week and improving financial integrity across the business.

# Daily Audit Feature Plan

## 📦 Feature: Daily Balance Audit Automation

Automate matching of **employee batch receipts** (speedpoint printouts) with **ASSIT system balances**, calculate discrepancies, and generate daily and weekly audit summaries.

---

## 🧩 Core Entities

### `DailyAudit` (MongoDB Schema)

| Field               | Type      | Description                                               |
| ------------------- | --------- | --------------------------------------------------------- |
| `_id`               | ObjectId  | Unique audit record ID                                    |
| `date`              | Date      | The audit date (YYYY-MM-DD)                               |
| `employeeId`        | ObjectId  | Reference to `User` who uploaded the batch receipts       |
| `batchReceiptTotal` | Number    | Sum of OCR-extracted totals from receipt image            |
| `systemBalance`     | Number    | ASSIT balance for the employee for this day               |
| `discrepancy`       | Number    | batchReceiptTotal - systemBalance                         |
| `status`            | String    | One of: `Nothing to Submit`, `Balanced`, `Short`, `Over`  |
| `submissionStatus`  | String    | One of: `Submitted`, `Not Submitted`, `Nothing to Submit` |
| `notes`             | String    | Optional notes from Andy or reviewer                      |
| `attachments`       | \[String] | Cloudinary URLs of uploaded receipts                      |
| `createdAt`         | Date      | Auto-generated                                            |
| `updatedAt`         | Date      | Auto-generated                                            |

---

## 📤 Receipt Upload Flow

### Route: `POST /api/audit/upload-receipts`

* **Auth Required**: Yes (Employee)
* **Inputs**:

  * `file`: Image file (jpg/png/pdf) containing receipts
  * `date`: Date the receipts are for
* **Logic**:

  1. Store file in Cloudinary
  2. Run OCR on uploaded image

     * Ignore `Settlement Summary`
     * Extract all `Total` amounts
  3. Sum totals → `batchReceiptTotal`
  4. Create or update `DailyAudit` entry for `(employeeId, date)`

     * Store attachment URL
     * Store total
     * Set `submissionStatus: Submitted`
  5. Run auto-match if `systemBalance` exists:

     * Compute `discrepancy`
     * Set `status`

---

## 📥 System Balance Upload (Andy)

### Route: `POST /api/audit/upload-system-balance`

* **Auth Required**: Yes (Andy)
* **Inputs**:

  * `.xls` file from ASSIT for the day
* **Logic**:

  1. Parse file to extract: `{ employeeName, balance }` per row
  2. Match against users by name
  3. For each:

     * Find or create `DailyAudit` for `(userId, date)`
     * Store `systemBalance`
     * Compute discrepancy if batch receipts already exist
     * Set `status`

---

## 🧾 Status Computation Rules

```ts
if (!batchReceiptTotal && !systemBalance) {
  status = "Nothing to Submit";
  submissionStatus = "Nothing to Submit";
} else if (batchReceiptTotal && !systemBalance) {
  status = "Awaiting System Balance";
  submissionStatus = "Submitted";
} else if (!batchReceiptTotal && systemBalance) {
  status = "Missing Batch Receipt";
  submissionStatus = "Not Submitted";
} else {
  discrepancy = batchReceiptTotal - systemBalance;
  if (discrepancy === 0) status = "Balanced";
  else if (discrepancy > 0) status = "Over";
  else status = "Short";
}
```

---

## 📊 Weekly Summary

### Route: `GET /api/audit/summary?week=2025-07-21`

* **Auth Required**: Yes (Andy/Admin)
* **Output**:

  * `totalStaffAudited`
  * `fullyBalanced`
  * `discrepanciesFound`
  * `nonSubmissions`
  * `highRiskDiscrepancies` (|discrepancy| > R2000)
  * `repeatOffenders` (≥ 3 discrepancies or non-submissions in past 30 days)

---

## 🔧 Configuration

```ts
{
  HIGH_RISK_THRESHOLD: 2000,
  REPEAT_OFFENDER_WINDOW_DAYS: 30
}
```

---

## 🖼️ UI Integration

* Integrate in SDK Admin Portal
* **Upload Receipts Drawer**: For employees
* **Reconciliation Table**: For Andy (with editable fields)
* **Weekly Summary Page**: Table + Matching Summary + Notes section
