import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { withTransaction } from "@/lib/db"

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"])
    const { id } = await props.params

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return jsonError("Invalid JSON body", 400)
    }

    if (!body || typeof body !== "object" || !("expiresAt" in body)) {
      return jsonError("Body must include expiresAt (ISO-8601 instant)", 400)
    }

    const expiresAtRaw = (body as { expiresAt?: unknown }).expiresAt
    if (typeof expiresAtRaw !== "string" || !expiresAtRaw.trim()) {
      return jsonError("expiresAt must be a non-empty string", 400)
    }

    const expiresAt = new Date(expiresAtRaw)
    if (Number.isNaN(expiresAt.getTime())) {
      return jsonError("expiresAt must be a valid ISO-8601 date-time", 400)
    }

    const now = new Date()
    if (expiresAt.getTime() <= now.getTime()) {
      return jsonError("Subscription end must be strictly after the current time", 400)
    }

    await withTransaction(async (tx) => {
      const userRes = await tx.query<{ role: string }>(
        `SELECT role FROM users WHERE id = $1`,
        [id],
      )
      if (userRes.rows.length === 0) {
        throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" })
      }

      const role = userRes.rows[0].role
      if (role === "admin") {
        throw Object.assign(new Error("Cannot grant Studio subscription to an admin account"), {
          code: "BAD_ROLE",
        })
      }

      if (role === "streamer") {
        await tx.query(
          `UPDATE users
           SET role = 'studio',
               studio_subscription_expires_at = $1,
               updated_at = NOW()
           WHERE id = $2`,
          [expiresAt, id],
        )

        await tx.query(
          `INSERT INTO studio_branding (user_id, platform_name)
           VALUES ($1, 'My Studio')
           ON CONFLICT (user_id) DO NOTHING`,
          [id],
        )
      } else if (role === "studio") {
        await tx.query(
          `UPDATE users
           SET studio_subscription_expires_at = $1,
               updated_at = NOW()
           WHERE id = $2`,
          [expiresAt, id],
        )
      } else {
        throw Object.assign(new Error("User role does not support Studio grant"), {
          code: "BAD_ROLE",
        })
      }

      const until = expiresAt.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
      await tx.query(
        `INSERT INTO notifications (user_id, type, title, message)
         VALUES ($1, 'payment', 'Studio subscription', $2)`,
        [
          id,
          `Your Studio access is valid until ${until}. After that, renew at the current Studio rate in Settings to stay on Studio; if not renewed, your account becomes a Streamer account. You'll receive the usual email reminders before expiry.`,
        ],
      )
    })

    return NextResponse.json({
      success: true,
      message: "Studio subscription updated.",
    })
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string }
    if (err?.code === "NOT_FOUND") {
      return jsonError("User not found", 404)
    }
    if (err?.code === "BAD_ROLE") {
      return jsonError(err.message || "Invalid user role", 400)
    }
    console.error("Admin studio-subscription-grant POST error:", error)
    if (err?.message === "Forbidden" || err?.message === "Unauthorized") {
      return jsonError("Unauthorized", 401)
    }
    return jsonError("Internal server error", 500)
  }
}
