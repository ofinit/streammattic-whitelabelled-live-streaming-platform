import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

type Params = { params: Promise<{ eventId: string }> }

// POST — viewer joined: increment current_viewers
export async function POST(_req: NextRequest, { params }: Params) {
  const { eventId } = await params
  if (!eventId) return NextResponse.json({ ok: false }, { status: 400 })
  try {
    const db = getDb()
    await db`
      UPDATE events
      SET current_viewers = GREATEST(0, COALESCE(current_viewers, 0) + 1),
          total_views      = COALESCE(total_views, 0) + 1
      WHERE (id::text = ${eventId} OR slug = ${eventId})
        AND status IN ('live', 'on_break')
    `
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

// DELETE — viewer left: decrement current_viewers
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { eventId } = await params
  if (!eventId) return NextResponse.json({ ok: false }, { status: 400 })
  try {
    const db = getDb()
    await db`
      UPDATE events
      SET current_viewers = GREATEST(0, COALESCE(current_viewers, 0) - 1)
      WHERE (id::text = ${eventId} OR slug = ${eventId})
        AND status IN ('live', 'on_break')
    `
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
