import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/login/callback",
  "/admin/login",
  "/handler",
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths, NextAuth routes, static assets, and API routes that handle their own auth
  if (
    PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/api/auth") || // NextAuth (signin, callback, error, etc.)
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/placeholder") ||
    pathname.match(/\.\w+$/) // static files
  ) {
    return NextResponse.next()
  }

  // Check session cookie exists (support both dev and prod secure cookies)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("sm_session")?.value; // fallback for current active sessions

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
