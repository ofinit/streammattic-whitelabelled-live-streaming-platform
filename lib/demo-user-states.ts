// Demo user states for visualization pages only
// These are hardcoded scenarios to demonstrate different UI states

import type { StreamTypeCredits } from "./types"

export interface DemoUserState {
  credits: StreamTypeCredits
  walletBalance: number
  scenario: string
}

export const demoUserStates = {
  withCredits: {
    credits: { rtmp: 5, youtube_api: 3, youtube_embed: 2, third_party: 0 },
    walletBalance: 5000,
    scenario: "User with purchased credits across stream types",
  } as DemoUserState,

  noCredits: {
    credits: { rtmp: 0, youtube_api: 0, youtube_embed: 0, third_party: 0 },
    walletBalance: 8000,
    scenario: "User with wallet balance but no credits purchased yet",
  } as DemoUserState,

  lowBalance: {
    credits: { rtmp: 1, youtube_api: 0, youtube_embed: 0, third_party: 0 },
    walletBalance: 200,
    scenario: "User with low wallet balance and few credits remaining",
  } as DemoUserState,
}

// Pricing data for display (from masterStreamTypePricing, base prices in paisa)
export const streamTypePricing = {
  rtmp: 1500,
  youtube_api: 1000,
  youtube_embed: 500,
  third_party: 400,
}
