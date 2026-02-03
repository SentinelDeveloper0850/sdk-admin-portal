# SDK Admin Portal

An internal administration portal for Somdaka Funeral Services, built with **Next.js 15**, **React 19 RC**, **TypeScript**, and **MongoDB**. It provides back‑office tooling for policies, claims, cash‑ups, daily activity, shifts, societies, announcements, and more.

## Purpose & domain overview

The SDK Admin Portal is the operations hub for Somdaka’s funeral insurance and services business. It is designed to:

- Manage the **full policy lifecycle** – from online sign‑ups and underwriting to cancellation, claims, and reconciliation.
- Coordinate **branch and staff operations** – shifts, daily activity compliance, cash‑ups, and daily audits per employee and branch.
- Track **financial flows** – bank statement imports, Easypay/EFT transactions, allocations to policies, and exception handling.
- Provide **communication and oversight** – news/announcements, notifications, tasks, and (future) audit logs for sensitive actions.
- Support **field staff (drivers)** via a dedicated Driver App, with secure PIN-based authentication and device trust, without exposing full portal user accounts.

Most business entities are represented as Mongoose models in:

- `src/app/models/hr/**` – people and internal operations (users, employees, shifts, daily activity, etc.).
- `src/app/models/scheme/**` – policy, claim, transaction, and society data.
- `src/app/models/system/**` – announcements, tasks, branches, configurations, and reminders.

Modules in `src/app/(protected)/*` compose these models into end‑user workflows and UI screens.

---

## Tech stack

- Next.js 15 App Router (`src/app`)
- React 19 RC + TypeScript
- MongoDB via Mongoose
- UI: NextUI + Ant Design + Tailwind CSS
- Auth: custom JWT (HTTP‑only cookie `auth-token`)
- Email: Resend + Handlebars templates

---

## Getting started

### 1. Install dependencies

Because the project uses Next 15, some peer dependencies have not yet caught up. Install with legacy peer resolution:

```bash
npm install --legacy-peer-deps
```

### 2. Configure environment

Create a `.env.local` file at the project root with (at minimum):

```env
# Database
MONGODB_ATLAS_URI=your-mongodb-connection-string

# Auth / JWT
JWT_SECRET=your-long-random-secret

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# Cloudinary (file uploads, images)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_KEY=your-cloudinary-api-key
CLOUDINARY_SECRET=your-cloudinary-api-secret

# Realtime presence (Socket.IO client)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# Cron / scheduled jobs (optional but recommended)
CRON_SECRET=your-cron-secret
```

Other feature‑specific docs under `docs/` (e.g. `EMAIL_SERVICE_DOCUMENTATION.md`, `DAILY_ACTIVITY_REMINDERS_SETUP.md`, `PRESENCE_FEATURE.md`) describe additional configuration in more detail.

### 3. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Scripts

Defined in `package.json`:

- `npm run dev` – start the Next.js dev server.
- `npm run build` – create a production build.
- `npm run start` – run the built app in production mode.
- `npm run lint` – run ESLint (note: many strict rules are disabled, and the build ignores lint/TS errors).
- `npm run format` – format `src/` with Prettier + Tailwind/import‑sorting plugins.

There is currently **no test script configured**; if you add Jest/Vitest or another test runner, update this section accordingly.

---

## Application modules & features

This portal is organized around major operational domains. Each module combines specific pages, API routes, and models to solve a concrete operational problem.

### Dashboard & system status

- **Purpose:** Give operations staff and managers a high‑level view of current workload, compliance, and system health.
- **UI:** `src/app/(protected)/dashboard/page.tsx`, `src/app/(protected)/status/page.tsx`.
- **APIs:** `src/app/api/dashboard/route.ts`, `src/app/api/status/route.ts`.
- **Model relationships:** Aggregates data from multiple domains (policies, claims, daily activity, tasks, transactions) via server actions and model queries rather than a single dedicated model.

### Authentication & user management (HR core)

- **Purpose:** Authenticate users, manage access, and tie system users to HR records.
- **UI:** `src/app/auth/*`, `src/app/(protected)/users/*`, `src/app/(protected)/account/*`.
- **APIs:** `src/app/api/auth/*`, `src/app/api/users/*`, `src/app/api/profile/route.ts`.
- **Key models:**
  - `src/app/models/hr/user.schema.ts` (`UserModel` / `IUser`) – primary identity record, with roles, preferences, presence (`lastSeenAt`), and optional link to an `Employee`.
  - `src/app/models/hr/employee.schema.ts` (not shown above, but used via `employee` ref) – richer HR info when needed.
