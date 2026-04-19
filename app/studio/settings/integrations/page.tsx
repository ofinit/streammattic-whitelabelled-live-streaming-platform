import { redirect } from "next/navigation"

/** @deprecated Use `/studio/settings/youtube` — YouTube OAuth and channels live there. */
export default function StudioIntegrationsRedirectPage() {
  redirect("/studio/settings/youtube")
}
