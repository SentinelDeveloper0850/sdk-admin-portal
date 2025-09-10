# Daily Audit Feature

## 📈 Why the Daily Audit Feature is Needed

At Somdaka Funerals, employees collect client payments using shared speedpoint machines. Each day, they are expected to submit a **batch of their individual receipts**, while the ASSIT system records the official card transactions processed under their name.

Currently, the process of verifying whether employees' receipts **match the system totals** is done manually by Andy — often requiring hours of comparison, calculations, and note-taking.

---

### ⚠️ The Problem

- **Manual and time-consuming**: Andy spends several hours each week reconciling transactions by hand.
- **Human error**: Risk of missing discrepancies or wrongly flagging employees.
- **No audit trail**: Past issues aren't easily traceable or reportable.
- **No accountability**: Repeat offenders aren't automatically tracked or flagged.
- **Lack of visibility**: Management can't easily see who is consistently out of balance or failing to submit.

---

### ✅ What the Daily Audit Feature Solves

- ⏱ **Saves time** by automating the matching of daily receipts and system balances.
- 🧮 **Calculates discrepancies** instantly and flags `Over`, `Short`, or `Balanced`.
- 💂 **Maintains a daily audit record** per employee per day — with receipt attachments.
- 📊 **Generates weekly summaries**, highlighting issues and trends at a glance.
- 🚩 **Flags repeat offenders** over a rolling 30-day period, allowing proactive follow-up.
- 📁 **Centralizes submission tracking**, making it clear who submitted, who didn't, and when.

---

### 📈 Business Impact

- ✅ Improved **financial accountability**
- ✅ Stronger **internal controls**
- ✅ Reduced **fraud risk or negligence**
- ✅ Faster **issue resolution**
- ✅ Clear historical audit trail for **management review** or HR action

> In short: The Daily Audit Feature transforms a tedious, manual process into an efficient, transparent, and scalable system — saving hours every week and improving financial integrity across the business.

---

## 📦 Feature: Daily Balance Audit Automation

Automate matching of **employee batch receipts** (speedpoint printouts) with **ASSIT system balances**, calculate discrepancies, and generate daily and weekly audit summaries.

---

## 🧩 Core Entities

### `DailyAudit` (MongoDB Schema)

| Field               | Type     | Description                                               |
| ------------------- | -------- | --------------------------------------------------------- |
| `_id`               | ObjectId | Unique audit record ID                                    |
| `date`              | Date     | The audit date (YYYY-MM-DD)                               |
| `employeeId`        | ObjectId | Reference to `User` who uploaded the batch receipts       |
| `batchReceiptTotal` | Number   | Sum of OCR-extracted totals from receipt image            |
| `systemBalance`     | Number   | ASSIT balance for the employee for this day               |
| `discrepancy`       | Number   | batchReceiptTotal - systemBalance                         |
| `status`            | String   | One of: `Nothing to Submit`, `Balanced`, `Short`, `Over`  |
| `submissionStatus`  | String   | One of: `Submitted`, `Not Submitted`, `Nothing to Submit` |
| `notes`             | String   | Optional notes from Andy or reviewer                      |
| `attachments`       | [String] | Cloudinary URLs of uploaded receipts                      |
| `reviewedBy`        | ObjectId | Who reviewed the audit (Andy/Admin)                       |
| `reviewedAt`        | Date     | When it was reviewed                                      |
| `resolutionNotes`   | String   | How discrepancy was resolved                              |
| `isResolved`        | Boolean  | Whether issue was addressed                               |
| `riskLevel`         | String   | "low", "medium", "high" based on discrepancy amount       |
| `createdAt`         | Date     | Auto-generated                                            |
| `updatedAt`         | Date     | Auto-generated                                            |

---

## 📤 Receipt Upload Flow

### Route: `POST /api/audit/upload-receipts`

- **Auth Required**: Yes (Employee)
- **Inputs**:

  - `file`: Image file (jpg/png/pdf) containing receipts
  - `date`: Date the receipts are for

- **Enhanced Logic**:
  1. **Check submission timing** against daily cutoff
  2. Store file in Cloudinary
  3. Run OCR on uploaded image
     - Ignore `Settlement Summary`
     - Extract all `Total` amounts
  4. **Present extracted totals to employee for confirmation**
  5. **Allow manual correction if OCR is wrong**
  6. Store both OCR result and final confirmed total
  7. Create or update `DailyAudit` entry for `(employeeId, date)`
     - Store attachment URL
     - Store confirmed total
     - Set `submissionStatus` based on timing check
     - Set `submittedAt` timestamp
  8. Run auto-match if `systemBalance` exists:
     - Compute `discrepancy`
     - Set `status` and `riskLevel` using helper function

### Route: `GET /api/audit/my-audits`

- **Auth Required**: Yes (Employee)
- **Purpose**: Allow employees to view their audit history and submission status

---

