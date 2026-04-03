import { NextResponse } from "next/server"

/** Public list of enabled auth providers (for login page UI). */
export async function GET() {
  const google =
    !!(process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) &&
    !!(process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET)
  return NextResponse.json({ google })
}
