## Audit Logs – Vision, Design, and Rollout

### 1) Purpose and Goals

- **Accountability**: Provide an immutable, queryable record of who did what and when across the platform.
- **Security**: Detect and investigate unauthorized or risky actions, including failed/forbidden attempts.
- **Compliance (POPI/Privacy)**: Log only what is necessary, protect access to logs, and retain data for a defined period.
- **Operational Insight**: Enable metrics and alerting for critical workflows (imports, reversals, bulk updates, role changes).

### 2) Scope and Coverage

We log all security- or data-impacting actions, both successes and failures:

- **Transactions**
  - EFT imports (bank statement, transaction history)
  - EFT import reversals
  - Easypay imports, sync policy numbers, bulk update policy numbers
- **Policies**
  - Cancellations: create, approve, reject, reverse
  - Reconciliation actions
  - Signup requests: create, approve, reject
- **Claims**
  - Create, status changes, notes, attachments
- **Users and Access**
  - Create, update, role changes, invitations, password reset and reset failures
- **Files and Documents**
  - Uploads (avatars, claim docs), deletes, preview access for restricted docs
- **Configurations and System**
  - System settings changes (e.g., policy configuration, branches), feature flags
- **Societies / Prepaid**
  - Prepaid societies CSV imports
- **HR / Daily Activity / Shifts**
  - Create, update, delete actions

Coverage grows consistently as new features ship. All “bulk” or “reverse” operations are treated as high severity.

### 3) Event Model and Taxonomy

#### 3.1 Event Name Convention

- Format: `domain.action` (e.g., `eft.import.transaction-history`, `eft.reverse`, `policies.cancel.approve`, `easypay.sync-policy-numbers`)
- Keep short, descriptive, and consistent. Prefer nouns for domain and verbs for action.

#### 3.2 Event Schema (stored)

```json
{
  "action": "easypay.import",
  "resourceType": "easypay-import",
  "resourceId": "UUID-OR-PRIMARY-KEY",
  "performedBy": {
    "id": "userId",
    "name": "Full Name",
    "email": "user@example.com",
    "role": "admin|user|..."
  },
  "ip": "203.0.113.5",
  "userAgent": "Mozilla/5.0 ...",
  "details": {
    "transactionsCount": 123,
    "statementMonth": "2025-08"
  },
  "outcome": "success|failure",
  "severity": "low|medium|high",
  "tags": ["import", "destructive"],
  "createdAt": "2025-08-21T12:34:56.000Z"
}
```

Notes:

- `details` holds only minimal, non-sensitive context (counts, identifiers, summary text). Avoid storing raw PII or document contents.
- Use `resourceType`/`resourceId` to target domain resources precisely.

#### 3.3 Severity and Tags

- Severity
  - `high`: destructive changes (reverse, delete), permission failures, auth failures
  - `medium`: bulk updates, role changes, configuration changes
  - `low`: routine status updates
- Tags
  - Free-form classification, e.g. `import`, `destructive`, `sync`, `authorization`, `security`.

### 4) Privacy and POPI Compliance

- **Data minimization**: store actor identifiers, timestamps, and minimal context only. No secrets, no full documents, no sensitive payloads.
- **Access control**: logs accessible only to admins/compliance roles. All access attempts are authenticated and authorized.
- **Retention policy**: configurable retention (e.g., 24–36 months). Logs auto-expire via TTL index or scheduled purge job.
- **Export**: provide admin-only export for lawful/compliance requests.
- **Audit the auditors**: access to audit logs themselves is logged (read events, filtering, and exports).

### 5) Architecture and Implementation

#### 5.1 Storage

- Model: `audit-log` with fields above; indexed on `createdAt`, `action`, `resourceType`, `resourceId`, and `performedBy.email`.
- TTL index on `createdAt` (configurable via env, or scheduled purge if TTL not desired).

#### 5.2 Write Path

- Best-effort logging: failures to log must not fail the business action, but should emit server-side warnings.
- Standard helper collects common context from the request.

