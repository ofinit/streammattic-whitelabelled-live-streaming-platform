import type { Metadata } from "next"
import type { ReactNode } from "react"

/** Avoid inheriting root layout title (platform name) for the white-label studio site route */
export const metadata: Metadata = {
  title: "Studio site",
  description: "Live streaming and event services",
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  return children
}