- **Relationships:**
  - Many other models reference users via IDs (e.g. `submittedBy` on claims, `createdByUserId` / `assigneeUserId` on tasks, `authorId` on announcements, `createdBy` / `updatedBy` on branches).
  - Auth flows issue JWTs (via `src/services/auth.service.ts` and `src/lib/auth.ts`) that are consumed by `middleware.ts`, presence, and notifications.

### Drivers and Driver App Support (field operations)

- **Drivers vs Users:** drivers authenticate separately from portal users using PIN-based auth and trusted devices. They are modeled as staff-linked operational entities, not system users.
- **Admin management:** drivers are created and managed in the Admin Portal and linked to existing staff members.

## Related applications

- **Driver App (Expo / React Native)** – mobile app for field staff (drivers), authenticating against `/api/driverapp/*` endpoints and consuming a restricted operational API surface.

### Policies & signup / cancellation workflows

- **Purpose:** Represent insurance policies and manage how they are created, updated, cancelled, and reported on.
- **UI:**
  - Viewing & search: `src/app/(protected)/policies/view/*`, `src/app/(protected)/reports/policies/page.tsx`.
  - Intake: `src/app/(protected)/policies/signup-requests/*` (policy applications).
  - Cancellation & reconciliation: `src/app/(protected)/policies/cancellation-requests/page.tsx`, `src/app/(protected)/policies/recon/page.tsx`.
- **APIs:** `src/app/api/policies/**` plus related transaction routes under `src/app/api/transactions/easypay/**` and `src/app/api/transactions/eft/**`.
- **Key models:**
  - `PolicyModel` – `src/app/models/scheme/policy.schema.ts` is the canonical policy record for ASSIT‑backed schemes.
  - `PolicySignUpModel` – `src/app/models/scheme/policy-signup-request.schema.ts` stores structured intake applications, dependants, uploaded docs, and workflow state (`currentStatus`, `statusHistory`, internal notes, escalation, generated policy numbers).
  - `PolicyCancellationRequestModel` – `src/app/models/scheme/policy-cancellation-request.schema.ts` tracks cancellation requests linked back to a policy (`policyId`) with review metadata and email flags.
  - `PolicyConfigurationModel` / generic `Configuration` models (under `src/app/models/system/**`) influence validation and business rules.
- **Relationships:**
  - **Signup → Policy:** approved `PolicySignUp` records lead to creation or update of `Policy` entries, with generated policy numbers stored back on the signup request.
  - **Cancellation → Policy:** `PolicyCancellationRequest` references the policy via `policyId` and `policyNumber`; approval updates both the cancellation request and policy status (`cancellationStatus` on `PolicyModel`).
  - **Transactions → Policies:** Easypay/EFT transactions (see Transactions module) link to policies through `policyNumber` or allocation records, feeding reconciliation views in `policies/recon` and policy reports.
  - **Notifications:** Policy signup and cancellation events trigger email and Discord notifications using `src/lib/email.ts` and `src/lib/discord.ts`.
  - See `docs/SIGNUP_REQUESTS_ACTIONS.md` and `docs/POLICY_CANCELLATION_FEATURE.md` for detailed workflows.

### Claims

- **Purpose:** Capture, track, and resolve claims against policies, with full audit of documents, comments, and status.
- **UI:** `src/app/(protected)/claims/page.tsx`, `src/app/components/claims/*` (table, details drawer, chat/comments, new‐claim drawer).
- **APIs:** `src/app/api/claims/**`.
- **Key model:**
  - `ClaimModel` – `src/app/models/scheme/claim.schema.ts` links a claim to a policy via `policyId` and to users via `submittedBy`, `notes[*].author`, and `comments[*].author`.
- **Relationships:**
  - **Policy linkage:** every claim references a policy and stores `policyPlan`, `claimType`, `schemeType`, and optional `societyName` to align with policy/society data.
  - **User linkage:** uses `users` collection for authors and submitters, surfacing into claim comments and notes.
  - **Email:** claim submission/status updates can trigger email flows via `src/lib/email.ts` (see `docs/EMAIL_SERVICE_DOCUMENTATION.md`).

### Cash‑up, daily activity & daily audit

