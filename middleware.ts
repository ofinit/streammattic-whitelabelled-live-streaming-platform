import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = [
  "/",
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
  "api",
  "auth",
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

  // Allow public paths, static assets, and API routes that handle their own auth
  if (
    PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/")) ||
    isPublicEventSlugPath(pathname) ||
    pathname.startsWith("/api/favicon/") ||
    /** Liveness for Coolify/Docker — must bypass auth (no session cookie on probes) */
    pathname.startsWith("/api/health") ||
    /** Public event payload for watch pages + generateMetadata (no cookies on internal fetch) */
    pathname.startsWith("/api/watch/") ||
    /** Host-based studio / platform branding lookup (login page, marketing — no session yet) */
    pathname.startsWith("/api/branding") ||
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
