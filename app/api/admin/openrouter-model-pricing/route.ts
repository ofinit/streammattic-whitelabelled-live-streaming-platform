import { jsonError, jsonOk, withRole } from "@/lib/api-helpers"
import { getOpenRouterGalleryJobPricing } from "@/lib/openrouter-model-pricing"

export const dynamic = "force-dynamic"

export const GET = withRole(["admin"], async (_user, request: Request) => {
  const url = new URL(request.url)
  const modelId = url.searchParams.get("modelId")?.trim() ?? ""
  if (!modelId) {
    return jsonError("Missing modelId query parameter", 400)
  }

  try {
    const pricing = await getOpenRouterGalleryJobPricing(modelId)
    return jsonOk(pricing)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load OpenRouter pricing"
    return jsonError(msg, 502)
  }
})
