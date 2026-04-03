import type { Metadata } from "next"
import type { ReactNode } from "react"
import { buildWatchEventMetadata } from "@/lib/watch-page-metadata"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return buildWatchEventMetadata(slug, { canonicalPath: `/${slug}` })
}

export default function EventSlugLayout({ children }: { children: ReactNode }) {
  return children
}
