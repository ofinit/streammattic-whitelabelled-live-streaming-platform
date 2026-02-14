// Demo user states for visualization pages only
// These are hardcoded scenarios to demonstrate different UI states

export interface DemoUserState {
  package: {
    name: string
    maxEvents: number
    validityDays: number
  } | null
  inventory: {
    totalQty: number
    usedQty: number
    availableQty: number
  } | null
  walletBalance: number
  scenario: string
}

export const demoUserStates = {
  payPerEvent: {
    package: null,
    inventory: null,
    walletBalance: 5000,
    scenario: "User with no monthly package - pays per event",
  } as DemoUserState,

  monthlyActive: {
    package: {
      name: "Starter Package",
      maxEvents: 5,
      validityDays: 30,
    },
    inventory: {
      totalQty: 5,
      usedQty: 2,
      availableQty: 3,
    },
    walletBalance: 2000,
    scenario: "User with active Starter Package (3 events remaining)",
  } as DemoUserState,

  monthlyDepleted: {
    package: {
      name: "Starter Package",
      maxEvents: 5,
      validityDays: 30,
    },
    inventory: {
      totalQty: 5,
      usedQty: 5,
      availableQty: 0,
    },
    walletBalance: 8000,
    scenario: "User with depleted package (0 events remaining)",
  } as DemoUserState,

  noPackage: {
    package: null,
    inventory: null,
    walletBalance: 500,
    scenario: "New user with no package purchased",
  } as DemoUserState,
}

// Pricing data for display
export const streamTypePricing = {
  rtmp: 1500,
  youtube_api: 1000,
  youtube_embed: 500,
  third_party: 400,
}
