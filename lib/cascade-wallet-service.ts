/**
 * Cascade Wallet Service
 *
 * Handles hierarchical wallet debits for pay-per-event pricing.
 * When a user creates an event, the system debits wallets up the hierarchy:
 * User -> Sub-Reseller -> Reseller -> Admin
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
  rtmp: {
    adminCost: 500,
    resellerPrice: 700,
    subResellerPrice: 1000,
    userPrice: 1500,
  },
  youtube_api: {
    adminCost: 300,
    resellerPrice: 400,
    subResellerPrice: 650,
    userPrice: 1000,
  },
  youtube_embed: {
    adminCost: 100,
    resellerPrice: 150,
    subResellerPrice: 300,
    userPrice: 500,
  },
  third_party: {
    adminCost: 50,
    resellerPrice: 100,
    subResellerPrice: 250,
    userPrice: 400,
  },
}

// Default simulcast pricing
export const defaultSimulcastPricing: SimulcastPricing = {
  youtube: {
    adminCost: 30,
    resellerPrice: 40,
    subResellerPrice: 50,
    userPrice: 75,
  },
  facebook: {
    adminCost: 30,
    resellerPrice: 40,
    subResellerPrice: 50,
    userPrice: 75,
  },
  customRtmp: {
    adminCost: 50,
    resellerPrice: 60,
    subResellerPrice: 75,
    userPrice: 100,
  },
}

// Get price for stream type at given level
export function getStreamTypePrice(
  streamType: StreamTypeKey,
  level: "admin" | "reseller" | "sub_reseller" | "user",
  customPricing?: StreamTypePricing,
): number {
  const pricing = customPricing || defaultStreamTypePricing
  const streamPricing = pricing[streamType]

  switch (level) {
    case "admin":
      return streamPricing.adminCost
    case "reseller":
      return streamPricing.resellerPrice
    case "sub_reseller":
      return streamPricing.subResellerPrice
    case "user":
      return streamPricing.userPrice
    default:
      return streamPricing.userPrice
  }
}

// Get price for simulcast destination at given level
export function getSimulcastPrice(
  destination: "youtube" | "facebook" | "custom_rtmp",
  level: "admin" | "reseller" | "sub_reseller" | "user",
  customPricing?: SimulcastPricing,
): number {
  const pricing = customPricing || defaultSimulcastPricing
  const destPricing = pricing[destination === "custom_rtmp" ? "customRtmp" : destination]

  switch (level) {
    case "admin":
      return destPricing.adminCost
    case "reseller":
      return destPricing.resellerPrice
    case "sub_reseller":
      return destPricing.subResellerPrice
    case "user":
      return destPricing.userPrice
    default:
      return destPricing.userPrice
  }
}

// Calculate total event price for a user
export function calculateEventPrice(
  streamType: StreamTypeKey,
  simulcastDestinations: ("youtube" | "facebook" | "custom_rtmp")[],
  level: "admin" | "reseller" | "sub_reseller" | "user",
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

// Build ancestor chain for cascade
export interface AncestorInfo {
  id: string
  name: string
  type: UserRole
  walletBalance: number
  parentId?: string
}

export function buildAncestorChain(
  userId: string,
  // In real app, this would be a database lookup
  getUserById: (id: string) => AncestorInfo | null,
): AncestorInfo[] {
  const chain: AncestorInfo[] = []
  let currentId: string | undefined = userId

  while (currentId) {
    const user = getUserById(currentId)
    if (!user) break

    chain.push(user)
    currentId = user.parentId
  }

  return chain
}

// Validate cascade - check if all levels have sufficient balance
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

    // Determine price level based on entity type
    let priceLevel: "admin" | "reseller" | "sub_reseller" | "user"
    if (entity.type === "user") {
      priceLevel = "user"
    } else if (entity.type === "reseller") {
      // Check if this reseller has a parent reseller (making it a sub-reseller)
      const hasParentReseller = ancestorChain.slice(i + 1).some((a) => a.type === "reseller")
      priceLevel = hasParentReseller ? "sub_reseller" : "reseller"
    } else {
      priceLevel = "admin"
    }

    // Calculate price at this level
    const { total: requiredAmount } = calculateEventPrice(
      streamType,
      simulcastDestinations,
      priceLevel,
      customStreamPricing,
      customSimulcastPricing,
    )

    // Calculate profit (difference between what they receive and what they pay)
    let profitAmount = 0
    if (i > 0 && !isAdmin) {
      const childLevel = levels[i - 1]
      profitAmount = childLevel.requiredAmount - requiredAmount
    } else if (isAdmin && i > 0) {
      // Admin receives revenue without wallet debit
      const resellerLevel = levels[i - 1]
      profitAmount = resellerLevel.requiredAmount // Admin's revenue
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

// Execute cascade debit (mock implementation)
export function executeCascadeDebit(
  validation: CascadeValidation,
  request: CascadeDebitRequest,
  // In real app, this would update database
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

  // Process debits from bottom to top (user -> reseller -> admin)
  for (const level of validation.levels) {
    // Skip admin (admin receives, doesn't pay)
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
