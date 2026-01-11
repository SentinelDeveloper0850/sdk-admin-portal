# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Tooling and commands

### Dependency installation

The project targets Next.js 15 and React 19 RC. Because several peer dependencies have not yet been updated for Next 15, follow the README and install with legacy peer resolution:

```bash
npm install --legacy-peer-deps
```

(Alternatives like `yarn`, `pnpm`, or `bun` are supported by Next, but the README documents `npm` as the primary example.)

### Local development

- Start the dev server (App Router, served from `src/app`):

  ```bash
  npm run dev
  ```

  The app is served on `http://localhost:3000`.

### Build and run in production mode

- Create an optimized production build:

  ```bash
  npm run build
  ```

- Run the built app:

  ```bash
  npm run start
  ```

### Linting and formatting

- Lint the project with Next/ESLint:

  ```bash
  npm run lint
  ```

  Note: `.eslintrc.json` turns off many TypeScript/React rules (e.g. `no-explicit-any`, `react-hooks/exhaustive-deps`), and `next.config.ts` is configured with `eslint.ignoreDuringBuilds = true`, so `next build` will not fail on lint errors.

- Format source files under `src/` with Prettier (with Tailwind and import-sorting plugins):

  ```bash
  npm run format
  ```

### Tests

As of `docs/CODEBASE_AUDIT_REPORT.md`, the codebase has **no test runner or test files configured** and there is **no `test` script** in `package.json`. There is currently no standard command for running tests or a single test file; if you introduce Jest/Vitest or another harness, add the appropriate npm scripts and update this section.

### Maintenance scripts

There are ad‑hoc maintenance/utility scripts under `scripts/` (for example `scripts/update-inception-dates.ts`). These are plain TypeScript Node scripts and can be run via `ts-node`, for example:

```bash
npx ts-node scripts/update-inception-dates.ts
```

Adjust arguments and environment variables as required by the specific script.

## High-level architecture

### Framework and runtime

- Next.js 15 App Router with TypeScript and React 19 RC.
- Primary application code lives under `src/`.
- MongoDB is accessed via Mongoose, using a custom connection helper and hand-written models.

### Routing and layouts (`src/app`)

- **Root layout**: `src/app/layout.tsx`
  - Sets global metadata (`SDK Admin Portal`) and `<head>` tags (favicon).
  - Imports global CSS (`globals.css`) and Ant Design reset CSS.
  - Wraps the application in a `Providers` component and includes Vercel Speed Insights.

- **Providers**: `src/app/components/providers.tsx`
  - Wraps the entire app tree with:
    - `AuthProvider` (`src/context/auth-context.tsx`) for authenticated user state.
    - Ant Design `ConfigProvider` for theming and tokens.
    - `NextUIProvider` (NextUI component library) wired to Next.js navigation.
    - `next-themes` `ThemeProvider` for dark/light mode driven by `useSystemTheme`.
  - This file is the central place to add global context providers or UI libraries.

- **Public landing**: `src/app/page.tsx`
  - Anonymous home page using `AppBarOffline` and a simple marketing/entry experience.
  - Provides a "Sign In" CTA to `/auth/signin`.

- **Auth section**: `src/app/auth/*`
  - `layout.tsx` defines a minimal unauthenticated layout (centered card) for auth flows.
  - Child routes such as `signin/page.tsx` and `forgot-password/page.tsx` render within this layout.

- **Protected application area**: `src/app/(protected)/*`
  - `src/app/(protected)/layout.tsx` is the main authenticated shell:
    - Wrapped with the `withAuth` HOC to enforce client-side auth.
    - Renders the online app bar (`AppBarOnline`), side navigation (`SideNavBar`), and the main content area.
    - Some routes (e.g. `/calendar`) enable additional context menus via a route-aware flag.
  - Feature areas under `(protected)` map directly to top-level business domains, for example:
    - `dashboard`, `calendar`, `cash-up`, `claims`, `communication`, `configurations/*`,
      `daily-activity`, `funerals`, `news`, `policies/*`, `reports/policies`, `shifts`,
      `societies/*`, `status`, `tasks`, `transactions/*`, `users/*`, etc.
  - Each folder typically contains a `page.tsx` (and sometimes sub-pages) that composes shared components and calls into API routes or server actions.

