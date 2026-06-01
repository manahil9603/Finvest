# Finvest 🇵🇰

**Pakistan's SME Investment & Acquisition Marketplace**

Finvest connects verified Pakistani business owners with investors and buyers across all 7 provinces — no middlemen, no commission. Built with Next.js 15, Prisma, Socket.io, and a complete dark-mode design system.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [Seed Data & Test Credentials](#seed-data--test-credentials)
5. [Development Server](#development-server)
6. [Project Structure](#project-structure)
7. [API Reference](#api-reference)
8. [Deployment Guide (Render + Neon PostgreSQL)](#deployment-guide)
9. [Tech Stack](#tech-stack)
10. [Security Notes](#security-notes)
11. [Final Checklist](#final-checklist)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (see Environment Variables section)
cp .env.example .env.local
# → edit .env.local with your DATABASE_URL and JWT_SECRET

# 3. Run database migrations
npx prisma migrate dev --name init

# 4. Seed the database
npx prisma db seed

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** `npm run dev` starts a custom Node.js server that runs both **Next.js** and **Socket.io** on the same port.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Min 32 chars — used to sign auth tokens |
| `NEXTAUTH_URL` | ✅ | Full URL of your app (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_SOCKET_URL` | Optional | Socket.io URL. Leave empty for same-origin, or set to your Render app URL |
| `ALLOWED_ORIGINS` | Optional | Comma-separated extra CORS origins |
| `NODE_ENV` | Optional | `development` / `production` |
| `PORT` | Optional | Next.js port (default: `3000`) |
| `SOCKET_PORT` | Optional | Legacy compatibility only; Socket.io now runs on `PORT` |

### Generate a secure JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Database Setup

### Option A — Local PostgreSQL

```bash
# macOS / Homebrew
brew install postgresql && brew services start postgresql
createdb finvest

# Ubuntu / Debian
sudo apt install postgresql
sudo -u postgres createdb finvest

# Windows
# Download installer from https://www.postgresql.org/download/windows/
```

Set in `.env.local`:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/finvest"
```

### Option B — Docker

```bash
docker run -d \
  --name finvest-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=finvest \
  -p 5432:5432 \
  postgres:16-alpine
```

### Run migrations

```bash
# Create and apply all migrations
npx prisma migrate dev --name init

# Or if you just want to push the schema (no migration history)
npm run db:push

# Generate Prisma client after schema changes
npm run db:generate
```

### Useful database commands

```bash
npm run db:migrate   # Apply pending migrations
npm run db:seed      # Seed the database
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:reset     # Reset DB and re-run all migrations (destructive!)
```

---

## Seed Data & Test Credentials

Run the seed to populate 5 demo users and 8 sample Pakistani businesses:

```bash
npx prisma db seed
# or
npm run db:seed
```

### Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@finvest.pk` | `Admin@123!` |
| Business Owner | `ahmed@finvest.pk` | `Owner@123!` |
| Business Owner 2 | `zainab@finvest.pk` | `Owner2@123!` |
| Investor | `sara@finvest.pk` | `Investor@123!` |
| Buyer | `omar@finvest.pk` | `Buyer@123!` |

### Seeded businesses (8)

| Business | Industry | Stage | Province | Type |
|---|---|---|---|---|
| TechHub PK – B2B HR SaaS | Technology | Startup | Punjab | Investment |
| Punjab Textile Export Mills | Textile | Mature | Punjab | Acquisition |
| SwiftDeliver Logistics | Logistics | Growing | Punjab | Investment |
| Shalimar Rice & Basmati Export | Agriculture | Mature | Punjab | Partnership |
| MediCare Diagnostics (9 branches) | Healthcare | Expanding | Sindh | Acquisition |
| UrbanBite QSR Chain (6 outlets) | Food & Beverage | Growing | Sindh | Investment |
| BrightMinds EdTech | Education | Startup | Sindh | Investment |
| PakBuild Engineering | Construction | Mature | KPK | Acquisition |

---

## Development Server

```bash
npm run dev          # Custom server: Next.js + Socket.io on one port
npm run dev:next     # Next.js only (no real-time)
npm run build        # Production build
npm start            # Custom server (set NODE_ENV=production in production)
npm run lint         # ESLint
```

---

## Project Structure

```
finvest/
├── prisma/
│   ├── schema.prisma      # Database schema (6 models, 8 enums)
│   └── seed.ts            # Demo data seeder
│
├── public/
│   ├── manifest.json      # PWA manifest
│   └── favicon.ico        # (add your own)
│
├── server.ts              # Custom server: Next.js + Socket.io
│
└── src/
    ├── app/               # Next.js App Router pages
    │   ├── (auth)/        # Login, signup (no navbar/footer)
    │   ├── (dashboard)/   # Protected pages with shared layout
    │   │   ├── admin/         → /admin
    │   │   ├── dashboard/
    │   │   │   ├── business/  → /dashboard/business
    │   │   │   ├── investor/  → /dashboard/investor
    │   │   │   └── buyer/     → /dashboard/buyer
    │   │   ├── listings/      → /listings (public browse)
    │   │   ├── messages/      → /messages
    │   │   └── profile/       → /profile
    │   ├── about/             → /about
    │   ├── businesses/[id]/   → /businesses/:id (profile page)
    │   ├── contact/           → /contact
    │   ├── explore/           → /explore (search + filter)
    │   ├── faq/               → /faq
    │   ├── how-it-works/      → /how-it-works
    │   ├── pricing/           → /pricing
    │   ├── api/               # API route handlers
    │   ├── error.tsx          # Global error boundary
    │   ├── global-error.tsx   # Root error boundary
    │   ├── loading.tsx        # Root loading state
    │   └── not-found.tsx      # 404 page
    │
    ├── components/
    │   ├── admin/             # Admin dashboard components
    │   ├── businesses/        # Business profile page components
    │   ├── chat/              # Legacy chat window
    │   ├── dashboard/         # Role-specific dashboard components
    │   │   ├── business/
    │   │   ├── buyer/
    │   │   └── investor/
    │   ├── explore/           # Explore page components
    │   ├── home/              # Landing page sections
    │   ├── layout/            # Navbar, Footer, Disclaimer
    │   ├── listings/          # Listing card components
    │   ├── messages/          # Chat interface
    │   ├── pages/             # Static page components
    │   ├── providers/         # React context providers
    │   └── ui/                # Design system (Button, Card, Badge, etc.)
    │
    ├── hooks/
    │   ├── useAuth.ts         # Client-side auth hook
    │   ├── useSocket.ts       # Socket.io + polling fallback
    │   └── useToast.ts        # Toast notification hook
    │
    └── lib/
        ├── auth.ts            # JWT helpers, cookie management
        ├── constants.ts       # Pakistani cities, role metadata
        ├── cors.ts            # CORS headers helper
        ├── db.ts              # Prisma client singleton
        ├── env.ts             # Validated environment variables
        ├── permissions.ts     # Role/ownership guard helpers
        ├── rateLimit.ts       # In-memory rate limiter
        ├── rbac.ts            # Route permission rules
        ├── sanitize.ts        # Input sanitization
        ├── trust.ts           # Trust score computation
        ├── utils.ts           # formatPKR, timeAgo, cn, label maps
        └── validation.ts      # Zod schemas for all API inputs
```

---

## API Reference

All endpoints return JSON: `{ data?, error?, message? }`.
Auth endpoints set an httpOnly cookie (`finvest_token`).

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account. Rate: 5/15min per IP |
| POST | `/api/auth/login` | — | Sign in. Rate: 5/15min per IP + per email |
| POST | `/api/auth/logout` | — | Clear auth cookie |
| GET | `/api/auth/me` | ✅ | Current user profile |

**Register body:**
```json
{
  "name": "Ahmed Khan",
  "email": "ahmed@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "role": "BUSINESS_OWNER",
  "phone": "+923001234567",
  "city": "Lahore"
}
```

**Login body:**
```json
{ "email": "ahmed@example.com", "password": "SecurePass123" }
```

**Login response:**
```json
{
  "data": { "id": "...", "name": "Ahmed", "role": "BUSINESS_OWNER" },
  "redirect": "/dashboard/business"
}
```

---

### Businesses

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/businesses` | — | List/search businesses (paginated, filtered) |
| POST | `/api/businesses` | BUSINESS_OWNER | Create listing |
| GET | `/api/businesses/featured` | — | Featured listings |
| GET | `/api/businesses/recommended` | ✅ | Personalised (uses InvestorProfile) |
| GET | `/api/businesses/saved` | ✅ | Current user's watchlist |
| GET | `/api/businesses/:id` | — | Single business profile |
| PUT | `/api/businesses/:id` | Owner/ADMIN | Update listing |
| DELETE | `/api/businesses/:id` | Owner/ADMIN | Delete listing (cascade) |
| POST | `/api/businesses/:id/boost` | Owner | Toggle featured flag |
| POST | `/api/businesses/:id/save` | ✅ | Toggle save/unsave |
| DELETE | `/api/businesses/:id/save` | ✅ | Explicit unsave |

**GET /api/businesses — query params:**

| Param | Type | Example |
|---|---|---|
| `q` | string | `?q=textile` |
| `industry` | enum | `?industry=TECHNOLOGY` |
| `province` | enum | `?province=PUNJAB` |
| `listingType` | enum | `?listingType=ACQUISITION` |
| `stage` | csv enum | `?stage=STARTUP,GROWING` |
| `minAskingPrice` | number (PKR) | `?minAskingPrice=10000000` |
| `maxAskingPrice` | number (PKR) | `?maxAskingPrice=50000000` |
| `verifiedOnly` | boolean | `?verifiedOnly=true` |
| `minTrustScore` | 0–100 | `?minTrustScore=60` |
| `sortBy` | enum | `?sortBy=trustScore` |
| `page` | number | `?page=2` |

---

### Connections

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/connections` | INVESTOR/BUYER | Send connection request |
| GET | `/api/connections` | ✅ | My outgoing requests |
| GET | `/api/connections/:id` | ✅ | Single connection |
| PUT | `/api/connections/:id` | Receiver | Accept or reject |

**POST /api/connections body:**
```json
{
  "businessId": "uuid",
  "message": "Hi, I'm interested in investing...",
  "type": "INVESTMENT"
}
```

**PUT /api/connections/:id body:**
```json
{
  "status": "ACCEPTED",
  "responseNote": "Happy to connect! I'll send you our data room."
}
```

---

### Messages

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/messages` | ✅ | Inbox (latest per conversation) |
| POST | `/api/messages` | ✅ | Send (body: `{recipientId, content}`) |
| GET | `/api/messages/:userId` | ✅ | Full conversation thread |
| POST | `/api/messages/:userId` | ✅ | Send to specific user |

> **Gate:** Only users with an **accepted** ConnectionRequest can message each other. ADMINs are exempt.

Rate limit: 60 messages per minute per user.

---

### Investor Profile

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/investor-profile` | INVESTOR | Fetch my profile |
| POST | `/api/investor-profile` | INVESTOR | Create or update (upsert) |

**POST body:**
```json
{
  "minInvestment": 5000000,
  "maxInvestment": 50000000,
  "preferredIndustries": ["TECHNOLOGY", "FOOD_BEVERAGE"],
  "preferredProvinces": ["PUNJAB", "SINDH"],
  "investmentThesis": "I back founders solving real problems...",
  "portfolioSize": 11,
  "accredited": true
}
```

---

### Admin (ADMIN role only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Platform overview + 8-week timeseries |
| PUT | `/api/admin/verify/:businessId` | Approve or reject a listing |
| PUT | `/api/admin/trust/:businessId` | Set owner verified status |
| GET | `/api/admin/users` | Paginated user list (`?q=&role=&page=`) |
| PUT | `/api/admin/users/:id` | Suspend, verify, or change role |
| DELETE | `/api/admin/users/:id` | Permanently delete user + all data |

---

### Profile

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| PATCH | `/api/profile` | ✅ | Update name, phone, city, bio |

---

## Deployment Guide

### Deploy to Render + Neon PostgreSQL

#### 1. Create a Neon database

1. Sign up at [neon.tech](https://neon.tech) (free tier available)
2. Create a project → get the connection string
3. It looks like: `postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

#### 2. Push to GitHub

```bash
git init
git add .
git commit -m "feat: initial Finvest commit"
git remote add origin https://github.com/yourusername/finvest.git
git push -u origin main
```

#### 3. Create a Render Web Service

1. Go to [render.com](https://render.com) and create a **Web Service** from your GitHub repo.
2. Runtime: **Node**.
3. Build command:

```bash
npm install && npx prisma generate && npm run build
```

4. Start command:

```bash
npm run start
```

5. Add environment variables:

| Key | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `JWT_SECRET` | 48-char random hex string |
| `NEXTAUTH_URL` | `https://your-render-app.onrender.com` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://your-render-app.onrender.com` |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `SOCKET_PORT` | `10000` |

6. Click **Deploy**.

#### 4. Initialize the production database

This repo currently uses `prisma db push` style schema sync. After adding `DATABASE_URL`, run this once against Neon:

```bash
npx prisma db push
```

If you later add Prisma migrations, use `npx prisma migrate deploy` for production instead.

#### 5. Socket.io on production

Render exposes one public port for the web service, so `server.ts` attaches Socket.io to the same HTTP server as Next.js. No separate `3001` service is required.

For local development, leave `NEXT_PUBLIC_SOCKET_URL` empty to use the current origin. On Render, set it to the same value as `NEXTAUTH_URL`.

---

### Using Supabase PostgreSQL (alternative to Neon)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection string** → copy URI
3. Append `?pgbouncer=true&connection_limit=1` for serverless deployments
4. Use it as `DATABASE_URL`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Database | PostgreSQL (via Prisma ORM) |
| Authentication | JWT (HS256, 7-day) + httpOnly cookies |
| Password hashing | bcrypt (12 rounds) |
| Real-time | Socket.io on the same port as Next.js, with polling fallback |
| Animations | Framer Motion |
| Validation | Zod |
| Rate limiting | In-memory sliding window |
| Input sanitization | Custom server-side sanitizer |

---

## Security Notes

- **JWT** tokens use `audience: 'finvest-app'` + `issuer: 'finvest'` — tokens from other systems are rejected
- **bcrypt** uses 12 rounds (~250 ms/hash), which meets OWASP recommendations
- **Rate limiting**: Auth routes are capped at 5 attempts/15 min per IP **and** per email
- **Input sanitization**: All user-provided text is stripped of HTML tags, null bytes, and script URIs before DB writes
- **CORS**: API routes only accept requests from origins listed in `NEXTAUTH_URL` + `ALLOWED_ORIGINS`
- **CSP**: Full Content-Security-Policy header prevents XSS and clickjacking
- **Ownership**: Every PUT/DELETE on a business verifies `ownerId === userId` or `role === ADMIN` — users cannot edit others' businesses
- **Admin double-gate**: Admin API routes are protected by **both** the Next.js middleware (edge) and an in-handler role check
- **Messaging gate**: Users can only message each other if an `ACCEPTED` ConnectionRequest exists between them
- In production: set `sameSite: 'strict'` (done automatically via `NODE_ENV=production`)

---

## Final Checklist

### Before running locally ✅

- [ ] `cp .env.example .env.local` and fill in `DATABASE_URL` and `JWT_SECRET`
- [ ] PostgreSQL is running (`psql -U postgres -c "SELECT 1"`)
- [ ] `npm install` completed without errors
- [ ] `npx prisma migrate dev --name init` completed
- [ ] `npx prisma db seed` seeded 5 users and 8 businesses
- [ ] `npm run dev` starts without errors on port 3000

### Before deploying to production ✅

- [ ] `JWT_SECRET` is at least 48 random hex characters (not the example placeholder)
- [ ] `DATABASE_URL` points to a managed Postgres instance (not localhost)
- [ ] `NEXTAUTH_URL` is your real domain with `https://`
- [ ] `NODE_ENV=production` is set
- [ ] `npm run build` completes without TypeScript or build errors
- [ ] Production Neon schema initialized (`npx prisma db push`, or `prisma migrate deploy` if migrations are added)
- [ ] No `.env.local` or secrets committed to git (check `.gitignore`)
- [ ] Render `PORT` and socket URL point to the same deployed app URL
- [ ] OG image (`/public/og-image.png`, 1200×630) created for social sharing
- [ ] Favicon files placed in `/public/` (favicon.ico, favicon-32×32.png, apple-touch-icon.png)

### Feature checklist ✅

- [x] Authentication (register, login, logout, role-based redirect)
- [x] Business listings (CRUD, boost, save, trust score)
- [x] Explore page (search, 8-filter sidebar, pagination, skeleton loading)
- [x] Business profile page (`/businesses/:id`)
- [x] Connection requests (send, accept, reject, gate check)
- [x] Real-time messaging (Socket.io + polling fallback, typing indicator)
- [x] Role dashboards (Business Owner, Investor, Buyer)
- [x] Admin control centre (stats, approvals, user management)
- [x] Investor preferences + personalised recommendations
- [x] Buyer acquisition watchlist
- [x] Marketing pages (About, How It Works, FAQ, Contact, Pricing)
- [x] Dark mode default with light mode toggle
- [x] Legal disclaimer on every page
- [x] Rate limiting on auth and write endpoints
- [x] Input sanitization (HTML stripping)
- [x] Security headers (CSP, HSTS, X-Frame-Options)
- [x] CORS configured
- [x] Skip-to-content accessibility link
- [x] Error boundaries (global, dashboard, page-level)
- [x] Loading states (root, dashboard, skeletons)
- [x] 404 not-found page
- [x] SEO metadata with OpenGraph + Twitter Card
- [x] PWA manifest

---

## Legal

Finvest is a marketplace platform only. It does not provide financial advice, handle investment funds, or guarantee any transactions. All users are solely responsible for their own due diligence.

Not registered with or regulated by the Securities and Exchange Commission of Pakistan (SECP).

© 2026 Finvest Pakistan. All rights reserved.