## 📥 System Balance Upload (Andy)

### Route: `POST /api/audit/upload-system-balance`

- **Auth Required**: Yes (Andy)
- **Inputs**:

  - `.xls` file from ASSIT for the day

- **Enhanced Logic**:
  1. Parse file to extract: `{ employeeName, balance }` per row
  2. **Use employee IDs instead of names when possible**
  3. **Fallback to fuzzy name matching with manual confirmation**
  4. For each:
     - Find or create `DailyAudit` for `(userId, date)`
     - Store `systemBalance`
     - Compute discrepancy if batch receipts already exist
     - Set `status` and `riskLevel` using `getRiskLevel()` helper
     - **Flag late submissions** for review

---

## 🔧 Audit Management APIs

### Route: `PUT /api/audit/:id/resolve`

- **Auth Required**: Yes (Andy/Admin)
- **Purpose**: Mark discrepancy as resolved with notes

### Route: `POST /api/audit/:id/notes`

- **Auth Required**: Yes (Andy/Admin)
- **Purpose**: Add review notes to audit record

### Route: `GET /api/audit/analytics?period=monthly`

- **Auth Required**: Yes (Andy/Admin)
- **Purpose**: Management reporting and trend analysis

---

## 🧾 Status Computation Rules

```typescript
if (!batchReceiptTotal && !systemBalance) {
  status = "Nothing to Submit";
  submissionStatus = "Nothing to Submit";
} else if (batchReceiptTotal && !systemBalance) {
  status = "Awaiting System Balance";
  submissionStatus = submissionStatus; // Keep existing status (on-time/late)
} else if (!batchReceiptTotal && systemBalance) {
  status = "Missing Batch Receipt";
  submissionStatus = "Not Submitted";
} else {
  discrepancy = batchReceiptTotal - systemBalance;
  if (discrepancy === 0) {
    status = "Balanced";
  } else if (discrepancy > 0) {
    status = "Over";
  } else {
    status = "Short";
  }

  // Use helper function for risk level
  riskLevel = getRiskLevel(discrepancy, HIGH_RISK_THRESHOLD);
}
```

---

## 📊 Weekly Summary

### Route: `GET /api/audit/summary?week=2025-07-21`

- **Auth Required**: Yes (Andy/Admin)
- **Output**:
  - `totalStaffAudited`
  - `fullyBalanced`
  - `discrepanciesFound`
  - `nonSubmissions`
  - `highRiskDiscrepancies` (|discrepancy| > R2000)
  - `repeatOffenders` (≥ 3 discrepancies or non-submissions in past 30 days)
  - **`lateSubmissions`** (submissions after cutoff)
  - **`onTimeSubmissions`** (submissions before cutoff)

---

## 📋 Configuration

```typescript
{
  HIGH_RISK_THRESHOLD: 2000,
  REPEAT_OFFENDER_WINDOW_DAYS: 30,
  DATA_RETENTION_DAYS: 2555, // 7 years for audit compliance
  OCR_CONFIDENCE_THRESHOLD: 0.8,
  DAILY_SUBMISSION_CUTOFF_HOUR: 20, // 8:00 PM (24-hour format)
  DAILY_SUBMISSION_CUTOFF_MINUTE: 0,
  TIMEZONE: 'Africa/Johannesburg', // SAST timezone
  LATE_SUBMISSION_GRACE_PERIOD_MINUTES: 30 // Grace period after cutoff
}
```

### Helper Functions

```typescript
/**
 * Calculate risk level based on discrepancy amount
 * @param discrepancy - The difference between batch total and system balance
 * @param highRiskThreshold - Configurable threshold for high risk
 * @returns Risk level: 'low', 'medium', or 'high'
 */
function getRiskLevel(
  discrepancy: number,
  highRiskThreshold: number = 2000
): "low" | "medium" | "high" {
  const absDiscrepancy = Math.abs(discrepancy);

  if (absDiscrepancy === 0) return "low";
  if (absDiscrepancy > highRiskThreshold) return "high";
  return "medium";
}

/**
 * Check if submission is on time based on daily cutoff
 * @param submissionTime - When the receipt was submitted
 * @param auditDate - The date the receipts are for
 * @param cutoffHour - Daily cutoff hour (24-hour format)
 * @param cutoffMinute - Daily cutoff minute
 * @param timezone - Timezone for date calculations
 * @param gracePeriodMinutes - Grace period after cutoff
 * @returns Object with isOnTime and submissionStatus
 */
function checkSubmissionTiming(
  submissionTime: Date,
  auditDate: Date,
  cutoffHour: number = 20,
  cutoffMinute: number = 0,
  timezone: string = "Africa/Johannesburg",
  gracePeriodMinutes: number = 30
): { isOnTime: boolean; submissionStatus: string; cutoffTime: Date } {
  // Create cutoff time for the audit date
  const cutoffTime = new Date(auditDate);
  cutoffTime.setHours(cutoffHour, cutoffMinute, 0, 0);

  // Add grace period
  const gracePeriodEnd = new Date(cutoffTime);
  gracePeriodEnd.setMinutes(gracePeriodEnd.getMinutes() + gracePeriodMinutes);

  const isOnTime = submissionTime <= gracePeriodEnd;

  let submissionStatus: string;
  if (submissionTime <= cutoffTime) {
    submissionStatus = "Submitted";
  } else if (submissionTime <= gracePeriodEnd) {
    submissionStatus = "Submitted Late (Grace Period)";
  } else {
    submissionStatus = "Submitted Late";
  }

  return { isOnTime, submissionStatus, cutoffTime };
}
```

