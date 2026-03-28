"use client"

import { Component, type ReactNode } from "react"
import { StackHandler } from "@stackframe/stack"
import Link from "next/link"
import { Button } from "@/components/ui/button"

/** Stack Auth handler crashes on Next.js 16 (async cookies / accessToken undefined). Fallback so users can still sign in. */
class HandlerErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError = () => ({ hasError: true })
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-background text-foreground">
          <h1 className="text-xl font-semibold">Sign in options</h1>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Use the main login page to sign in with Google, email and password, or a magic link.
          </p>
          <Button asChild size="lg">
            <Link href="/login">Go to login</Link>
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function StackHandlerPage() {
  return (
    <HandlerErrorBoundary>
      <StackHandler fullPage />
    </HandlerErrorBoundary>
  )
}
