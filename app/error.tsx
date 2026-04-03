"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Root error boundary:", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background text-foreground">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        {error?.message ?? "Internal Server Error"}
      </p>
      {process.env.NODE_ENV === "development" && error?.stack && (
        <pre className="text-xs text-left overflow-auto max-h-48 p-4 bg-muted rounded border">
          {error.stack}
        </pre>
      )}
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
