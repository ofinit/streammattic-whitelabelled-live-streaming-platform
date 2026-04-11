/** Strip server-only fields from event rows returned to the client (studio / streamer APIs). */
export function sanitizeEventForClient(ev: Record<string, unknown>): Record<string, unknown> {
  if (!ev || typeof ev !== "object") return ev
  const out = { ...ev }
  const hasCrewPin = !!(out.crewPinHash as string || out.crew_pin_hash as string)
  delete out.crewPinHash
  delete out.crew_pin_hash
  out.has_crew_pin = hasCrewPin
  return out
}
