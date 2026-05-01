import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = [
  "/",
  /** Client photo gallery (BYOS) — same Next.js app; guests allowed (v1 shell; tokens later) */
  "/client-gallery",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/signup",
  "/privacy-policy",
  "/terms",
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
  "/auth",
  "/site",
  "/site/login",
  "/site/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/payment/callback",
]

const ROLE_PREFIXES: Record<string, string[]> = {
  "/admin": ["admin"],
  "/studio": ["admin", "studio"],
  "/streamer": ["admin", "studio", "streamer"],
}

/**
 * First path segments reserved for app routes — not event slugs at apex (`/{slug}`, `/{slug}/crew`).
 * Omit `events` so `/events` stays public.
 */
const RESERVED_ROOT_SEGMENT = new Set([
  "admin",
  "analytics",
  "api",
  "auth",
  "client-gallery",
  "demo",
  "forgot-password",
  "login",
  "privacy-policy",
  "payment",
  "reset-password",
  "signup",
  "site",
  "streamer",
  "studio",
  "templates",
  "terms",
  "upgrade",
  "watch",
])

function isPublicEventSlugPath(pathname: string): boolean {
  const crew = pathname.match(/^\/([^/]+)\/crew\/?$/)
  if (crew) {
    return !RESERVED_ROOT_SEGMENT.has(crew[1]!.toLowerCase())
  }
  const one = pathname.match(/^\/([^/]+)\/?$/)
  if (!one) return false
  return !RESERVED_ROOT_SEGMENT.has(one[1]!.toLowerCase())
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Normalize event slug URLs to lowercase so /Slug and /SLUG both work (301 to canonical)
  if (isPublicEventSlugPath(pathname)) {
    const lower = pathname.toLowerCase()
    if (lower !== pathname) {
      const url = request.nextUrl.clone()
      url.pathname = lower
      return NextResponse.redirect(url, 301)
    }
  }

  // Allow public paths, static assets, and API routes that handle their own auth
  if (
    PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/")) ||
    isPublicEventSlugPath(pathname) ||
    pathname.startsWith("/api/favicon/") ||
    /** Liveness for Coolify/Docker — must bypass auth (no session cookie on probes) */
    pathname.startsWith("/api/health") ||
    /** Public event payload for watch pages + generateMetadata (no cookies on internal fetch) */
    pathname.startsWith("/api/watch/") ||
    /** SRS RTMP hooks are called by the streaming server without browser cookies. */
    pathname === "/api/publish" ||
    pathname === "/api/unpublish" ||
    /** Host-based studio / platform branding lookup (login page, marketing — no session yet) */
    pathname.startsWith("/api/branding") ||
    /**
     * Stored images (event hero/gallery, branding). GET must be public so previews and watch pages work
     * without a session and when NEXT_PUBLIC_APP_URL host differs slightly from the browser host.
     * POST /api/upload remains authenticated in the route handler.
     */
    pathname.startsWith("/api/uploads") ||
    /** Guest viewer: album by public token (no session) */
    pathname.startsWith("/api/client-gallery/public") ||
    pathname.startsWith("/api/auth") ||
    /** Admin APIs enforce role in route handlers */
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/placeholder") ||
    pathname.match(/\.\w+$/) // static files
  ) {
    return NextResponse.next()
  }

  const sessionToken = request.cookies.get("sm_session")?.value

  if (!sessionToken) {
    // Redirect to login for protected pages, return 401 for API
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // Admin routes: redirect to admin login
    if (pathname.startsWith("/admin")) {
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
    const loginUrl = new URL("/site/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Note: Full role checking happens in API routes and server components
  // because middleware can't make DB calls efficiently.
  // The cookie existence check prevents unauthenticated access.
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|placeholder.svg).*)",
  ],
}
