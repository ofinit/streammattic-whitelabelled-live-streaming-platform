/** HttpOnly cookie for cross-visit visitor id (opaque). */
export const VISITOR_COOKIE_NAME = "sl_vid"
export const VISITOR_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 400 // ~400 days

export type FunnelEventType =
  | "VISITOR_LANDED"
  | "VIEWER_JOINED"
  | "SIGNUP_COMPLETED"
  | "CREDIT_PURCHASED"
  | "EVENT_CREATED"
