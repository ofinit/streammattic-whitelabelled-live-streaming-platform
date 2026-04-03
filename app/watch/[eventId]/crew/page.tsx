import { redirect } from "next/navigation"

/** Legacy /watch/.../crew → canonical /{slug-or-id}/crew */
export default async function WatchCrewRedirectPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params
  redirect(`/${encodeURIComponent(eventId)}/crew`)
}
