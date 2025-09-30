# News & Announcements Module (Spec & Build Guide)

> **Goal:** Add an in‑portal single source of truth for release notes, news, and urgent notices — with RBAC, read tracking, acknowledgements, and optional cross‑posting to Discord/WhatsApp/Email.

---

## 1) High‑Level Scope

- Central **News & Announcements** feed visible to authenticated users per RBAC.
- Rich text editor (Markdown) for admins to publish posts with attachments.
- **Versioned Release Notes** support (title, version, date, tags, body, attachments, link to changelog).
- **Read/Unread** status per user; optional **acknowledgement** required for critical posts.
- **Pinned** posts appear at the top.
- **Categories/Tags** for filtering (System Update, Policy, Training, Alert, Release, etc.).
- **Search** by title, tag, content, author, date.
- **Scheduling** (publishAt in the future).
- **Cross‑post hooks**: Discord/WhatsApp/Email (webhooks or queue); can be disabled per post.
- **Audit logging** (create/update/publish/unpublish/delete); **analytics** (views, read rate, ack completion).

---

## 2) User Stories

- As a **Portal Admin**, I can draft, preview, schedule, and publish posts; optionally require acknowledgements; push to channels.
- As a **Manager**, I can pin posts for my branch/department; track who has read/acknowledged.
- As a **Staff user**, I can see relevant posts (org/branch scoped), mark as read, download attachments, search history.
- As **Compliance/Audit**, I can export read/acknowledgement logs per post and date range.

---

## 3) Data Model (Mongoose Schemas)

> Storage: MongoDB
>
> Conventions: snake‑case collection names, TTL only if needed (not typical here), soft deletes optional.

````ts
import { Schema, model, Types } from "mongoose";

export enum AnnouncementStatus {
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  PUBLISHED = "PUBLISHED",
  UNPUBLISHED = "UNPUBLISHED",
}

export enum AnnouncementCategory {
  SYSTEM_UPDATE = "SYSTEM_UPDATE",
  POLICY_CHANGE = "POLICY_CHANGE",
  TRAINING = "TRAINING",
  ALERT = "ALERT",
  RELEASE = "RELEASE",
}

const AttachmentSchema = new Schema({
  label: { type: String, required: true },
  url: { type: String, required: true },
  contentType: String,
  sizeBytes: Number,
}, { _id: true, timestamps: { createdAt: true, updatedAt: false } });

const AnnouncementSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  bodyMd: { type: String, required: true },
  bodyHtml: String,
  status: { type: String, enum: Object.values(AnnouncementStatus), default: AnnouncementStatus.DRAFT, index: true },
  isPinned: { type: Boolean, default: false, index: true },
  requiresAck: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
  category: { type: String, enum: Object.values(AnnouncementCategory), required: true, index: true },
  version: String,
  publishAt: Date,
  publishedAt: Date,
  unpublishAt: Date,

  // Scoping (optional for multi-branch)
  branchId: { type: String, index: true },

  // Channel options
  pushDiscord: { type: Boolean, default: false },
  pushWhatsapp: { type: Boolean, default: false },
  pushEmail: { type: Boolean, default: false },

  viewCount: { type: Number, default: 0 },

  authorId: { type: Types.ObjectId, ref: "users", required: true, index: true },
  attachments: { type: [AttachmentSchema], default: [] },
}, { timestamps: true, collection: "announcements" });

AnnouncementSchema.index({ title: "text", bodyMd: "text", tags: 1 });
AnnouncementSchema.index({ isPinned: -1, publishedAt: -1 });
AnnouncementSchema.index({ category: 1, publishedAt: -1 });

const AnnouncementReadSchema = new Schema({
  announcementId: { type: Types.ObjectId, ref: "announcements", required: true, index: true },
  userId: { type: Types.ObjectId, ref: "users", required: true, index: true },
  readAt: { type: Date, default: Date.now },
}, { timestamps: false, collection: "announcement_reads" });
AnnouncementReadSchema.index({ announcementId: 1, userId: 1 }, { unique: true });