- **Purpose:** Ensure front‑office cash handling and operational activity is captured daily, balanced against system totals, and audited.
- **UI:**
  - Cash‑up dashboards and review: `src/app/(protected)/cash-up/**` (including drawers for receipts, weekly summaries).
  - Daily activity capture/compliance: `src/app/(protected)/daily-activity/page.tsx`.
- **APIs:**
  - Cash‑up: `src/app/api/cash-up/**`.
  - Daily activity & reminders: `src/app/api/daily-activity/**`, `src/app/api/daily-activity-reminders/route.ts`, `src/app/api/cron/daily-activity-reminders/route.ts`.
- **Key models:**
  - HR models under `src/app/models/hr/**` (e.g. `daily-activity.schema.ts`, `cash-up-submission.schema.ts`, `shift.schema.ts`) link activity and cash submissions to employees/users and branches.
  - `DailyActivityReminderConfigModel` – `src/app/models/system/daily-activity-reminder.schema.ts` stores schedule, cutoff times, roles, and tracking metrics for reminder jobs.
- **Relationships:**
  - **User & branch linkage:** daily activity and cash‑up records reference users and often branches (via branch IDs/names from `BranchModel`), enabling branch‑level dashboards.
  - **Reminders & email:** reminder configs drive scheduled jobs that send emails (and optionally Discord notifications) to users who have not submitted, using the email and Discord services.
  - **Daily audit:** `docs/daily-audit-feature.md` describes how daily cash‑up data and ASSIT system balances are reconciled into a `DailyAudit` model (implemented in code under `hr`/`system` models) for discrepancy tracking and weekly summaries.

### Transactions & reconciliation (EFT / Easypay / imports)

- **Purpose:** Import, normalise, and allocate bank and Easypay transactions to policies and societies, and support reconciliation workflows.
- **UI:**
  - EFT flows: `src/app/(protected)/transactions/eft/**`, `src/app/(protected)/transactions/eft-importer/page.tsx`.
  - Easypay flows: `src/app/(protected)/transactions/easypay/**`.
  - Import tooling: `src/app/components/import-tools/*` (CSV/XLS/PDF importers).
- **APIs & server actions:**
  - HTTP APIs: `src/app/api/transactions/eft/**`, `src/app/api/transactions/easypay/**`.
  - Server actions: `src/server/actions/eft-transactions.ts`, `src/server/actions/easypay-transactions.ts` encapsulate heavier querying/allocation logic.
- **Key models:**
  - `EftTransactionModel` – `src/app/models/scheme/eft-transaction.schema.ts` stores EFT items, with optional `allocationRequests` linking to allocation request models.
  - `EasypayTransactionModel` – `src/app/models/scheme/easypay-transaction.schema.ts` holds Easypay rows keyed by `uuid`, `easypayNumber`, and optional `policyNumber`.
  - `allocation-request.schema.ts`, `easypay-import-data.schema.ts`, `eft-import-data.schema.ts` track import batches and allocation state.
- **Relationships:**
  - **Policies:** transactions are matched to policies by `policyNumber` / `easypayNumber`, feeding policy reconciliation views and reports.
  - **Societies & prepaid:** bulk society or prepaid imports (see Societies module) can create or influence transactions that must be reconciled here.
  - **Audit & tasks:** high‑risk operations (reversals, bulk allocations) are candidates for audit log events (`docs/AUDIT_LOGS_VISION.md`) and follow‑up tasks.

### Societies & prepaid / scheme management

- **Purpose:** Manage group schemes and prepaid societies that sit alongside individual policies.
- **UI:** `src/app/(protected)/societies/scheme/page.tsx`, `src/app/(protected)/societies/prepaid/page.tsx`.
- **APIs & actions:** `src/app/api/societies/**`, `src/app/api/prepaid-societies/**`, plus `src/server/actions/societies/scheme.ts` for CSV imports and search.
- **Key models:**
  - `SchemeSocietyModel` – `src/app/models/scheme/scheme-society.schema.ts` describes a scheme society (ASSIT ID, contact people, plan, consultant, member count).
  - `SocietyMemberModel` – `src/app/models/scheme/scheme-society-member.schema.ts` stores individual members of a society and premiums.
  - `SocietyModel` – `src/app/models/scheme/society.schema.ts` (traditional society records used by other flows).
- **Relationships:**
  - **Policies & claims:** society members and schemes tie into the policy and claim domains via `schemeType` and `societyName`, and by how payments are captured/allocated.
  - **Transactions:** bulk society transactions imported via bank/Easypay flows are later split/allocated to member policies.

