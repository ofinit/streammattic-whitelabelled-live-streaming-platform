import { NextResponse } from "next/server"
import { getActiveBackendType, BACKEND_INFO } from "@/lib/streaming"
import { getPublicSrsSettings } from "@/lib/srs-settings"

export async function GET() {
  const saved = await getPublicSrsSettings().catch(() => null)
  const backendType = saved?.enabled ? saved.backendType : getActiveBackendType()
  const info = BACKEND_INFO[backendType]

  return NextResponse.json({
    type: info.type,
    name: info.name,
    isFree: info.isFree,
    cost: info.cost,
    features: info.features,
    defaultPorts: info.defaultPorts,
    settings: saved,
  })
}
