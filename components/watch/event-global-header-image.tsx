"use client"

/**
 * Full-width strip above template heroes / headers on all watch skins.
 * Kept dependency-free so every layout can import it without circular imports.
 */
export function EventGlobalHeaderImage({ url }: { url?: string | null }) {
  const u = typeof url === "string" ? url.trim() : ""
  if (!u) return null
  return (
    <div className="relative z-[40] w-full shrink-0 overflow-hidden bg-muted">
      <img
        src={u}
        alt=""
        className="block h-auto w-full max-h-[min(42vh,22rem)] object-cover object-center sm:max-h-[280px] md:max-h-[320px]"
        loading="lazy"
        decoding="async"
        sizes="100vw"
      />
    </div>
  )
}