const AnnouncementAckSchema = new Schema({
  announcementId: { type: Types.ObjectId, ref: "announcements", required: true, index: true },
  userId: { type: Types.ObjectId, ref: "users", required: true, index: true },
  ackAt: { type: Date, default: Date.now },
  method: String, // web, mobile, api
}, { timestamps: false, collection: "announcement_acks" });
AnnouncementAckSchema.index({ announcementId: 1, userId: 1 }, { unique: true });

export const Announcement = model("announcements", AnnouncementSchema);
export const AnnouncementRead = model("announcement_reads", AnnouncementReadSchema);
export const AnnouncementAck = model("announcement_acks", AnnouncementAckSchema);
```ts
// See Mongoose schemas above. Add org/branch/tenant refs to match your existing models.
````

---

## 4) API Design (REST under `/api/news/*`)

### Routes

- `GET   /api/news` – list with filters: `q`, `tag`, `category`, `status`, `pinned`, `orgId`, `branchId`, `after`, `before`, `take`, `cursor`.
- `GET   /api/news/:slug` – details; includes read/ack status for current user.
- `POST  /api/news` – create (Admin+ only).
- `PATCH /api/news/:id` – update (Admin+ only).
- `POST  /api/news/:id/publish` – publish/schedule; triggers cross‑posts.
- `POST  /api/news/:id/unpublish` – unpublish.
- `POST  /api/news/:id/read` – mark current user as read.
- `POST  /api/news/:id/ack` – acknowledge (if required).
- `GET   /api/news/:id/analytics` – views, read rate, ack rate (Admin/Manager).
- `GET   /api/news/:id/reads.csv` – export reads (Admin/Manager).
- `GET   /api/news/:id/acknowledgements.csv` – export acknowledgements (Admin/Manager).

---

## 5) RBAC & Permissions

> Additional roles like \*\*Author\*\*, and \*\*Editor\*\* with granular permissions like `news:create`, `news:publish`, `news:pin`, `news:export`, etc.

---

## 6) UI/UX Spec

### Sidebar Entry

- Add **News & Announcements**. Show unread badge count.

### Main Views

1. **List Page**
   - Search box, tag/category filter, `Pinned` toggle, date range.
   - Cards or table with title, tags, category, publishedAt, version, read/acknowledged status, pin indicator.
2. **Detail Page**
   - Title, version, badges (Pinned, Requires Acknowledgement), publish date, author.
   - Rendered Markdown (with typography), attachment list, view/read/acknowledged status.
   - Action bar: **Mark as Read**, **Acknowledge** (if required).
3. **Admin Editor**
   - Title, slug (auto), category, tags (multi), version, org/branch scope, scheduling, requireAcknowledgement, channel toggles.
   - Markdown editor + preview, attachments upload (Cloudinary), Pin toggle, Save/Publish buttons.

### Wireframe (ASCII)

```
[Sidebar]   | News & Announcements            (🔔 3)
            |  ├─ List
            |  └─ Create (Author)
-----------------------------------------------------------
List Header: [Search __________________] [Category ▼] [Tags ▼] [Pinned □]

┌─────────────────────────────────────────────────────────┐
│ [PIN]  Release: v2025.09.30  • RELEASE • 2025-09-30    │
│ Title: Easypay Allocation Requests                      │
│ Tags: easypay, allocations  | Read: ✓ | Ack: —         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Policy Update • POLICY_CHANGE • 2025-09-25              │
│ Title: Updated Refund Handling                          │
│ Tags: finance, policy  | Read: — | Ack: Required        │
└─────────────────────────────────────────────────────────┘
```

---

## 7) Components

- `NewsList.tsx` – data table/cards with filters, server pagination.
- `NewsDetail.tsx` – content render, read/ack actions.
- `NewsEditor.tsx` – form (react-hook-form): fields above, markdown editor.
- `AnnouncementCard.tsx` – list item summary.
- `AcknowledgementDialog.tsx` – confirm acknowledgement.
- `AttachmentUploader.tsx` – Cloudinary upload widget.
- `NotificationBell.tsx` – shows unread count (from `/api/news?unread=1`).

---

## 8) Notifications & Cross‑Posting

- **Discord**: Outbound webhook with title, version, summary, link back to portal.
- **WhatsApp**: Use your chosen provider (SMS South Africa / twilio) to broadcast a TL;DR with permalink.
- **Email**: Transactional email with similar content; include “Acknowledge” CTA link.
- Implement via background job/queue on `publish` action; configurable per post.

---

## 9) Telemetry & Analytics

- Increment `viewCount` on detail fetch (debounce by user/session).
- Track `AnnouncementRead` on button click *or* auto when scrolled 80%.
- `ack` requires explicit user action; store method.
- Admin analytics: read rate = reads / total targeted users; acknowledgement rate

---

## 10) Initialization & Seed (MongoDB)

- No SQL migrations required. Ensure indexes are created (Mongoose will create them on startup if `autoIndex` is enabled in dev; prefer explicit index creation in a startup script for prod).
- Optional seed: insert default categories/tags and a sample announcement (today’s release).

```ts
// scripts/seed-news.ts
import "dotenv/config";
import mongoose from "mongoose";
import { Announcement } from "@/models/announcement"; // path to the schema file above

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  await Announcement.create({
    title: "Easypay Allocation Requests Released",
    slug: "easypay-allocation-requests-released",
    bodyMd: "**What’s new**: Easypay Allocation Requests are now live...",
    category: "RELEASE",
    tags: ["easypay", "allocations"],
    version: "v2025.09.30",
    status: "PUBLISHED",
    publishedAt: new Date(),
    authorId: new mongoose.Types.ObjectId(process.env.ADMIN_USER_ID),
    pushDiscord: true,
  });
  await mongoose.disconnect();
}
main().catch(err => { console.error(err); process.exit(1); });
```

---

## 11) Next.js Routes (App Router)

```
/app
  /news
    page.tsx           // list
    /[slug]
      page.tsx         // detail
    /create
      page.tsx       // editor
    /[id]/edit
      page.tsx       // editor
/api
  /news
    route.ts           // GET list, POST create
    /[id]
      route.ts         // GET detail (by id or slug), PATCH update
    /[id]/publish
      route.ts         // POST publish
    /[id]/unpublish
      route.ts         // POST unpublish
    /[id]/read
      route.ts         // POST mark read
    /[id]/ack
      route.ts         // POST ack
    /[id]/analytics
      route.ts         // GET analytics
```

> Prefer `slug` for public routes; keep `id` for API updates.

---

## 12) Handler Stubs (TypeScript – abbreviated, Mongoose)

```ts
// /app/api/news/route.ts
import { Announcement } from "@/models/announcement";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const category = url.searchParams.get("category");
  const pinned = url.searchParams.get("pinned");
  const take = Math.min(Number(url.searchParams.get("take") ?? 20), 100);
  const cursor = url.searchParams.get("cursor"); // expect ISO date or ObjectId

  const where: any = { status: "PUBLISHED" };
  if (category) where.category = category;
  if (pinned) where.isPinned = pinned === "1" || pinned === "true";
  if (q) where.$text = { $search: q };
  if (cursor) where._id = { $lt: new Types.ObjectId(cursor) };

  const items = await Announcement.find(where)
    .sort({ isPinned: -1, publishedAt: -1, _id: -1 })
    .limit(take + 1)
    .lean();

  const nextCursor = items.length > take ? String(items[take]._id) : undefined;
  return NextResponse.json({ items: items.slice(0, take).map(({ _id, ...doc }) => ({ id: String(_id), ...doc })), nextCursor });
}

export async function POST(req: Request) {
  // authz: news:create
  const body = await req.json();
  // validate with zod
  const created = await Announcement.create({ ...body, status: body.status ?? "DRAFT" });
  return NextResponse.json({ id: String(created._id) }, { status: 201 });
}
```

```ts
// /app/api/news/[id]/publish/route.ts
import { Announcement } from "@/models/announcement";
import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  // authz: news:publish
  const now = new Date();
  const updated = await Announcement.findByIdAndUpdate(params.id, { status: "PUBLISHED", publishedAt: now }, { new: true });
  // enqueue cross-post jobs here
  return NextResponse.json({ id: String(updated?._id), publishedAt: updated?.publishedAt });
}
```

```ts
// /app/api/news/[id]/read/route.ts
import { AnnouncementRead } from "@/models/announcement";
import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const userId = getUserId(); // from session
  await AnnouncementRead.updateOne(
    { announcementId: params.id, userId },
    { $setOnInsert: { readAt: new Date() } },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}
```

```ts
// /app/api/news/[id]/ack/route.ts
import { AnnouncementAck, Announcement } from "@/models/announcement";
import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const ann = await Announcement.findById(params.id).lean();
  if (!ann?.requiresAck) return NextResponse.json({ error: "Acknowledgement not required" }, { status: 400 });
  const userId = getUserId();
  await AnnouncementAck.updateOne(
    { announcementId: params.id, userId },
    { $setOnInsert: { ackAt: new Date(), method: "web" } },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}
```

---

## 13) Validation (zod) – Create/Update

> Keep using zod on the API layer; persist via Mongoose.

````ts
const announcementSchema = z.object({
  title: z.string().min(4),
  bodyMd: z.string().min(10),
  category: z.enum(["SYSTEM_UPDATE","POLICY_CHANGE","TRAINING","ALERT","RELEASE"]),
  tags: z.array(z.string()).max(8).optional().default([]),
  version: z.string().optional(),
  isPinned: z.boolean().optional(),
  requiresAck: z.boolean().optional(),
  publishAt: z.string().datetime().optional(),
  orgId: z.string().optional(),
  branchId: z.string().optional(),
  pushDiscord: z.boolean().optional(),
  pushWhatsapp: z.boolean().optional(),
  pushEmail: z.boolean().optional(),
});
```ts
const announcementSchema = z.object({
  title: z.string().min(4),
  bodyMd: z.string().min(10),
  category: z.enum(["SYSTEM_UPDATE","POLICY_CHANGE","TRAINING","ALERT","RELEASE"]),
  tags: z.array(z.string()).max(8).optional().default([]),
  version: z.string().optional(),
  isPinned: z.boolean().optional(),
  requiresAck: z.boolean().optional(),
  publishAt: z.string().datetime().optional(),
  orgId: z.string().optional(),
  branchId: z.string().optional(),
  pushDiscord: z.boolean().optional(),
  pushWhatsapp: z.boolean().optional(),
  pushEmail: z.boolean().optional()
});
````

---

## 14) Security Considerations

- Sanitize Markdown to HTML (XSS). Use a safe renderer (remark/rehype with sanitize).
- Scope visibility by org/branch/tenant in all list/detail queries.
- Rate‑limit read/ack endpoints; protect from CSRF (same‑site, tokens).
- Only Admins can publish/unpublish or require acknowledgements.

---

## 15) Observability & Audit

- Audit log entries: create, update, publish, unpublish, delete, pin toggle, channel toggles.
- Metrics: posts/week, avg read time, read rate by role/branch, ack completion by due date.
- Alerts: if ack rate < threshold after N hours; if webhook failures.

---

## 16) Feature Phases

1. **MVP**: List/Detail, Admin create/publish, Pinned, Tags, Read tracking.
2. **Phase 2**: Acknowledgements, Scheduling, Cross‑posting webhooks.
3. **Phase 3**: Analytics/Exports, Branch/Org scoping, Email digests, Mobile push.
4. **Phase 4**: Training content type, inline quizzes (optional), RTE enhancements.

---

## 17) Example Content: Today’s Release

```md
# Release – Easypay Allocation Requests (v2025.09.30)

**What’s new**
- Submit & manage allocation requests tied to Easypay transactions.
- Streamlines reconciliation and support processes.

**Upcoming**
- Society Payment Allocations: create single receipts from one batch society transaction and import into ASSIT.
```

---

## 18) TODO Checklist (Cursor‑friendly)

-

---

## 19) Nice‑to‑Haves

- Draft autosave and versioning.
- Mentions (`@role/@branch`) for targeted notifications.
- Attachment previews (PDF/images) inline.
- Standard Keyboard shortcuts in editor.

---

