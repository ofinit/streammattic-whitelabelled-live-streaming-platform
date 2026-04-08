import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { runEventCleanupTask } from "@/lib/server/cleanup-service"

export async function POST() {
  try {
    await requireRole(["admin"])
    
    const result = await runEventCleanupTask()
    
    return NextResponse.json({
      success: result.success,
      deletedCount: result.deletedCount,
      jobId: result.jobId,
      error: result.error
    })
  } catch (error: any) {
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
