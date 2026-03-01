/**
 * Credit & Pricing Service
 *
 * Handles stream type credit purchases, pricing calculations,
 * and wallet operations for the pay-per-event credit system.
 *
 * Flow:
 * 1. User recharges wallet (real money in)
 * 2. User buys stream type credits (wallet -> credits, with volume discounts)
 * 3. Creating an event deducts 1 credit of the selected stream type
 * 4. Extending validity deducts additional credits
 * 5. Other services (AI images, whitelabel, domains) deduct directly from wallet
 */

import type {
  StreamTypeKey,
  StreamTypePricing,
  SimulcastPricing,
  StreamTypeCredits,
} from "./types"

import {
  masterStreamTypePricing,
  masterSimulcastPricing,
  masterValiditySettings,
  getBestPriceForQuantity,
} from "./mock-data"

// Get price for stream type (single price, no cascade)
export function getStreamTypePrice(
  streamType: StreamTypeKey,
  quantity: number = 1,
  customPricing?: StreamTypePricing,
): { pricePerEvent: number; tierLabel?: string; totalPrice: number; savings: number } {
  const pricing = customPricing || masterStreamTypePricing
  return getBestPriceForQuantity(streamType, quantity, pricing)
}

// Get base price for a stream type (qty 1, no discount)
export function getStreamTypeBasePrice(
  streamType: StreamTypeKey,
  customPricing?: StreamTypePricing,
): number {
  const pricing = customPricing || masterStreamTypePricing
  return pricing[streamType].basePrice
}

// Check if stream type is enabled
export function isStreamTypeEnabled(
  streamType: StreamTypeKey,
  customPricing?: StreamTypePricing,
): boolean {
  const pricing = customPricing || masterStreamTypePricing
  return pricing[streamType].enabled
}

// Get simulcast destination price
export function getSimulcastPrice(
  destination: "youtube" | "facebook" | "custom_rtmp",
  customPricing?: SimulcastPricing,
): number {
  const pricing = customPricing || masterSimulcastPricing
  const destKey = destination === "custom_rtmp" ? "customRtmp" : destination
  return pricing[destKey].price
}

// Calculate total event cost (stream type credit check + simulcast wallet cost)
export function calculateEventCost(
  streamType: StreamTypeKey,
  simulcastDestinations: ("youtube" | "facebook" | "custom_rtmp")[],
  customSimulcastPricing?: SimulcastPricing,
): { creditsRequired: number; simulcastWalletCost: number } {
  // Events always cost 1 credit of the stream type
  const creditsRequired = 1

  // Simulcast destinations are extra wallet charges
  let simulcastWalletCost = 0
  for (const dest of simulcastDestinations) {
    simulcastWalletCost += getSimulcastPrice(dest, customSimulcastPricing)
  }

  return { creditsRequired, simulcastWalletCost }
}

// Check if user has enough credits for a stream type
export function hasEnoughCredits(
  credits: StreamTypeCredits,
  streamType: StreamTypeKey,
  amount: number = 1,
): boolean {
  return credits[streamType] >= amount
}

// Get validity extension cost in credits
export function getValidityExtensionCost(extensionDays: number): {
  creditCost: number
  label: string
} | null {
  const tier = masterValiditySettings.extendedTiers.find(t => t.days === extensionDays && t.enabled)
  if (!tier) return null
  return { creditCost: tier.creditCost, label: tier.label || `${tier.days} Days` }
}

// Get pricing display info for UI
export function getPricingDisplay(streamType: StreamTypeKey): {
  name: string
  description: string
  icon: string
} {
  const displays: Record<StreamTypeKey, { name: string; description: string; icon: string }> = {
    rtmp: {
      name: "RTMP Server",
      description: "Use OBS/Wirecast - Full transcoding",
      icon: "Video",
    },
    youtube_api: {
      name: "YouTube API",
      description: "Direct broadcast - Recommended",
      icon: "Youtube",
    },
    youtube_embed: {
      name: "YouTube Embed",
      description: "Embed existing stream",
      icon: "Play",
    },
    third_party: {
      name: "Third Party",
      description: "External embed - Lowest cost",
      icon: "Globe",
    },
  }

  return displays[streamType]
}

// Format currency
export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format paisa to rupees display
export function formatPaisa(paisa: number): string {
  return formatCurrency(paisa / 100)
}

// Get all stream type keys
export function getAllStreamTypes(): StreamTypeKey[] {
  return ["rtmp", "youtube_api", "youtube_embed", "third_party"]
}

// Get total credits remaining across all stream types
export function getTotalCredits(credits: StreamTypeCredits): number {
  return credits.rtmp + credits.youtube_api + credits.youtube_embed + credits.third_party
}
