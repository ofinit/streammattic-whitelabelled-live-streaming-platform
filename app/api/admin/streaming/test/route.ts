import { jsonOk, withRole } from "@/lib/api-helpers"
import { getSrsApiBaseUrl } from "@/lib/srs-api-url"

async function testSrsApi() {
  const url = `${getSrsApiBaseUrl()}/summaries`
  console.log("SRS API URL:", url)

  try {
    const res = await fetch(url, { method: "GET", cache: "no-store" })
    if (!res.ok) {
      throw new Error(`SRS API failed: ${res.status}`)
    }
    const data = await res.json()
    return jsonOk({ ok: true, success: true, url, data, message: `SRS API is reachable at ${url}` })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return jsonOk({ ok: false, success: false, url, error: message, message }, 500)
  }
}

export const GET = withRole(["admin"], async () => testSrsApi())

export const POST = withRole(["admin"], async () => testSrsApi())
