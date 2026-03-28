import { redirect } from "next/navigation"

/** Orders UI was replaced by wallet transaction history. */
export default function StreamerOrdersRedirectPage() {
  redirect("/streamer/wallet")
}
