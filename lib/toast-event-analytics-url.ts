import { toast } from "sonner"

/** After event creation, surface the canonical per-event analytics URL with a copy action. */
export function toastEventAnalyticsUrl(slugOrId: string | undefined | null) {
  if (!slugOrId || typeof window === "undefined") return
  const url = `${window.location.origin}/${encodeURIComponent(slugOrId)}/analytics`
  toast.success("Event created successfully", {
    description: url,
    action: {
      label: "Copy link",
      onClick: () => {
        void navigator.clipboard.writeText(url).then(() => {
          toast.success("Analytics URL copied")
        })
      },
    },
    duration: 12_000,
  })
}
