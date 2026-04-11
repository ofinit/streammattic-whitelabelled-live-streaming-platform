import { WatchEventContent } from "@/components/watch/watch-event-content"
import { VisitorSessionTracker } from "@/components/watch/visitor-session-tracker"
import { buildWatchEventMetadata } from "@/lib/watch-page-metadata"

type Props = { params: Promise<{ eventId: string }> }

export async function generateMetadata({ params }: Props) {
  const { eventId } = await params
  return buildWatchEventMetadata(eventId, { canonicalPath: `/watch/${eventId}` })
}

export default async function WatchEventPage({ params }: Props) {
  const { eventId } = await params
  return (
    <>
      <VisitorSessionTracker eventId={eventId} />
      <WatchEventContent eventId={eventId} />
    </>
  )
}
