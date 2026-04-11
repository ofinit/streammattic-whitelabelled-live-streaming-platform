"use client"

import Link from "next/link"
import { BrandedLogo } from "@/components/branding/branded-logo"

export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <BrandedLogo size="md" />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 pb-16">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90 [&_h2]:mt-10 [&_h2]:scroll-mt-24 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-medium [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1.5">
          {children}
        </div>
      </main>
      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        <p>
          <Link href="/terms" className="hover:text-foreground hover:underline">
            Terms
          </Link>
          <span className="mx-2">·</span>
          <Link href="/privacy-policy" className="hover:text-foreground hover:underline">
            Privacy
          </Link>
        </p>
      </footer>
    </div>
  )
}