```ts
// Helper (server)
type AuditActor = { id?: string; name?: string; email?: string; role?: string };
type AuditContext = {
  actor: AuditActor;
  ip: string | null;
  userAgent: string | null;
  requestId?: string | null; // from X-Request-Id header if present
};

async function getAuditContext(req: Request): Promise<AuditContext> {
  // resolve user via cookie/JWT, derive IP from x-forwarded-for / x-real-ip
}

async function log(
  action: string,
  resourceType: string,
  fields: {
    resourceId?: string;
    details?: Record<string, unknown> | null;
    outcome: "success" | "failure";
    severity?: "low" | "medium" | "high";
    tags?: string[];
  }
) {
  // call createAuditLog({...}) with merged AuditContext
}
```

#### 5.3 Read Path (API)

- `GET /api/system/audit-logs`
  - Query params: `from`, `to`, `action`, `resourceType`, `resourceId`, `email`, `outcome`, `severity`, `tags[]`, `page`, `pageSize`, `sort`.
  - RBAC: admin/compliance only.
  - Response: paginated results, totals, and aggregation summary per action/outcome.

#### 5.4 UI (Admin/Compliance)

- Searchable table with filters for time range, action, user email, resource, outcome, severity, tags.
- Row click opens a **right-side drawer (≥60% width)** with full event JSON and context [[memory:4679085]].
- CSV/JSON export (admin-only), and pivot-like quick aggregates by action/outcome.

### 6) Performance and Reliability

- Indexes: `createdAt` (desc), `action`, `resourceType`, `resourceId`, `performedBy.email`.
- Correlation: include `requestId` header when present to correlate multi-step flows.
- Asynchronicity: if log volume impacts latency, optionally buffer writes through a queue (e.g., durable job or background worker). Keep current path synchronous with try/catch and non-blocking failures.

### 7) Alerting and Monitoring

- Emit alerts for:
  - High-severity failures and all forbidden/unauthorized attempts
  - Spikes in destructive events or repeated failures
- Alert channels: email, Discord, or dashboard widgets.

### 8) Testing Strategy

- Integration tests per critical endpoint: assert a log record is written for success and failure paths.
- Permission tests: unauthorized/forbidden attempts both blocked and logged.
- Read API tests: filtering, pagination, RBAC, export.
- UI tests: filters, drawer, export.

### 9) Rollout Plan

1. Baseline model + helper + indexes (done for initial endpoints).
2. Instrument high-impact endpoints (imports, reverse, bulk updates) (in progress).
3. Add read API and admin UI.
4. Instrument remaining modules (policies, claims, users, configs).
5. Configure retention TTL / purge job and finalize alerting playbooks.
6. Document policy and train admins/compliance users.

### 10) Configuration

- `AUDIT_LOG_RETENTION_DAYS` (default e.g., 1095 = 3 years) – used to compute TTL or purge cadence.
- `ENABLE_AUDIT_ALERTS` and destination configs (Discord webhook, email list).
- `AUDIT_LOG_EXPORT_LIMIT` and rate-limiting controls.

### 11) Event Catalog (Initial Set)

- `eft.import.bank-statement` (high)
- `eft.import.transaction-history` (high)
- `eft.reverse` (high, destructive)
- `easypay.import` (high)
- `easypay.sync-policy-numbers` (medium)
- `easypay.update-policy-numbers` (medium)
- `prepaid-societies.import` (high)
- Upcoming: `policies.cancel.*`, `policies.recon.*`, `policies.signup.*`, `claims.*`, `users.*`, `config.*`

### 12) Open Questions

- Should we enforce write-once (WORM) storage for audits beyond DB (e.g., periodic encrypted append-only archives)?
- Do we need per-tenant partitioning or encryption-at-rest with key rotation for logs?
- Exact retention duration per event category (legal vs operational needs)?

---

This document defines the end-to-end vision for audit logs: a secure, searchable, privacy-conscious audit trail with strong attribution, comprehensive coverage, and operational visibility.
