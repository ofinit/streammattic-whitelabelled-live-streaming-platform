export function getYoutubeSettingsHref(ownerType: "admin" | "studio" | "streamer"): string {
  switch (ownerType) {
    case "streamer":
      return "/streamer/settings/youtube"
    case "studio":
      return "/studio/settings/youtube"
    case "admin":
      return "/admin/settings/integrations"
    default: {
      const _exhaustive: never = ownerType
      return _exhaustive
    }
  }
}
