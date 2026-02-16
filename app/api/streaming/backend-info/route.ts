import { NextResponse } from "next/server"
import { getActiveBackendType, BACKEND_INFO } from "@/lib/streaming"

export async function GET() {
  const backendType = getActiveBackendType()
  const info = BACKEND_INFO[backendType]

  return NextResponse.json({
    type: info.type,
    name: info.name,
    isFree: info.isFree,
    cost: info.cost,
    features: info.features,
    defaultPorts: info.defaultPorts,
  })
}
