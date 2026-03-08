"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"

function LoginCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const tokenFromUrl = searchParams.get("token")
    const source = searchParams.get("source")

    ;(async () => {
      try {
        let token: string | null = null
        if (source === "magic" && tokenFromUrl) {
          token = tokenFromUrl
        } else {
          const res = await fetch("/api/auth/stack-exchange", { method: "POST" })
          const data = await res.json().catch(() => ({}))
          if (cancelled) return
          if (!res.ok) {
            setError(data.error || "Could not sign in")
            return
          }
          token = data.token || null
        }
        if (!token) {
          setError("Invalid response")
          return
        }
        const signInResult = await signIn("credentials", {
          email: "__stack__",
          password: token,
          redirect: false,
        })
        if (cancelled) return
        if (signInResult?.error) {
          setError("Session creation failed")
          return
        }
        const meRes = await fetch("/api/auth/me")
        if (meRes.ok) {
          const { user } = await meRes.json()
          if (user?.role === "studio") router.replace("/studio")
          else if (user?.role === "admin") router.replace("/admin")
          else router.replace("/streamer")
        } else {
          router.replace("/streamer")
        }
      } catch {
        if (!cancelled) setError("Something went wrong")
      }
    })()
    return () => { cancelled = true }
  }, [router, searchParams])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <a href="/login" className="text-primary hover:underline">Back to sign in</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <LoginCallbackContent />
    </Suspense>
  )
}
