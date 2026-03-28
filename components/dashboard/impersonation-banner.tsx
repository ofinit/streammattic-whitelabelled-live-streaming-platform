"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"

export function ImpersonationBanner() {
  const router = useRouter()
  const { isImpersonating, user, originalUser, stopImpersonating } = useAuth()

  if (!isImpersonating) return null

  const handleStopImpersonating = () => {
    const targetRoute = stopImpersonating()
    if (targetRoute) {
      router.push(targetRoute)
    }
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-950 px-3 py-2 sm:px-4">
      <div className="flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-4 sm:text-left">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">
          You are viewing as <strong>{user?.name}</strong> ({user?.role})
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleStopImpersonating}
          className="h-7 bg-transparent border-yellow-950 text-yellow-950 hover:bg-yellow-600"
        >
          <X className="h-3 w-3 mr-1" />
          Stop Impersonating
        </Button>
      </div>
    </div>
  )
}
