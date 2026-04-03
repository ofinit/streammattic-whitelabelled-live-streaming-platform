/**
 * Client-only: set document favicon (append override link so it wins over layout defaults).
 */
export function applyFaviconHrefToDocument(href: string) {
  if (typeof document === "undefined" || !href) return
  const url = href.startsWith("http")
    ? href
    : `${window.location.origin}${href.startsWith("/") ? href : `/${href}`}`

  let el = document.getElementById("streamlivee-favicon-dynamic") as HTMLLinkElement | null
  if (!el) {
    el = document.createElement("link")
    el.id = "streamlivee-favicon-dynamic"
    el.rel = "icon"
    document.head.appendChild(el)
  }
  el.href = url
  if (href.endsWith(".svg") || url.endsWith(".svg")) {
    el.type = "image/svg+xml"
  } else {
    el.removeAttribute("type")
  }
}
