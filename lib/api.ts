// API Client - Internal Next.js API routes
// Cookie-based session auth (httpOnly sm_session cookie)
// All requests go to /api/* internal routes

/* eslint-disable @typescript-eslint/no-explicit-any */

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // Sends httpOnly cookies
  })

  if (response.status === 401) {
    // Session expired or invalid - redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/site/login"
    }
    throw new Error("Unauthorized")
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "An error occurred" }))
    throw new Error(error.error || error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// Helper for query string params
function qs(params?: Record<string, any>): string {
  if (!params) return ""
  const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""))
  if (Object.keys(filtered).length === 0) return ""
  return "?" + new URLSearchParams(filtered as Record<string, string>).toString()
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    apiFetch<{ user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () => apiFetch("/auth/logout", { method: "POST" }),

  getMe: () => apiFetch<{ user: any }>("/auth/me"),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  impersonate: (userId: string) =>
    apiFetch<{ user: any }>("/auth/impersonate", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
}

// Users API
export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string; role?: string }) =>
    apiFetch<{ users: any[]; total: number; page: number; limit: number }>(`/users${qs(params)}`),

  getById: (id: string) => apiFetch<{ user: any }>(`/users/${id}`),

  create: (data: { email: string; password: string; name: string; phone?: string; role?: string }) =>
    apiFetch<{ user: any }>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; phone?: string; status?: string; role?: string; avatar?: string }) =>
    apiFetch<{ user: any }>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
}

// Wallet API
export const walletApi = {
  getBalance: (userId?: string) =>
    apiFetch<{ wallet: any }>(`/wallets${qs({ userId })}`),

  getTransactions: (params?: { page?: number; limit?: number; category?: string; userId?: string }) =>
    apiFetch<{ transactions: any[]; total: number; page: number; limit: number }>(`/wallets/transactions${qs(params)}`),

  adjust: (userId: string, amount: number, type: "credit" | "debit", category: string, reason?: string, notes?: string) =>
    apiFetch<{ transaction: any; newBalance: number }>("/wallets/adjust", {
      method: "POST",
      body: JSON.stringify({ userId, amount, type, category, reason, notes }),
    }),
}

// Credits API
export const creditsApi = {
  getMyCredits: (userId?: string) =>
    apiFetch<{ credits: any }>(`/credits${qs({ userId })}`),

  getPricing: () =>
    apiFetch<{ pricing: any; discountTiers: any[] }>("/credits/pricing"),

  purchase: (streamType: string, quantity: number) =>
    apiFetch<{ credits: any; transaction: any }>("/credits/purchase", {
      method: "POST",
      body: JSON.stringify({ streamType, quantity }),
    }),
}

// Orders API
export const ordersApi = {
  getAll: (params?: { page?: number; limit?: number; userId?: string }) =>
    apiFetch<{ orders: any[]; total: number; page: number; limit: number }>(`/orders${qs(params)}`),

  create: (data: { orderType: string; amount: number; description?: string; gateway?: string }) =>
    apiFetch<{ order: any }>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// Events API
export const eventsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    apiFetch<{ events: any[]; total: number; page: number; limit: number }>(`/events${qs(params)}`),

  getById: (id: string) => apiFetch<{ event: any }>(`/events/${id}`),

  create: (data: any) =>
    apiFetch<{ event: any }>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiFetch<{ event: any }>(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiFetch(`/events/${id}`, { method: "DELETE" }),
}

// Payments API
export const paymentsApi = {
  create: (data: { orderType: string; amount: number; gateway: "razorpay" | "instamojo"; description?: string }) =>
    apiFetch<any>("/payments/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyRazorpay: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; orderId: string }) =>
    apiFetch<{ success: boolean }>("/payments/verify/razorpay", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyInstamojo: (data: { paymentRequestId: string; paymentId?: string; orderId: string }) =>
    apiFetch<{ success: boolean }>("/payments/verify/instamojo", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// Dashboard API
export const dashboardApi = {
  getStats: () => apiFetch<{ stats: any }>("/dashboard"),
}

// Notifications API
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; unread?: string }) =>
    apiFetch<{ notifications: any[]; unreadCount: number; page: number; limit: number }>(`/notifications${qs(params)}`),

  markAsRead: (notificationId?: string) =>
    apiFetch<{ success: boolean }>("/notifications/read", {
      method: "POST",
      body: JSON.stringify(notificationId ? { notificationId } : { markAll: true }),
    }),
}

// Settings API
export const settingsApi = {
  getAll: () => apiFetch<{ settings: any[] }>("/settings"),

  get: (key: string) => apiFetch<{ setting: any }>(`/settings?key=${key}`),

  update: (key: string, value: any) =>
    apiFetch<{ setting: any }>("/settings", {
      method: "PUT",
      body: JSON.stringify({ key, value }),
    }),
}

// Branding API
export const brandingApi = {
  get: (userId?: string) => apiFetch<{ branding: any }>(`/branding${qs({ userId })}`),

  update: (data: any) =>
    apiFetch<{ branding: any }>("/branding", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
}

// Refunds API
export const refundsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiFetch<{ refunds: any[] }>(`/refunds${qs(params)}`),

  create: (data: { orderId: string; refundType: string; amount: number; reason?: string }) =>
    apiFetch<{ refund: any }>("/refunds", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// Domains API
export const domainsApi = {
  getAll: () => apiFetch<{ domains: any[] }>("/domains"),

  add: (domain: string) =>
    apiFetch<{ domain: any }>("/domains", {
      method: "POST",
      body: JSON.stringify({ domain }),
    }),
}

// Streaming API (kept for existing routes)
export const streamingApi = {
  getServerStatus: () => apiFetch<any>("/streaming/stats"),
  getBackendInfo: () => apiFetch<any>("/streaming/backend-info"),
}

export default {
  auth: authApi,
  users: usersApi,
  wallet: walletApi,
  credits: creditsApi,
  orders: ordersApi,
  events: eventsApi,
  payments: paymentsApi,
  dashboard: dashboardApi,
  notifications: notificationsApi,
  settings: settingsApi,
  branding: brandingApi,
  refunds: refundsApi,
  domains: domainsApi,
  streaming: streamingApi,
}
