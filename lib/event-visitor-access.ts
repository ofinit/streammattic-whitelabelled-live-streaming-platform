/** Who may read event_visitor_registrations for an event row. */
export function userCanViewEventVisitors(
  user: { id: string; role: string },
  event: { userId: string; studioId?: string | null },
): boolean {
  if (user.role === "admin") return true
  if (user.role === "streamer" && event.userId === user.id) return true
  if (user.role === "studio") {
    if (event.userId === user.id) return true
    if (event.studioId && event.studioId === user.id) return true
  }
  return false
}
