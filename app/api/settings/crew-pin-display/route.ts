import { NextResponse } from "next/server"
import { withAuth } from "@/lib/api-helpers"
import { getPlatformSetting, setPlatformSetting } from "@/lib/db-queries"

const VALID_MODES = ["crew_page", "template_bottom"] as const
type CrewPinDisplayMode = (typeof VALID_MODES)[number]

function settingKey(userId: string) {
  return `crew_pin_display:${userId}`
}

export async function GET(request: Request) {
  const run = withAuth(async (user) => {
    const raw = await getPlatformSetting(settingKey(user.id))
    const mode: CrewPinDisplayMode =
      raw && VALID_MODES.includes(raw as CrewPinDisplayMode)
        ? (raw as CrewPinDisplayMode)
        : "crew_page"
    return NextResponse.json({ mode })
  })
  return run(request)
}

export async function PUT(request: Request) {
  const run = withAuth(async (user) => {
    const body = await request.json()
    const mode = body?.mode as string
    if (!VALID_MODES.includes(mode as CrewPinDisplayMode)) {
      return NextResponse.json({ error: "Invalid mode. Must be 'crew_page' or 'template_bottom'" }, { status: 400 })
    }
    await setPlatformSetting(settingKey(user.id), mode)
    return NextResponse.json({ success: true, mode })
  })
  return run(request)
}