### API layer (`src/app/api`)

- Next.js route handlers under `src/app/api/**/route.ts` implement the backend for the portal.
- These are organized by domain and mirror the UI feature areas. Examples include:
  - `auth/*` – login, logout, register, forgot password, current user info.
  - `calendar/*` – calendar event CRUD.
  - `cash-up/*` – cash-up submissions, uploads, summaries, review/resolve actions.
  - `claims/*` – claim creation and updates.
  - `configurations/*` – branches, cemeteries, system configuration, policy configuration.
  - `daily-activity*`, `dashboard`, `news/*`, `notifications/*`, `policies/*`,
    `prepaid-societies/*`, `societies/*`, `staff/*`, `status`, `tasks/*`,
    `transactions/*` (EFT/Easypay flows, imports, allocations, reconciliation),
    `upload/*`, `users/*`, etc.
- Most route handlers:
  - Call `connectToDatabase` from `src/lib/db.ts` to ensure a MongoDB connection.
  - Use Mongoose models under `src/app/models/**` for data access.
  - Return JSON via `NextResponse`.

### Domain models and database (`src/app/models` and `src/lib/db.ts`)

- `src/lib/db.ts`:
  - Connects to MongoDB using `mongoose.connect` and a cached connection.
  - Requires the `MONGODB_ATLAS_URI` environment variable; throws at startup if missing.
  - Logs connection events; consumers typically call `connectToDatabase()` before using models.

- `src/app/models/**` contains Mongoose schemas grouped by domain:
  - `hr/*` – HR and internal operations (users, employees, shifts, leave requests, cash-up submissions, daily activity, etc.).
  - `scheme/*` – Insurance/policy domain (policies, sign‑up requests, cancellation requests, Easypay/EFT imports and transactions, societies and members, claims, etc.).
  - `system/*` – Cross-cutting system features (announcements/news, audit logs, branches, configuration, daily activity reminders, tasks, policy configuration).

These models are referenced across API route handlers and server actions, so changes here can have wide impact.

### Server actions (`src/server/actions`)

- `src/server/actions/**` contains server actions for heavier data operations that are not directly exposed via a single route handler, for example:
  - `societies/scheme.ts` – paginated fetch/search of scheme societies and CSV import utilities, all using `connectToDatabase` and Mongoose models.
- When adding new complex back-office flows, prefer keeping long‑running or batch operations in this layer rather than inside page components.

### Authentication and authorization

- **Edge middleware**: `src/middleware.ts`
  - Uses `jose.jwtVerify` to validate a JWT stored in the `auth-token` cookie.
  - Protects a set of path matchers (`/dashboard`, `/transactions/*`, `/policies/*`, `/prepaid-societies/*`, `/daily-activity/*`, `/claims/*`, `/users/*`, `/account/*`).
  - Requires `JWT_SECRET` in the environment; throws at startup if absent.

- **Auth context**: `src/context/auth-context.tsx`
  - Client-side context that fetches `/api/auth/user` to populate the current `user` (`IUser` from `src/app/models/hr/user.schema.ts`).
  - Exposes `useAuth()` with `{ user, userId, isAdmin, loading, setUser }`.
  - Redirects to `/auth/signin` on 401 responses.

- **Route guards**:
  - `src/utils/utils/with-auth.tsx` – higher-order component that blocks rendering until `useAuth()` has a user; redirects to `/auth/signin` and shows a full-screen spinner while loading.
  - `src/utils/utils/with-role-guard.tsx` – wraps components with role-based access control using `useRole()` and Ant Design's `Result` component to render a 403-style "Access Denied" page when roles do not match.
  - `src/utils/helpers/{hasRole.ts, roles.ts}` – helpers and metadata for roles and grouped role definitions used by RBAC-aware features.

Together, `middleware.ts`, `AuthProvider`, and these HOCs implement a custom JWT‑based auth system (no NextAuth). Any changes to auth flows should consider all three layers.