---

## 🚨 Error Handling & Edge Cases

### OCR Failures

- **Low confidence OCR results**: Flag for manual review
- **Failed OCR**: Allow manual entry with supervisor approval
- **Multiple receipts in one image**: Extract all totals, sum them

### Data Validation

- **Wrong date submissions**: Allow date correction with audit trail
- **Duplicate submissions**: Prevent or flag for review
- **ASSIT format changes**: Version control for file parsers
- **Late submissions**: Flag for review but allow processing

### Security & Permissions

- **Role-based access**: Employees can only see their own audits
- **Audit trail**: Track all changes with user and timestamp
- **Data retention**: Automatic archival after 7 years

---

## 📋 Notifications & Alerts

### Real-time Notifications

- **Email alerts** for high-risk discrepancies (>R2000)
- **Dashboard notifications** for missing submissions
- **Weekly summary reports** sent to management
- **Late submission alerts** to employees and supervisors

### Escalation Rules

- **3+ discrepancies in 30 days**: Automatic flag for HR review
- **High-risk amounts**: Immediate notification to management
- **Missing submissions**: Daily reminders to employees
- **Frequent late submissions**: Escalation to management after 3 late submissions in a week

---

## 🖼️ UI Integration

### User Interface Components

- **Upload Receipts Drawer**: Right drawer with drag-and-drop area for employees
- **Audit Review Drawer**: Right drawer with 60%+ width for detailed view (Andy)
- **Weekly Summary Page**: Full page with expandable sections and analytics
- **Reconciliation Table**: Editable fields with inline editing capabilities
- **Daily Cutoff Timer**: Countdown timer showing time remaining for submission

### User Experience Considerations

- **Mobile-friendly**: Responsive design for field employees
- **Offline capability**: Queue uploads when connection is poor
- **Bulk operations**: Allow Andy to resolve multiple audits at once
- **Cutoff awareness**: Clear display of daily submission deadline
- **Late submission warnings**: Visual indicators for late submissions

---

## 📋 Implementation Phases

### Phase 1: Core Functionality (Weeks 1-4)

- Basic upload and matching functionality
- Simple OCR integration
- Core audit record creation
- Basic status computation
- **Daily cutoff enforcement**

### Phase 2: Enhanced OCR & Validation (Weeks 5-8)

- OCR confirmation workflow
- Manual override capabilities
- Enhanced error handling
- Employee audit history
- **Helper functions implementation**

### Phase 3: Advanced Reporting (Weeks 9-12)

- Weekly summaries and analytics
- Management reporting
- Trend analysis
- Repeat offender tracking
- **Late submission reporting**

### Phase 4: Automation & Notifications (Weeks 13-16)

- Automated notifications
- Email alerts and escalations
- Dashboard integrations
- Performance optimizations
- **Cutoff reminder notifications**

---

## 🎯 Success Metrics

### Time Savings

- **Target**: Reduce manual reconciliation time by 80%
- **Measurement**: Hours saved per week for Andy

### Accuracy Improvements

- **Target**: 95%+ audit accuracy rate
- **Measurement**: Discrepancies caught vs. manual process

### User Adoption

- **Target**: 90%+ employee submission rate
- **Measurement**: Daily submission compliance
- **Target**: 95%+ on-time submission rate
- **Measurement**: Submissions before daily cutoff

### Risk Reduction

- **Target**: Zero high-risk discrepancies going unnoticed
- **Measurement**: Time to detection of discrepancies

---

## ✅ Conclusion

This Daily Audit Feature addresses a critical business need with a comprehensive, scalable solution. The phased implementation approach ensures steady progress while managing risk. The enhanced data model, robust error handling, configurable daily cutoff, and user-friendly interface will transform the current manual process into an efficient, transparent audit system.

**Key Enhancements Added**:

- **Configurable daily cutoff** (8:00 PM default) with 30-minute grace period
- **Reusable helper functions** for risk level calculation and submission timing
- **Enhanced submission status tracking** (on-time, late, grace period)
- **Late submission reporting** and escalation rules
- **Cutoff awareness UI** with countdown timers

**Next Steps**: Begin Phase 1 implementation with focus on core functionality, basic OCR integration, and daily cutoff enforcement.