### Funerals & case management

- **Purpose:** Track funeral cases end‑to‑end (case file, logistics, milestones) linked to underlying policies and/or societies.
- **UI:** `src/app/(protected)/funerals/page.tsx`, `src/app/(protected)/funerals/new/page.tsx`, `src/app/(protected)/funerals/[id]/page.tsx`, and components under `src/app/components/funerals/*` (e.g. `CaseFileSummary`, `FuneralForm`).
- **APIs:** `src/app/api/funerals/**` (including milestone completion routes under `[id]/milestones/*`).
- **Key models:** funeral and related models under `src/app/models/scheme/**` and `src/app/models/hr/**` (e.g. linking to staff/branches and policies/claims).
- **Relationships:**
  - **Policies & claims:** funerals are typically initiated from policies or claims; case files may reference policy numbers, claim IDs, and societies.
  - **Calendar:** funeral events appear in the shared company/branch/personal calendars.
  - **Tasks:** follow‑ups and operational work for a case can be represented as tasks.

### Calendar & scheduling

- **Purpose:** Provide shared, branch, and personal calendars for key events (funerals, shifts, reminders, etc.).
- **UI:** `src/app/(protected)/calendar/*` (company calendar, branch calendar, personal calendar, event palette).
- **APIs:** `src/app/api/calendar/events/**` for event CRUD and filtering.
- **Relationships:**
  - **Funerals & shifts:** events are often created/updated when funeral cases or shifts change.
  - **Branches & users:** calendar views can be filtered by branch or user, leveraging branch and user models.

### News, announcements & communications

- **Purpose:** Provide an in‑portal single source of truth for releases, urgent notices, and policy changes, with read tracking and acknowledgements.
- **UI:** `src/app/(protected)/news/**`, `src/app/(protected)/communication/page.tsx`.
- **APIs:** `src/app/api/news/**`, `src/app/api/notifications/**`, `src/app/api/test-discord/route.ts`.
- **Key models:**
  - `AnnouncementModel`, `AnnouncementReadModel`, `AnnouncementAckModel` – `src/app/models/system/announcement.schema.ts` implement the spec in `docs/sdk_admin_portal_news_announcements_module_spec_build_guide.md`.
- **Relationships:**
  - **Users & roles:** announcements scope and reads/acks are tracked per user, tied to `users` collection and role‑based access.
  - **Email & Discord:** publish actions can trigger cross‑posting via `src/lib/email.ts` and `src/lib/discord.ts`.
  - **Notifications:** `src/app/components/notifications/notification-bell.tsx` and `/api/notifications` surface unread counts and per‑user notification feeds.

### Knowledge Hub (company articles)

- **Purpose:** Internal knowledge base for company-authored articles (Code of Conduct, SOPs, How-To guides, policies, training).
- **UI:**
  - Browse/search: `src/app/(protected)/knowledge-hub/page.tsx`
  - Read: `src/app/(protected)/knowledge-hub/[slug]/page.tsx`
  - Admin authoring: `src/app/(protected)/knowledge-hub/create/page.tsx`, `src/app/(protected)/knowledge-hub/[slug]/edit/page.tsx`
- **APIs:** `src/app/api/knowledge/**`
  - List/search + create: `GET/POST /api/knowledge`
  - Detail + edit: `GET/PATCH /api/knowledge/[id]` (slug for reading, ObjectId for admin edit)
  - Publish/unpublish: `POST /api/knowledge/[id]/publish`, `POST /api/knowledge/[id]/unpublish`
- **Key model:** `KnowledgeArticleModel` – `src/app/models/system/knowledge-article.schema.ts`
- **Access control:**
  - **Readers:** any authenticated user can browse and read **published** articles
  - **Authors/Editors:** currently **Admin-only** for create/edit/publish (via `withRoleGuard` + API checks)

### HR: staff, shifts, daily activity

- **Purpose:** Model employees, shifts, and daily operational reporting per branch and user.
- **UI:** `src/app/(protected)/configurations/staff-members/page.tsx`, `src/app/(protected)/shifts/page.tsx`, `src/app/(protected)/daily-activity/page.tsx`.
- **Models:** `src/app/models/hr/**` – employees, shifts, daily activity, cash‑up submissions, leave requests, etc.
- **Relationships:**
  - **Users:** many HR models reference `UserModel` via `employee` or user IDs, tying authentication to HR data.
  - **Branches:** HR records often carry branch references (`branchID`, `branchName`) coordinated with `BranchModel`.
  - **Daily audit & reminders:** HR activity feeds into daily audit, reminders, and compliance reporting.

