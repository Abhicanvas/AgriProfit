# AgriProfit Frontend Documentation

> **Purpose:** Detailed review reference for every file in `frontend/src/`.  
> **Framework:** Next.js 15 (App Router), TypeScript, Tailwind CSS, TanStack Query  
> **Base URL Pattern:** All API calls go to `NEXT_PUBLIC_API_URL` (default: `http://127.0.0.1:8000/api/v1`)

---

## Table of Contents

1. [Directory Overview](#1-directory-overview)
2. [Root Config Files](#2-root-config-files)
3. [src/app — Pages & Routes](#3-srcapp--pages--routes)
4. [src/components — UI Building Blocks](#4-srccomponents--ui-building-blocks)
5. [src/services — API Layer](#5-srcservices--api-layer)
6. [src/store — Global State](#6-srcstore--global-state)
7. [src/hooks — Custom React Hooks](#7-srchooks--custom-react-hooks)
8. [src/lib — Core Utilities](#8-srclib--core-utilities)
9. [src/types — TypeScript Contracts](#9-srctypes--typescript-contracts)
10. [src/utils — Helper Utilities](#10-srcutils--helper-utilities)
11. [Data Flow Diagram](#11-data-flow-diagram)

---

## 1. Directory Overview

```
frontend/
├── src/
│   ├── app/            # Next.js App Router — one folder = one URL route
│   ├── components/     # Shared React components
│   ├── services/       # All HTTP calls to the backend API
│   ├── store/          # Global client-side state (Zustand)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Axios instance and helpers
│   ├── types/          # Shared TypeScript interfaces
│   └── utils/          # Dev/performance utilities
├── next.config.ts      # Next.js configuration
├── tailwind.config.*   # Tailwind CSS config
├── tsconfig.json       # TypeScript compiler config
├── vitest.config.ts    # Unit test runner config
└── package.json        # Project dependencies and scripts
```

---

## 2. Root Config Files

### `next.config.ts`
Next.js build configuration. Controls experimental features, image domains, environment variable exposure, and module resolution. Any new public env vars (`NEXT_PUBLIC_*`) must be accessible without changes here — they are automatically inlined at build time.

### `tailwind.config.*` / `postcss.config.mjs`
Sets up Tailwind CSS with the `shadcn/ui` design system palette. Defines the design token colours used across every component (e.g., `bg-green-600` for primary actions, `text-muted-foreground` for secondary labels). PostCSS processes Tailwind directives during the build.

### `tsconfig.json`
TypeScript compiler settings. Key setting: `"paths": { "@/*": ["./src/*"] }` — enables the `@/` import alias used everywhere (e.g., `@/services/auth`, `@/components/ui/button`).

### `vitest.config.ts`
Configures Vitest (Jest-compatible) for unit and integration tests. Sets up the jsdom environment for React component testing and maps `@/` aliases to match `tsconfig.json`.

### `package.json`
Scripts and dependencies.

| Script | Action |
|--------|--------|
| `npm run dev` | Starts Next.js in development mode with hot reload |
| `npm run build` | Produces a production build |
| `npm run test` | Runs all Vitest unit tests |
| `npm run lint` | ESLint checks |

Key runtime dependencies: `next`, `react`, `@tanstack/react-query`, `axios`, `zustand`, `sonner`, `lucide-react`, `recharts`, `tailwind-merge`.

### `components.json`
`shadcn/ui` CLI configuration. Specifies where UI primitives are generated (`src/components/ui/`), the icon library (`lucide-react`), and CSS variable mode for theming.

---

## 3. `src/app` — Pages & Routes

Next.js App Router maps **folder names → URLs**. Every `page.tsx` inside a folder is a rendered route. `layout.tsx` wraps child routes. `loading.tsx` is shown while a route is streaming. `error.tsx` is the error boundary.

---

### `app/layout.tsx` — Root Layout
**URL:** Applied to every page

The single HTML shell for the entire app. Responsibilities:
- Loads the **Geist Sans** and **Geist Mono** Google Fonts and injects them as CSS variables.
- Sets the browser tab `<title>` and `<meta description>` via Next.js Metadata API.
- Wraps all pages in `<QueryProvider>` (TanStack Query context — required for all `useQuery`/`useMutation` calls to work).
- Renders `<Toaster>` (Sonner) globally so any page can fire `toast.success()` / `toast.error()` notifications.

No authentication check happens here — auth is handled per-page.

---

### `app/page.tsx` — Root Redirect
**URL:** `/`

Immediately calls `redirect("/login")`. Makes sure visiting the root URL always sends the user to the login page. Contains no UI markup.

---

### `app/globals.css`
Global CSS imported by `layout.tsx`. Defines:
- Tailwind `@base`, `@components`, `@utilities` layers.
- CSS custom properties for the light/dark colour theme (e.g., `--background`, `--foreground`, `--primary`).
- Any global resets (scrollbar styling, font smoothing).

---

### `app/error.tsx` — Global Error Boundary
**URL:** Catches runtime errors on any route

A Client Component that receives `error` and `reset` props from Next.js. Displays a user-friendly error message and a "Try again" button that calls `reset()` to re-render the failed segment.

---

### `app/loading.tsx` — Global Loading UI
**URL:** Shown during top-level route transitions

Displays a spinner or skeleton while the root layout or a page is suspending. Individual routes can override this with their own `loading.tsx`.

---

### `app/not-found.tsx` — 404 Page
**URL:** Any unmatched route

Renders a "Page not found" message with a link back to `/dashboard`.

---

### `app/login/page.tsx` — Login Page
**URL:** `/login`

The app's entry point for unauthenticated users. Implements a **two-step OTP flow**:

**Step 1 — Phone Input:**
- Text input for a 10-digit Indian mobile number (validated: must start with 6–9).
- On submit, calls `authService.requestOtp(phoneNumber)` → `POST /auth/request-otp`.
- On success, starts a 60-second countdown preventing re-send spam, then advances to Step 2.

**Step 2 — OTP Input:**
- Six-digit OTP input (manual text field).
- On submit, calls `authService.verifyOtp(phoneNumber, otp)` → `POST /auth/verify-otp`.
- On success, receives a JWT token, stores it via `useAuthStore.setAuth(user, token)`, then:
  - New users (`is_new_user: true`) → redirected to `/register` to complete profile.
  - Returning users → redirected to `/dashboard`.
- Error states show inline validation (red border + message under field).

**State managed:** `step`, `phoneNumber`, `otp`, `loading`, `resendTimer`.  
Wrapped in `<AuthLayout>` (centred card with branding).

---

### `app/register/page.tsx` — Profile Completion
**URL:** `/register`

Shown only to new users after their first successful OTP verification. Collects: `name`, `age`, `state`, `district`. Calls `authService.completeProfile(data)` → `POST /auth/complete-profile`. On success, redirects to `/dashboard`.

---

### `app/dashboard/page.tsx` — Main Dashboard
**URL:** `/dashboard`

The most complex page (~600 lines). After authentication it shows a snapshot of the entire platform:

**Sections:**
1. **Stats Grid** — 4 KPI cards: Total Mandis, Active Commodities, Today's Price Updates, Recent Community Posts. Fetched from `analyticsService.getDashboard()`.
2. **Market Prices** — `<MarketPricesSection>` component. Shows top commodity prices from `commoditiesService.getWithPrices()` in a scrollable list with trend arrows (↑/↓).
3. **Price Distribution Pie Chart** — Recharts `PieChart` (dynamically imported to reduce initial bundle) showing commodity category breakdown.
4. **Recent Activity Feed** — Last 5 events (price updates, community posts, alerts) from `notificationsService.getActivity()`.
5. **Quick Action Cards** — Links to Inventory, Sales, Transport, Analytics.

Uses `useQuery` (TanStack Query) for all data fetching with automatic caching and background refetch. Recharts is loaded lazily via `dynamic()` with `ssr: false`.

---

### `app/commodities/page.tsx` — Commodity Listing
**URL:** `/commodities`

Displays all agricultural commodities tracked by the platform with their **latest prices**.

**Features:**
- Search bar filtering commodities by name (client-side, instant).
- Category filter tabs (Vegetables, Fruits, Grains, Spices, etc.).
- Each commodity card shows: name, local name, category, unit, latest price, price change % with trend colour.
- Clicking a commodity navigates to `/commodities/[id]` for details.

Data: `commoditiesService.getWithPrices()` → `GET /commodities/with-prices`.

---

### `app/commodities/[id]/page.tsx` — Commodity Detail
**URL:** `/commodities/:id`

Dynamic route for a single commodity. Shows:
- Historical price chart (Recharts `LineChart`) for the last 30 / 90 / 180 days.
- Price breakdown by mandi (which markets have it cheapest/most expensive).
- AI forecast card if available from `forecastsService`.

---

### `app/mandis/page.tsx` — Mandi Browser
**URL:** `/mandis`

Allows farmers to browse and search **6,222+ agricultural markets** (mandis) across India.

**Features:**
- **Dual view mode** — Grid cards or List rows (toggle button).
- **Search** — Debounced name/address/code search sent to API.
- **State & District filters** — Cascading dropdowns; selecting a state loads that state's districts.
- **Facility filters** — Checkboxes for Weighbridge, Storage, Loading Dock, Cold Storage.
- **Sort** — By name, distance, or rating.
- **Geolocation** — "Use my location" button reads the browser's GPS coordinates and sends them to the API to sort mandis by proximity.
- **District colour badges** — Each Kerala district gets a distinct badge colour.
- Each mandi card shows: name, district, facilities, rating, and top 3 commodity prices.

Data: `mandisService.getWithFilters()` → `GET /mandis/with-filters` (with query params).

---

### `app/mandis/[id]/page.tsx` — Mandi Detail
**URL:** `/mandis/:id`

Full detail view for a single mandi: address, GPS link, operating hours, all commodity prices (sortable table), facilities checklist, and a "Get Directions" button (Google Maps deep-link).

---

### `app/transport/page.tsx` — Transport Cost Calculator
**URL:** `/transport`

Helps farmers decide **where to sell** by computing net profit after transport costs.

**Form inputs:**
- Commodity (dropdown of common crops).
- Quantity (kg).
- Source state & district (cascading dropdowns, hardcoded state→district map).
- Max distance filter (optional).

**On submit:** Calls `transportService.compareCosts(data)` → `POST /transport/compare`.

**Results table:** Each row is a candidate mandi with columns:
- Mandi name, state, distance (km)
- Price per kg, Gross revenue
- Cost breakdown (transport, toll, loading, unloading, mandi fee, commission)
- **Net profit** (highlighted green or red)
- ROI %
- Vehicle recommendation (Tempo / Small Truck / Large Truck)

Rows are sorted by net profit descending. The top result is highlighted as "Best Option".

---

### `app/analytics/page.tsx` — Market Research
**URL:** `/analytics`

Data visualisation and market intelligence page.

**Sections:**
- **Price Trends** — Line charts for selected commodities over time.
- **Market Coverage** — Bar chart of price data volume by state.
- **Top Mandiwise Prices** — Table showing today's highest/lowest prices per commodity.
- **Price Alerts** — Set threshold alerts (stored on backend, delivered via notifications).

Data: various `analyticsService` methods.

---

### `app/inventory/page.tsx` — Inventory Tracker
**URL:** `/inventory`

Records what a farmer currently holds in stock.

**Features:**
- Add new inventory entry (commodity, quantity, purchase price, date).
- List existing inventory entries.
- "Analyze" button calls `inventoryService.analyze()` → `POST /inventory/analyze` — returns AI-powered recommendation on whether to sell now or wait based on price trends.

---

### `app/sales/page.tsx` — Sales Log
**URL:** `/sales`

Records completed sales transactions.

**Features:**
- Log a sale (commodity, quantity, price received, mandi, date).
- View past sales list with totals.
- Sales analytics summary (total revenue, average price, best commodity).

Data: `salesService` → `/sales` endpoints.

---

### `app/community/page.tsx` — Farmer Community Forum
**URL:** `/community`

Full social forum (~1,284 lines — the largest page file).

**Features:**
- **Post feed** — Paginated list of community posts sorted by latest or most liked.
- **Search** — Keyword search across posts.
- **Category filter** — (Market Tips, Weather, Government Schemes, General, etc.)
- **Create post** — Dialog with title, body, category, optional image upload.
- **Like / Unlike** — Heart button with optimistic update.
- **Comments (Replies)** — Expandable reply thread per post. Can add/delete replies.
- **Edit/Delete own posts** — Shown only to post author.
- **Pin/Unpin** — Admin-only action.
- **Moderation** — Admin can delete any post.

Data: `communityService` → `/community/posts` endpoints.

---

### `app/notifications/page.tsx` — Notifications Centre
**URL:** `/notifications`

Lists all system notifications for the logged-in user:
- Price alerts triggered.
- Community replies.
- Admin broadcasts.

Features: Mark as read (individual or bulk), delete, filter by read/unread. Badge count shown in `<NotificationBell>` in the Navbar.

---

### `app/profile/page.tsx` — User Profile
**URL:** `/profile`

Shows and allows editing of the user's profile (name, age, state, district). Also shows account info (phone number, role, join date) and a logout button that calls `useAuthStore.clearAuth()` and redirects to `/login`.

---

### `app/admin/page.tsx` — Admin Panel
**URL:** `/admin`

Only accessible to users with `role === "admin"`. Shows:
- Platform statistics overview.
- User management table (list users, change role, deactivate).
- Broadcast notification sender (sends a message to all users).
- Price data audit tools.

Data: `adminService` → `/admin` endpoints.

---

### `app/api-test/page.tsx` — API Test Harness
**URL:** `/api-test`

Developer-only page. Provides a manual UI to fire raw API requests and inspect responses. Useful for debugging during development. Should be removed or gated before production deployment.

---

## 4. `src/components` — UI Building Blocks

### `components/layout/`

#### `AppLayout.tsx`
The standard page shell used by every authenticated page. Composes `<Sidebar>` + `<Navbar>` + `<main>` in a flex row. All protected pages wrap their content in this component.

```tsx
<AppLayout>
  <YourPageContent />
</AppLayout>
```

#### `Sidebar.tsx`
Fixed left navigation column (hidden on mobile — `hidden lg:flex`). Contains:
- AgriProfit logo/wordmark linking to `/dashboard`.
- Navigation links: Dashboard, Commodities, Mandis, Inventory, Sales, Transport, Market Research, Community, Notifications.
- Admin link (conditionally rendered by reading `localStorage.getItem("user")` and checking `role === "admin"`).
- Active link highlighted with green background.
- User avatar + name + logout button at the bottom.

Uses `usePathname()` to detect the current route and apply the active style.

#### `Navbar.tsx`
Top header bar (visible on all screen sizes). Contains:
- **Hamburger menu** (mobile) — opens a drawer overlay with the same nav links as the Sidebar.
- **Global search bar** — searches commodities AND mandis simultaneously with a 300ms debounce. Shows a dropdown of results; clicking navigates to that commodity or mandi detail page.
- **`<NotificationBell>`** — icon with unread count badge.
- **User avatar dropdown** — links to Profile and Logout.

#### `NotificationBell.tsx`
Bell icon button that displays an unread notification count badge. Polls `notificationsService.getUnreadCount()` every 30 seconds. Navigates to `/notifications` on click.

#### `Footer.tsx`
Minimal footer with copyright text and links (Terms, Privacy Policy). Rendered inside `AppLayout` below `<main>`.

---

### `components/auth/`

#### `AuthLayout.tsx`
Centred card wrapper used by the Login and Register pages. Provides the white card with AgriProfit branding, logo, and page title. Keeps auth pages visually consistent without the main app Sidebar/Navbar.

#### `OtpInput.tsx`
Reusable OTP digit input component. Renders six individual `<input>` boxes that auto-advance focus on each digit entry and handle backspace/paste correctly.

#### `ProtectedRoute.tsx`
> **Note:** Currently a stub (`return children`). Intended to redirect unauthenticated users to `/login`. The actual auth guard logic lives inside each page by checking `useAuthStore`.

---

### `components/dashboard/`

#### `StatCard.tsx`
Single KPI card: icon + title + large value + trend text. Used in the Stats Grid on the dashboard.

#### `StatsGrid.tsx`
4-column responsive grid that renders four `<StatCard>` instances using data passed as props.

#### `CommodityCard.tsx`
Small card showing a commodity's name, current price, and price change percentage for the market prices section.

#### `MarketPricesSection.tsx`
Horizontally scrollable row of `<CommodityCard>` components. Displays live prices for the top commodities fetched from the backend.

#### `PriceChart.tsx`
Recharts `LineChart` wrapper. Accepts `data` (array of `{date, price}`) and renders a styled price trend chart with tooltip and axis formatting for INR.

#### `PriceForecastSection.tsx`
Shows AI price forecast data below the price chart. Displays predicted price range and a confidence percentage.

#### `forecast/` and `tabs/`
Sub-folders with additional dashboard sub-components for forecasting views and tab-based layout sections.

---

### `components/providers/`

#### `QueryProvider.tsx`
Wraps the app in `<QueryClientProvider>` from TanStack Query. Creates a singleton `QueryClient` configured with:
- `staleTime: 30_000` (data considered fresh for 30s before background refetch)
- `retry: 2` (failed requests retried twice)

This must be a Client Component and must wrap all pages — hence its placement in the root `layout.tsx`.

---

### `components/ui/`

All UI primitives come from **shadcn/ui** — a copy-pasteable set of accessible components built on Radix UI primitives styled with Tailwind. They are source files (not an npm package), so they can be freely customised.

| File | Component | Purpose |
|------|-----------|---------|
| `button.tsx` | `<Button>` | Primary, secondary, ghost, destructive, link variants |
| `card.tsx` | `<Card>`, `<CardHeader>`, `<CardContent>`, `<CardTitle>` | Container cards |
| `input.tsx` | `<Input>` | Text input with consistent border/focus ring |
| `label.tsx` | `<Label>` | Form label with htmlFor association |
| `select.tsx` | `<Select>` | Accessible dropdown (Radix `SelectPrimitive`) |
| `dialog.tsx` | `<Dialog>` | Modal dialog with overlay (Radix `DialogPrimitive`) |
| `tabs.tsx` | `<Tabs>` | Tabbed panel (Radix `TabsPrimitive`) |
| `badge.tsx` | `<Badge>` | Small coloured label chip |
| `table.tsx` | `<Table>` | Full `<table>` set with header, body, row, cell |
| `form.tsx` | `<Form>` | react-hook-form integration wrapper |
| `textarea.tsx` | `<Textarea>` | Multi-line text input |
| `checkbox.tsx` | `<Checkbox>` | Radix Checkbox with custom tick styling |
| `alert.tsx` | `<Alert>` | Informational / warning / error alert box |
| `avatar.tsx` | `<Avatar>` | User avatar image with fallback initials |
| `skeleton.tsx` | `<Skeleton>` | Grey pulsing placeholder for loading states |
| `table-skeleton.tsx` | `<TableSkeleton>` | Multi-row `<Skeleton>` layout that mimics a table |
| `empty-state.tsx` | `<EmptyState>` | Icon + heading + description for zero-data states |
| `dropdown-menu.tsx` | `<DropdownMenu>` | Radix contextual menu for avatar/action menus |
| `popover.tsx` | `<Popover>` | Floating contextual panel |
| `tooltip.tsx` | `<Tooltip>` | Hover tooltip (Radix TooltipPrimitive) |
| `sonner.tsx` | `<Toaster>` | Thin wrapper around the `sonner` toast library |

#### `components/ErrorBoundary.tsx`
Class-based React error boundary. Wraps sections of the UI so an error in one widget doesn't crash the whole page. Renders a "Something went wrong" fallback.

---

## 5. `src/services` — API Layer

Every file exports a single service object with methods that call the backend. All methods use the `api` Axios instance from `lib/api.ts` and return typed Promises.

---

### `services/auth.ts`
| Method | HTTP | Endpoint | Purpose |
|--------|------|----------|---------|
| `requestOtp(phoneNumber)` | POST | `/auth/request-otp` | Sends OTP via SMS (or logs in dev) |
| `verifyOtp(phoneNumber, otp)` | POST | `/auth/verify-otp` | Returns JWT + user if OTP correct |
| `completeProfile(profileData)` | POST | `/auth/complete-profile` | Sets name/age/state/district for new user |
| `getCurrentUser()` | GET | `/auth/me` | Returns current authenticated user |
| `logout()` | — | — | Clears `token` and `user` from localStorage |

---

### `services/commodities.ts`
| Method | HTTP | Endpoint | Purpose |
|--------|------|----------|---------|
| `getAll(params?)` | GET | `/commodities` | List all commodities (paginated) |
| `getWithPrices(params?)` | GET | `/commodities/with-prices` | Commodities including latest price |
| `getById(id)` | GET | `/commodities/:id` | Single commodity detail |
| `getPriceHistory(id, params)` | GET | `/commodities/:id/price-history` | Historical prices for charts |
| `search(query)` | GET | `/commodities/search` | Name search for navbar autocomplete |

---

### `services/mandis.ts`
| Method | HTTP | Endpoint | Purpose |
|--------|------|----------|---------|
| `getAll(params?)` | GET | `/mandis` | Simple paginated list |
| `getWithFilters(filters)` | GET | `/mandis/with-filters` | Advanced search with distance, facilities, rating |
| `getById(id)` | GET | `/mandis/:id` | Single mandi with full details |
| `getStates()` | GET | `/mandis/states` | All states that have mandis |
| `getDistricts(state)` | GET | `/mandis/districts` | Districts in a state |
| `search(query)` | GET | `/mandis/search` | Name search for navbar autocomplete |

---

### `services/analytics.ts`
| Method | HTTP | Endpoint | Purpose |
|--------|------|----------|---------|
| `getDashboard()` | GET | `/analytics/dashboard` | KPI summary for dashboard stats grid |
| `getMarketCoverage()` | GET | `/analytics/market-coverage` | State-level price data coverage |
| `getPriceTrends(params)` | GET | `/analytics/price-trends` | Multi-commodity trend data |
| `getTopPrices(params)` | GET | `/analytics/top-prices` | Best/worst prices today |

---

### `services/transport.ts`
| Method | HTTP | Endpoint | Purpose |
|--------|------|----------|---------|
| `compareCosts(data)` | POST | `/transport/compare` | Net profit comparison across mandis |
| `getStates()` | GET | `/mandis/states` | State list (reused) |
| `getDistricts(state)` | GET | `/mandis/districts` | District list (reused) |
| `getVehicles()` | GET | `/transport/vehicles` | Vehicle specs (capacity, rate) |

---

### `services/community.ts`
| Method | HTTP | Endpoint | Purpose |
|--------|------|----------|---------|
| `getPosts(params)` | GET | `/community/posts` | Paginated post feed with filters |
| `createPost(data)` | POST | `/community/posts` | Create a new post |
| `updatePost(id, data)` | PUT | `/community/posts/:id` | Edit own post |
| `deletePost(id)` | DELETE | `/community/posts/:id` | Delete own or admin delete |
| `likePost(id)` | POST | `/community/posts/:id/like` | Toggle like |
| `getReplies(postId)` | GET | `/community/posts/:id/replies` | Load comments |
| `addReply(postId, body)` | POST | `/community/posts/:id/replies` | Add a comment |
| `deleteReply(postId, replyId)` | DELETE | `/community/posts/:id/replies/:rid` | Delete a comment |

---

### `services/notifications.ts`
| Method | HTTP | Endpoint | Purpose |
|--------|------|----------|---------|
| `getAll(params)` | GET | `/notifications` | Paginated notifications list |
| `getUnreadCount()` | GET | `/notifications/unread-count` | Number for navbar bell badge |
| `markRead(id)` | PATCH | `/notifications/:id/read` | Mark one as read |
| `markAllRead()` | POST | `/notifications/mark-all-read` | Clear all unread |
| `delete(id)` | DELETE | `/notifications/:id` | Remove a notification |
| `getActivity()` | GET | `/notifications/activity` | Recent activity feed (dashboard) |

---

### `services/inventory.ts`
| Method | HTTP | Endpoint | Purpose |
|--------|------|----------|---------|
| `getAll()` | GET | `/inventory` | All inventory entries for user |
| `add(data)` | POST | `/inventory` | Add a new stock entry |
| `analyze()` | POST | `/inventory/analyze` | AI sell-or-hold recommendation |

---

### `services/sales.ts`
| Method | HTTP | Endpoint | Purpose |
|--------|------|----------|---------|
| `getAll()` | GET | `/sales` | All sales records for user |
| `add(data)` | POST | `/sales` | Record a new sale |
| `getAnalytics()` | GET | `/sales/analytics` | Revenue totals and trends |

---

### `services/prices.ts`
Thin service for the prices endpoints. Fetches price history directly by mandi, commodity, or date range. Used by charts in the Mandi Detail and Commodity Detail pages.

---

### `services/forecasts.ts`
Fetches ML price forecasts from `/forecasts`. Used in the Commodity Detail page to show predicted price direction.

---

### `services/admin.ts`
Admin-only service. All methods require a token from a user with `role === "admin"`:
- `getStats()` — Platform-wide KPIs.
- `getUsers(params)` — Paginated user list.
- `updateUser(id, data)` — Change role or deactivate.
- `broadcastNotification(data)` — Send to all users.

---

## 6. `src/store` — Global State

### `store/authStore.ts`
Built with **Zustand** — a minimal global state library. Manages authentication state across all components without prop drilling.

**State shape:**
```typescript
{
  user: User | null;           // Logged-in user object
  token: string | null;        // JWT bearer token
  isAuthenticated: boolean;    // Derived: token && user both exist
  isHydrated: boolean;         // True after localStorage has been read
}
```

**Methods:**
- `setAuth(user, token)` — Stores token and user in both Zustand state and `localStorage`. Called after successful OTP verification.
- `clearAuth()` — Removes from state and `localStorage`. Called on logout.
- `hydrate()` — Reads `localStorage` on app load (called once client-side) to restore session from a previous visit. Required because Next.js server-renders pages without access to `localStorage`.

**SSR Safety:** All `localStorage` access is guarded with `typeof window !== 'undefined'` to prevent errors during server rendering.

---

## 7. `src/hooks` — Custom React Hooks

### `hooks/useAuth.ts`
Currently a placeholder stub returning an empty object (`{}`). Intended to be a convenience hook wrapping `useAuthStore` to expose `user`, `isAuthenticated`, and auth methods in a single import. The direct store usage via `useAuthStore` is used instead throughout the app.

### `hooks/useToast.ts`
Wrapper around the `sonner` `toast()` function. Provides typed helpers for common toast patterns:
- `toast.success("message")`
- `toast.error("message")`

---

## 8. `src/lib` — Core Utilities

### `lib/api.ts`
The **central Axios instance** used by all service files. Critical piece — everything HTTP flows through here.

**Configuration:**
- `baseURL`: `process.env.NEXT_PUBLIC_API_URL` or `http://127.0.0.1:8000/api/v1`
- `timeout`: 90,000ms (90 seconds) — intentionally high to handle slow analytics queries.
- `Content-Type: application/json` default header.

**Request Interceptor:**
1. Reads JWT from `localStorage.getItem('token')`.
2. Injects `Authorization: Bearer <token>` header on every request.
3. Records `_startTime` on the config object for performance monitoring.

**Response Interceptor:**
1. On success: computes request duration and calls `perfMonitor.recordAPI()`.
2. On `401 Unauthorized`: clears `localStorage` and redirects to `/login` — handles expired tokens automatically.
3. On any error: still records performance, then re-throws.

**`apiWithLongTimeout`**: A second Axios instance with a 60s timeout, exported for any service that needs distinct timeout behaviour.

### `lib/upload.ts`
Helper for multipart file upload. Wraps the Axios instance with `Content-Type: multipart/form-data` and sends to the `/uploads/images` endpoint. Returns the uploaded file URL.

### `lib/utils.ts`
Re-exports `cn()` — the Tailwind class merging utility (`clsx` + `tailwind-merge`). Used in every component to conditionally combine CSS classes:
```ts
cn("base-class", condition && "conditional-class", props.className)
```

---

## 9. `src/types` — TypeScript Contracts

### `types/index.ts`
All shared TypeScript interfaces used across pages, components, and services. Key types:

| Interface | Description |
|-----------|-------------|
| `User` | Logged-in user: id, phone_number, name, age, state, district, role, language, is_profile_complete |
| `ProfileData` | Form data for profile completion (name, age, state, district) |
| `Commodity` | Commodity record with optional price fields |
| `CommodityWithPrice` | Extended commodity from `/commodities/with-prices` including latest_price, price_change, mandi |
| `Mandi` | Market record: id, name, state, district, lat/lon, facilities, rating |
| `MandiWithDistance` | Mandi plus `distance_km` field returned by `/mandis/with-filters` |
| `MandiDetail` | Full mandi including current prices array |
| `PriceHistory` | Single price record: commodity_id, mandi_id, price, date |
| `AuthResponse` | OTP verify response: access_token, is_new_user, user |
| `Notification` | Notification record: id, type, title, body, is_read, created_at |

Types are imported where needed with `import type { X } from '@/types'`.

---

## 10. `src/utils` — Helper Utilities

### `utils/performance-monitor.ts`
A **development-only** performance tracking tool. Automatically active in `NODE_ENV=development` or when `NEXT_PUBLIC_PERF_MONITOR=true`.

**Responsibilities:**
- Receives `recordAPI(endpoint, duration, status)` calls from the Axios response interceptor.
- Flags any API call slower than **500ms** with a `console.warn` in the browser console.
- Prints a full performance report (slowest calls, total time, page load) on page navigation.

**In production:** All logging is silenced. The class still exists but all methods return immediately after checking the `ENABLED` flag. No production user data is collected.

---

## 11. Data Flow Diagram

```
User Action (click / form submit)
        │
        ▼
   Page Component (app/xxx/page.tsx)
        │ calls
        ▼
   Service Function (services/xxx.ts)
        │ uses
        ▼
   lib/api.ts  ──[Request Interceptor: inject JWT]──►  FastAPI Backend (port 8000)
        │                                                      │
        │◄──────────────[Response Interceptor: record perf]────┘
        │
        ▼
   TanStack Query Cache (useQuery)
        │ updates
        ▼
   React Component State  ──►  Re-render UI

   Auth State Changes:
        authService.verifyOtp()
            └──► useAuthStore.setAuth(user, token)
                    └──► localStorage + Zustand state
                            └──► All components re-render via Zustand subscription
```

---

*Last updated: February 2026*
