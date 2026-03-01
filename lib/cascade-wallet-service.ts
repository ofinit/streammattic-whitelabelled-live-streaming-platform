/**
 * Cascade Wallet Service
 *
 * Handles hierarchical wallet debits for pay-per-event pricing.
 * 2-tier model: User/Reseller -> Admin
 * - Users pay userPrice, Admin receives resellerPrice from reseller
 * - Resellers pay resellerPrice to admin
 */

import type {
  CascadeValidation,
  CascadeLevel,
  CascadeDebitRequest,
  CascadeDebitResult,
  CascadeTransactionResult,
  StreamTypeKey,
  StreamTypePricing,
  SimulcastPricing,
  UserRole,
  WalletTransaction,
} from "./types"

// Default stream type pricing (platform defaults)
export const defaultStreamTypePricing: StreamTypePricing = {
  rtmp: { userPrice: 1500, resellerPrice: 700, enabled: true },
  youtube_api: { userPrice: 1000, resellerPrice: 400, enabled: true },
  youtube_embed: { userPrice: 500, resellerPrice: 150, enabled: true },
  third_party: { userPrice: 400, resellerPrice: 100, enabled: true },
}

// Default simulcast pricing
export const defaultSimulcastPricing: SimulcastPricing = {
  youtube: { userPrice: 75, resellerPrice: 40, enabled: true },
  facebook: { userPrice: 75, resellerPrice: 40, enabled: true },
  customRtmp: { userPrice: 100, resellerPrice: 60, enabled: true },
}

// Get price for stream type at given level
export function getStreamTypePrice(
  streamType: StreamTypeKey,
  level: "reseller" | "user",
  customPricing?: StreamTypePricing,
): number {
  const pricing = customPricing || defaultStreamTypePricing
  const streamPricing = pricing[streamType]

  return level === "reseller" ? streamPricing.resellerPrice : streamPricing.userPrice
}

// Get price for simulcast destination at given level
export function getSimulcastPrice(
  destination: "youtube" | "facebook" | "custom_rtmp",
  level: "reseller" | "user",
  customPricing?: SimulcastPricing,
): number {
  const pricing = customPricing || defaultSimulcastPricing
  const destPricing = pricing[destination === "custom_rtmp" ? "customRtmp" : destination]

  return level === "reseller" ? destPricing.resellerPrice : destPricing.userPrice
}

// Calculate total event price for a user or reseller
export function calculateEventPrice(
  streamType: StreamTypeKey,
  simulcastDestinations: ("youtube" | "facebook" | "custom_rtmp")[],
  level: "reseller" | "user",
  customStreamPricing?: StreamTypePricing,
  customSimulcastPricing?: SimulcastPricing,
): { streamPrice: number; simulcastPrice: number; total: number } {
  const streamPrice = getStreamTypePrice(streamType, level, customStreamPricing)

  let simulcastPrice = 0
  for (const dest of simulcastDestinations) {
    simulcastPrice += getSimulcastPrice(dest, level, customSimulcastPricing)
  }

  return {
    streamPrice,
    simulcastPrice,
    total: streamPrice + simulcastPrice,
  }
}

// Build ancestor chain for cascade (2-tier: entity -> admin)
export interface AncestorInfo {
  id: string
  name: string
  type: UserRole
  walletBalance: number
}

export function buildAncestorChain(
  userId: string,
  getUserById: (id: string) => AncestorInfo | null,
): AncestorInfo[] {
  const chain: AncestorInfo[] = []

  // Get the initiating entity (user or reseller)
  const entity = getUserById(userId)
  if (!entity) return chain
  chain.push(entity)

  // Always add admin as the top level
  const admin = getUserById("admin-1")
  if (admin) chain.push(admin)

  return chain
}

// Validate cascade - check if entity has sufficient balance
export function validateCascade(
  ancestorChain: AncestorInfo[],
  streamType: StreamTypeKey,
  simulcastDestinations: ("youtube" | "facebook" | "custom_rtmp")[],
  customStreamPricing?: StreamTypePricing,
  customSimulcastPricing?: SimulcastPricing,
): CascadeValidation {
  const levels: CascadeLevel[] = []
  let allValid = true
  let failedAt: string | undefined
  let failureReason: string | undefined
  let totalRequired = 0

  for (let i = 0; i < ancestorChain.length; i++) {
    const entity = ancestorChain[i]
    const isAdmin = entity.type === "admin"

    // Determine price level -- admin doesn't pay, only user and reseller
    const priceLevel: "reseller" | "user" =
      entity.type === "user" ? "user" : "reseller"

    // Calculate price at this level
    const { total: requiredAmount } = calculateEventPrice(
      streamType,
      simulcastDestinations,
      priceLevel,
      customStreamPricing,
      customSimulcastPricing,
    )

    // Calculate profit (admin earns the difference)
    let profitAmount = 0
    if (isAdmin && i > 0) {
      const entityLevel = levels[i - 1]
      profitAmount = entityLevel.requiredAmount - requiredAmount
    }

    const hasEnough = isAdmin || entity.walletBalance >= requiredAmount

    if (!hasEnough && !failedAt) {
      allValid = false
      failedAt = entity.name
      failureReason = `Insufficient balance: ${entity.name} has ₹${entity.walletBalance} but needs ₹${requiredAmount}`
    }

    if (!isAdmin) {
      totalRequired += requiredAmount
    }

    levels.push({
      level: i,
      entityId: entity.id,
      entityName: entity.name,
      entityType: entity.type,
      currentBalance: entity.walletBalance,
      requiredAmount: isAdmin ? 0 : requiredAmount,
      profitAmount,
      hasEnough,
    })
  }

  return {
    isValid: allValid,
    totalRequired,
    levels,
    failedAt,
    failureReason,
  }
}

// Execute cascade debit
export function executeCascadeDebit(
  validation: CascadeValidation,
  request: CascadeDebitRequest,
  onDebit: (entityId: string, amount: number, description: string) => WalletTransaction,
): CascadeDebitResult {
  if (!validation.isValid) {
    return {
      success: false,
      totalDebited: 0,
      transactions: [],
      error: validation.failureReason,
    }
  }

  const transactions: CascadeTransactionResult[] = []
  let totalDebited = 0

  // Process debits (only the entity pays -- admin receives)
  for (const level of validation.levels) {
    if (level.entityType === "admin") continue

    const description = `${request.description} - ${level.entityName}`
    const transaction = onDebit(level.entityId, level.requiredAmount, description)

    transactions.push({
      transactionId: transaction.id,
      entityId: level.entityId,
      entityName: level.entityName,
      entityType: level.entityType,
      amount: level.requiredAmount,
      profit: level.profitAmount,
      balanceBefore: transaction.balanceBefore,
      balanceAfter: transaction.balanceAfter,
    })

    totalDebited += level.requiredAmount
  }

  return {
    success: true,
    totalDebited,
    transactions,
  }
}

// Get pricing display for UI
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