### System configurations & policy rules

- **Purpose:** Centralise business and technical configuration so behaviour can be tuned without code changes.
- **UI:** `src/app/(protected)/configurations/system/page.tsx`, `src/app/(protected)/configurations/policy/page.tsx`, `src/app/(protected)/configurations/daily-activity-reminders/page.tsx`, `src/app/(protected)/configurations/branches/page.tsx`, `src/app/(protected)/configurations/cemeteries/page.tsx`.
- **APIs:** `src/app/api/configurations/**`.
- **Key models:**
  - Generic configuration and `policy-configuration` schemas in `src/app/models/system/**`.
  - `BranchModel` – `src/app/models/system/branch.schema.ts` for branch metadata and geospatial lookups.
  - `ConfigurationService` (see `docs/CONFIGURATIONS.md`) used across modules to read configuration values with caching.
- **Relationships:**
  - **Policy & finance:** policy configuration values (limits, rules) are read by policy, claims, and reconciliation flows.
  - **Security & auth:** security‑related configs (e.g. login attempts, session timeout) are used by auth flows.
  - **Daily activity:** reminder configuration directly controls daily‑activity reminder behaviour.

### Tasks & (future) audit logging

- **Purpose:** Track small units of work across the system and provide a foundation for richer audit and compliance tooling.
- **UI:** `src/app/(protected)/tasks/page.tsx`.
- **APIs:** `src/app/api/tasks/**`.
- **Key model:**
  - `TaskModel` – `src/app/models/system/task.schema.ts` stores tasks with status, priority, due dates, assignees, and tags.
- **Relationships:**
  - **Cross‑module usage:** tasks can be created from many modules (e.g. follow‑ups on reconciliation, claims, policy signup reviews) via shared APIs.
  - **Audit vision:** `docs/AUDIT_LOGS_VISION.md` and `docs/CODEBASE_AUDIT_REPORT.md` lay out how future audit logs will complement tasks to give end‑to‑end traceability for critical actions.

---

## High-level architecture

- **App router:** all pages and layouts live in `src/app`.
  - `src/app/layout.tsx` – root layout and global providers.
  - `src/app/page.tsx` – public landing page.
  - `src/app/auth/*` – authentication flows and unauthenticated layout.
  - `src/app/(protected)/*` – main authenticated shell and feature areas (dashboard, policies, claims, calendar, cash‑up, tasks, reports, etc.).
- **API routes:** backend endpoints live under `src/app/api/**/route.ts` and call into Mongoose models after `connectToDatabase()`.
- **Models:** Mongoose schemas live under `src/app/models/**` and are grouped by domain (`hr`, `scheme`, `system`).
- **Database:** `src/lib/db.ts` handles MongoDB connection with basic connection caching.
- **Auth:** `src/middleware.ts`, `src/lib/auth.ts`, `src/context/auth-context.tsx`, and `src/utils/utils/with-auth.tsx` implement a JWT‑backed auth flow using the `auth-token` cookie.
- **Email:** `src/lib/email-templates/**` + `src/lib/email.ts` define email templates and sending helpers (see `docs/EMAIL_SERVICE_DOCUMENTATION.md`).
- **Presence & notifications:**
  - Presence: `src/components/presence.tsx` + `docs/PRESENCE_FEATURE.md`.
  - Notifications: `src/app/components/notifications/notification-bell.tsx` + `/api/notifications`.

For a more detailed, agent‑focused overview of the codebase, see `WARP.md`.

---

## Design system

- **UI library:** [NextUI](https://nextui.org/) is used for much of the shell (navbars, layout, buttons).
- **Ant Design:** used for certain complex components (tables, drawers, results, etc.) and global theming via `ConfigProvider`.
- **Theming:** [next-themes](https://github.com/pacocoursey/next-themes) + Tailwind dark‑mode classes provide light/dark switching.
- **Icons:** [Tabler Icons](https://tabler.io/docs/icons/react) and other icon sets (e.g. `lucide-react`) are used across the UI.
- **Background images:** hero backgrounds are SVGs generated by [fffuel.co/mmmotif](https://www.fffuel.co/mmmotif/).
