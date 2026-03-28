import { WatchEventContent } from "@/components/watch/watch-event-content"
import { buildWatchEventMetadata } from "@/lib/watch-page-metadata"

type Props = { params: Promise<{ eventId: string }> }

export async function generateMetadata({ params }: Props) {
  const { eventId } = await params
  return buildWatchEventMetadata(eventId, { canonicalPath: `/watch/${eventId}` })
}

export default async function WatchEventPage({ params }: Props) {
  const { eventId } = await params
  return <WatchEventContent eventId={eventId} />
}
