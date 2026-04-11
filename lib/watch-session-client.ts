/** sessionStorage keys for watch page session / visitor id (per tab + event). */

export function watchSessionKeyStorage(eventId: string): string {
  return `sl_w_sk:${eventId}`
}

export function watchVisitorKeyStorage(eventId: string): string {
  return `sl_w_vk:${eventId}`
}

export function readWatchSessionKeys(eventId: string): { sessionKey: string | null; visitorKey: string | null } {
  if (typeof window === "undefined") {
    return { sessionKey: null, visitorKey: null }
  }
  try {
    return {
      sessionKey: sessionStorage.getItem(watchSessionKeyStorage(eventId)),
      visitorKey: sessionStorage.getItem(watchVisitorKeyStorage(eventId)),
    }
  } catch {
    return { sessionKey: null, visitorKey: null }
  }
}