### UI, theming, and design system

- **Component libraries**:
  - NextUI (`@nextui-org/react`) – primary UI component set (navbars, layout primitives, etc.).
  - Ant Design (`antd`) – used for some components (e.g. `Result`, `Spin`, table/form elements) and global theming via `ConfigProvider`.
  - Additional libraries such as Radix UI, Chakra UI, and others are present in `package.json`, but NextUI + Ant Design are the ones wired up centrally.

- **Theming**:
  - `src/app/components/providers.tsx` combines Ant Design theming, NextUI, and `next-themes` dark/light mode.
  - `tailwind.config.ts` integrates Tailwind with NextUI and defines light/dark theme colors; `darkMode: "class"` is used, with classes driven by `next-themes`.

- **Layout chrome and navigation** (`src/app/components/*`):
  - `app-bar-online.tsx` – top navigation bar for authenticated users (logo, presence indicator, theme switcher, notification bell, task bell, user avatar + profile/logout menu).
  - `app-bar-offline.tsx` – slimmer navbar for anonymous users (logo, theme switcher, sign-in links).
  - `side-navbar.tsx` – left-hand navigation used within the `(protected)` layout.
  - `notifications/notification-bell.tsx` – notification popover backed by `/api/notifications` and `useNotifications` hook, with local optimistic updates and "mark all as read" support.
  - Various domain-specific drawers, tables, and importers live under `src/app/components/**` (cash-up, claims, funerals, policies, import tools, editors, etc.) and are composed into feature pages under `(protected)`.

### Email templates (`src/lib/email-templates`)

- `src/lib/email-templates/index.ts` centralizes email rendering:
  - Registers Handlebars helpers (`formatDate`, `formatCurrency`, `formatDateTime`, conditional helpers).
  - Loads `.hbs` templates from `src/lib/email-templates/templates/*.hbs` using `fs` and `path` at runtime.
  - Exposes `renderTemplate(templateName, data)` and `EMAIL_TEMPLATES` constants keyed by business event (user management, policy events, claims, daily activity, transaction imports, system notifications).
- When adding new email flows, extend `EMAIL_TEMPLATES` and add the appropriate `.hbs` templates under the `templates/` folder.

### Documentation and specs (`docs/`)

- `docs/CODEBASE_AUDIT_REPORT.md`
  - Independent audit of the codebase (security, stability, performance, code quality).
  - Highlights key constraints that affect future work:
    - No tests or test runner are currently configured.
    - Custom JWT auth implementation with known security gaps (e.g., lack of rate limiting, simplistic RBAC).
    - Many ESLint rules are disabled; `next.config.ts` ignores ESLint and TypeScript errors during builds.
    - Multiple overlapping UI libraries and theming providers.
  - Treat this as a source of known technical debt and a checklist when planning larger refactors.

- `docs/sdk_admin_portal_news_announcements_module_spec_build_guide.md`
  - Detailed functional and technical spec for the **News & Announcements** module.
  - Defines Mongoose schemas (announcements, reads, acknowledgements), REST API routes under `/api/news/*`, RBAC expectations, UI/UX wireframes, telemetry, and phased rollout.
  - The implemented `src/app/(protected)/news/*` pages and `src/app/api/news/*` routes are expected to follow this spec; consult it when extending or fixing news-related features.

### Configuration and linting

- `next.config.ts`
  - Disables build failures on ESLint and TypeScript errors (`eslint.ignoreDuringBuilds`, `typescript.ignoreBuildErrors`).
  - Configures remote image domains (`flowbite.s3.amazonaws.com`, `res.cloudinary.com`) and sets `images.unoptimized = true`.

- `.eslintrc.json`
  - Extends `next/core-web-vitals`, `next/typescript`, and `prettier`.
  - Disables many stricter rules (various `@typescript-eslint/*`, `react/jsx-key`, `react-hooks/exhaustive-deps`, etc.).
  - Be aware that `npm run lint` may not catch issues that these rules would normally enforce.
