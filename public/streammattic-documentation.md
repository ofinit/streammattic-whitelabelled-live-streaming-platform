# StreamLivee - White-Label Live Streaming Platform

## Complete Technical Documentation

**Version:** 1.0.0  
**Last Updated:** March 2026  
**Stack:** Next.js 16, React 19, TypeScript, PostgreSQL, TailwindCSS 4

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Database Schema](#3-database-schema)
4. [Authentication System](#4-authentication-system)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Core Features](#6-core-features)
7. [API Reference](#7-api-reference)
8. [Payment Integration](#8-payment-integration)
9. [Streaming Infrastructure](#9-streaming-infrastructure)
10. [White-Label & Branding](#10-white-label--branding)
11. [Environment Variables](#11-environment-variables)
12. [File Structure](#12-file-structure)

---

## 1. Project Overview

StreamLivee is a multi-tenant white-label live streaming platform that allows:

- **Platform Admin** to manage the entire platform, studios, and streamers
- **Studios** to create their own branded streaming portals with custom domains
- **Streamers** to create and manage live streaming events

### Key Business Model

- **Credits-based system**: Users purchase stream credits (RTMP, YouTube API, YouTube Embed, Third Party)
- **Wallet system**: INR wallet balance for purchasing credits and services
- **Volume discounts**: Bulk credit purchases unlock tiered pricing
- **Event validity**: Events have 30-day default validity, extendable with credits
- **Annual subscriptions**: Studios pay annual fees for white-label hosting

---

## 2. Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, TailwindCSS 4, shadcn/ui |
| Database | PostgreSQL (managed or self-hosted) |
| Authentication | Custom cookie-based sessions (NextAuth) |
| Payments | Razorpay, Instamojo |
| Streaming | Nimble Streamer, SRS, Nginx-RTMP, MediaMTX |
| File Storage | Local filesystem (`/app/uploads` in Docker; see `UPLOAD_DIR`) |
| Deployment | Docker / VPS (e.g. CloudJiffy Jelastic); see `docs/deploy-cloudjiffy.md` |

### Application Structure

```
app/
├── admin/          # Admin dashboard (platform management)
├── studio/         # Studio dashboard (white-label management)
├── streamer/       # Streamer dashboard (event management)
├── site/           # Public pages (login, register)
├── api/            # API routes
├── payment/        # Payment callback pages
├── watch/          # Public event viewer
└── events/         # Public events listing
```

---

## 3. Database Schema

### Core Tables (21 Total)

#### User & Auth

| Table | Purpose |
|-------|---------|
| `users` | All user accounts (admin, studio, streamer) |
| `sessions` | Active login sessions (token-based) |

#### Financial

| Table | Purpose |
|-------|---------|
| `wallets` | User wallet balances (INR, stored in paise) |
| `wallet_transactions` | All wallet credits/debits with audit trail |
| `user_credits` | Per-user stream type credit balances |
| `credit_purchases` | History of wallet-to-credits conversions |
| `credit_deductions` | History of credit usage (events, validity) |
| `orders` | All purchase orders (credits, wallet recharge, etc.) |
| `payments` | Payment gateway transaction records |
| `payment_gateway_configs` | Per-user payment gateway settings |
| `invoices` | GST invoices for transactions |
| `gst_configurations` | User GST/tax settings |

#### Events & Streaming

| Table | Purpose |
|-------|---------|
| `events` | Live streaming events |
| `event_templates` | Pre-defined event templates |
| `youtube_channels` | Connected YouTube channels for API streaming |

#### Studio & Branding

| Table | Purpose |
|-------|---------|
| `studio_branding` | White-label branding settings per studio |
| `domains` | Custom domains for studios |

#### Administration

| Table | Purpose |
|-------|---------|
| `notifications` | User notifications |
| `platform_settings` | Global platform configuration (JSON) |
| `refund_requests` | Refund request workflow |
| `wallet_adjustments` | Admin wallet adjustment audit log |

### Key ENUMs

```sql
user_role: admin | studio | streamer
user_status: active | suspended | pending | deactivated
event_status: draft | scheduled | live | ended | cancelled
stream_type_key: rtmp | youtube_api | youtube_embed | third_party
order_type: credit_purchase | wallet_recharge | validity_extension | service_charge | studio_upgrade | annual_subscription
order_status: pending | completed | failed | refunded | cancelled
payment_gateway: razorpay | instamojo | wallet | manual
payment_status: pending | processing | completed | failed | refunded
```

### Entity Relationships

```
users (1) ──── (1) wallets
users (1) ──── (1) user_credits
users (1) ──── (N) sessions
users (1) ──── (N) events
users (1) ──── (N) orders
users (1) ──── (1) studio_branding
users (1) ──── (N) domains
wallets (1) ──── (N) wallet_transactions
orders (1) ──── (N) payments
events (N) ──── (1) event_templates
```

---

## 4. Authentication System

### Overview

- **Password hashing**: PBKDF2 with SHA-256 (100,000 iterations) via Web Crypto API
- **Session storage**: Database-backed with random tokens
- **Cookie**: `sm_session` (httpOnly, secure in production, 30-day expiry)

### Auth Flow

```
1. User submits login form
2. POST /api/auth/login validates credentials
3. Session created in `sessions` table with random token
4. Token set in httpOnly cookie `sm_session`
5. Middleware checks cookie existence on protected routes
6. API routes verify session via `getCurrentUser()`
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | Password hashing, session CRUD, user creation |
| `lib/auth-context.tsx` | Client-side auth state (React Context) |
| `middleware.ts` | Route protection (cookie check) |
| `app/api/auth/*` | Auth API endpoints |

### Impersonation

Admins can impersonate any user:
- State stored in sessionStorage (not persisted across tabs)
- Original admin identity preserved for "stop impersonating"
- Route redirects based on impersonated user's role

---

## 5. User Roles & Permissions

### Role Hierarchy

| Role | Access | Description |
|------|--------|-------------|
| `admin` | `/admin/*`, `/studio/*`, `/streamer/*` | Platform owner, full access |
| `studio` | `/studio/*`, `/streamer/*` | White-label operators |
| `streamer` | `/streamer/*` | End users creating events |

### Permission Matrix

| Feature | Admin | Studio | Streamer |
|---------|-------|--------|----------|
| Manage platform settings | Yes | No | No |
| View all users | Yes | Own users | No |
| Manage studios | Yes | No | No |
| Create events | Yes | Yes | Yes |
| Custom branding | No | Yes | No |
| Custom domains | No | Yes | No |
| View analytics | Platform | Own | Own |
| Wallet adjustments | Yes | No | No |
| Process refunds | Yes | No | No |

---

## 6. Core Features

### 6.1 Wallet System

- Balance stored in **paise** (1 INR = 100 paise)
- Top-up via Razorpay/Instamojo
- Deductions for credit purchases and services
- Full transaction history with categories

**Transaction Categories:**
```typescript
'top_up' | 'credit_purchase' | 'service_charge' | 'order_refund' |
'adjustment' | 'manual_adjustment' | 'payment_recovery' | 'compensation' |
'correction' | 'goodwill' | 'ai_image_generation' | 'whitelabel_hosting' |
'domain_registration' | 'studio_upgrade' | 'annual_subscription'
```

### 6.2 Credits System

Four stream types with independent credit pools:

| Stream Type | Description | Base Price |
|-------------|-------------|------------|
| `rtmp` | OBS/Wirecast RTMP streaming | 15.00 INR |
| `youtube_api` | Direct YouTube API broadcast | 10.00 INR |
| `youtube_embed` | Embed existing YouTube stream | 5.00 INR |
| `third_party` | External embed codes | 4.00 INR |

**Volume Discounts:**
- 5+ credits: 10% off
- 10+ credits: 20% off
- 25+ credits: 30% off
- 50+ credits: 40% off

### 6.3 Event Lifecycle

```
draft → scheduled → live → ended
                 ↘ cancelled
```

- **Default validity**: 30 days from creation
- **Extensions**: Purchase with credits (60/90/180/365 days)
- **Credit consumption**: 1 credit per event creation

### 6.4 Orders

Order types and their purposes:

| Order Type | Purpose |
|------------|---------|
| `credit_purchase` | Buy stream credits from wallet |
| `wallet_recharge` | Add funds to wallet via gateway |
| `validity_extension` | Extend event validity |
| `service_charge` | AI image, domain, etc. |
| `studio_upgrade` | Convert streamer to studio |
| `annual_subscription` | Studio yearly subscription |

---

## 7. API Reference

### Authentication

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | New user registration |
| `/api/auth/logout` | POST | End session |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/change-password` | POST | Change password |
| `/api/auth/impersonate` | POST | Admin impersonation |

### Users

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/users` | GET | List users (filtered) |
| `/api/users` | POST | Create user |
| `/api/users/[id]` | GET | Get user by ID |
| `/api/users/[id]` | PUT | Update user |

### Wallet

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/wallets` | GET | Get wallet balance |
| `/api/wallets/transactions` | GET | Transaction history |
| `/api/wallets/adjust` | POST | Admin wallet adjustment |

### Credits

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/credits` | GET | Get user credits |
| `/api/credits/pricing` | GET | Get pricing tiers |
| `/api/credits/purchase` | POST | Buy credits from wallet |

### Events

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/events` | GET | List events |
| `/api/events` | POST | Create event |
| `/api/events/[id]` | GET | Get event details |
| `/api/events/[id]` | PUT | Update event |
| `/api/events/[id]` | DELETE | Delete event |

### Payments

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payments/create` | POST | Initiate payment |
| `/api/payments/verify/razorpay` | POST | Verify Razorpay payment |
| `/api/payments/verify/instamojo` | POST | Verify Instamojo payment |

### Dashboard

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dashboard` | GET | User dashboard stats |
| `/api/admin/dashboard` | GET | Admin platform stats |
| `/api/studio/dashboard` | GET | Studio-specific stats |

### Other

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/notifications` | GET | Get notifications |
| `/api/notifications/read` | POST | Mark as read |
| `/api/settings` | GET/PUT | Platform settings |
| `/api/branding` | GET/PUT | Studio branding |
| `/api/refunds` | GET/POST | Refund requests |

---

## 8. Payment Integration

### Supported Gateways

#### Razorpay

- Order-based flow with signature verification
- HMAC SHA-256 signature validation
- Supports refunds via API

**Flow:**
1. Create Razorpay order via API
2. Frontend opens Razorpay checkout
3. On success, frontend sends order_id, payment_id, signature
4. Backend verifies HMAC signature
5. Process wallet credit

#### Instamojo

- Redirect-based flow (no webhooks)
- Payment request creation via API
- Redirect URL verification

**Flow:**
1. Create payment request, get redirect URL
2. User completes payment on Instamojo
3. User redirected to callback with payment_id
4. Backend queries Instamojo API to verify status
5. Process wallet credit

### Payment Callback

All payment completions redirect to `/payment/callback` which:
- Extracts gateway and payment info from URL params
- Calls appropriate verification API
- Shows success/failure UI
- Provides navigation back to dashboard

---

## 9. Streaming Infrastructure

### Supported Backends

| Backend | Type | Use Case |
|---------|------|----------|
| Nimble Streamer | Commercial | Production, high scale |
| SRS | Open Source | Self-hosted, feature-rich |
| Nginx-RTMP | Open Source | Simple self-hosted |
| MediaMTX | Open Source | Modern, lightweight |

### Stream Types

| Type | Input | Output | Credits |
|------|-------|--------|---------|
| RTMP | OBS/Wirecast | HLS/DASH | 1 |
| YouTube API | Platform creates broadcast | YouTube Live | 1 |
| YouTube Embed | Existing YouTube URL | Embedded player | 1 |
| Third Party | External embed code | Iframe | 1 |

### Stream Flow (RTMP)

```
1. User creates event with stream_type = 'rtmp'
2. System generates stream key and RTMP URL
3. User configures OBS with RTMP credentials
4. User starts streaming
5. Viewers access HLS/DASH playback URL
6. Event status transitions: scheduled → live → ended
```

### Provider Abstraction

```typescript
// lib/streaming/types.ts
interface StreamingProvider {
  createStream(event: LiveEvent): Promise<StreamConfig>
  startStream(event: LiveEvent): Promise<boolean>
  stopStream(event: LiveEvent): Promise<boolean>
  getStreamStatus(event: LiveEvent): Promise<StreamStatus>
}
```

---

## 10. White-Label & Branding

### Studio Branding Options

| Field | Type | Description |
|-------|------|-------------|
| `platform_name` | String | Custom platform name |
| `logo` | URL | Company logo |
| `favicon` | URL | Browser favicon |
| `primary_color` | Hex | Theme primary color |
| `secondary_color` | Hex | Theme secondary color |
| `support_email` | String | Customer support email |
| `support_phone` | String | Customer support phone |
| `hero_image` | URL | Landing page hero |
| `services` | JSON | Featured services list |
| `testimonials` | JSON | Customer testimonials |
| `meta_title` | String | SEO title |
| `meta_description` | String | SEO description |

### Custom Domains

- Studios can add custom domains
- DNS verification via TXT record
- SSL provisioning (pending → active)
- Primary domain designation

---

## 11. Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (any standard Postgres host) |
| `AUTH_SECRET` | Secret for auth/session signing (required in production; change from defaults!) |

### Payment Gateways

| Variable | Description |
|----------|-------------|
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret |
| `INSTAMOJO_API_KEY` | Instamojo API key |
| `INSTAMOJO_AUTH_TOKEN` | Instamojo auth token |
| `INSTAMOJO_BASE_URL` | Instamojo API URL (test/production) |

### Optional

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Public app URL |
| `NEXT_PUBLIC_PLATFORM_A_RECORD_IP` | Optional: apex DNS target shown in admin domain help (your app server IP) |
| `NEXT_PUBLIC_PLATFORM_CNAME_TARGET` | Optional: CNAME target for subdomains in admin domain help |
| `CLOUDFLARE_API_TOKEN` | For DNS management |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone ID |

---

## 12. File Structure

```
streamlivee/
├── app/
│   ├── admin/                 # Admin dashboard pages
│   │   ├── analytics/
│   │   ├── events/
│   │   ├── orders/
│   │   ├── settings/
│   │   ├── streamers/
│   │   ├── studios/
│   │   ├── wallets/
│   │   └── page.tsx
│   ├── studio/                # Studio dashboard pages
│   │   ├── branding/
│   │   ├── domains/
│   │   ├── events/
│   │   └── page.tsx
│   ├── streamer/              # Streamer dashboard pages
│   │   ├── events/
│   │   ├── wallet/
│   │   └── page.tsx
│   ├── api/                   # API routes
│   │   ├── auth/
│   │   ├── users/
│   │   ├── wallets/
│   │   ├── credits/
│   │   ├── events/
│   │   ├── orders/
│   │   ├── payments/
│   │   └── ...
│   ├── site/                  # Public pages
│   │   ├── login/
│   │   └── page.tsx
│   ├── payment/
│   │   └── callback/
│   └── layout.tsx
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── admin/                 # Admin-specific components
│   ├── studio/                # Studio-specific components
│   └── streamer/              # Streamer-specific components
├── lib/
│   ├── api.ts                 # API client
│   ├── api-helpers.ts         # API route helpers
│   ├── auth.ts                # Authentication logic
│   ├── auth-context.tsx       # Auth React context
│   ├── db.ts                  # Database connection
│   ├── db-queries.ts          # Database query functions
│   ├── payment-service.ts     # Payment gateway integration
│   ├── streaming-service.ts   # Streaming service (legacy)
│   ├── streaming/             # Multi-provider streaming
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── nimble-provider.ts
│   │   ├── srs-provider.ts
│   │   ├── nginx-rtmp-provider.ts
│   │   └── mediamtx-provider.ts
│   ├── types.ts               # TypeScript type definitions
│   └── utils.ts               # Utility functions
├── scripts/
│   ├── run-migration.js       # Canonical schema migration (uses DATABASE_URL)
│   ├── jelastic-init-db.sql   # Optional: create DB user on CloudJiffy Postgres
│   └── ...
├── middleware.ts              # Route protection
├── package.json
└── tsconfig.json
```

---

## Quick Start

### 1. Database Setup

```bash
# Apply schema (uses DATABASE_URL from .env.local or your env file)
npm run db:migrate

# Production / CloudJiffy VPS: copy .env.production.example to .env.production, then:
# npm run db:migrate:production
```

### 2. Default Admin Login

```
Email: admin@streamlivee.com
Password: Admin@123
```

### 3. Environment Setup

```bash
# .env.local (see .env.example)
DATABASE_URL=postgresql://...
AUTH_SECRET=your-secure-secret-here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
# RAZORPAY_KEY_ID=rzp_test_xxx
# RAZORPAY_KEY_SECRET=xxx
```

### 4. Run Development Server

```bash
npm install
npm run dev
```

---

## Support

For technical support or questions, contact the platform administrator.

---

*This documentation was auto-generated for StreamLivee v1.0.0*
