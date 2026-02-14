// API Client with token refresh interceptor
// This file provides typed API methods for all backend endpoints

import Cookies from "js-cookie"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

// Generic fetch wrapper with auth token handling
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = Cookies.get("accessToken")

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle 401 - attempt token refresh
  if (response.status === 401) {
    const refreshToken = Cookies.get("refreshToken")
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        })

        if (refreshResponse.ok) {
          const { accessToken, refreshToken: newRefreshToken } = await refreshResponse.json()
          Cookies.set("accessToken", accessToken, { expires: 1 })
          Cookies.set("refreshToken", newRefreshToken, { expires: 7 })

          // Retry original request with new token
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
              ...headers,
              Authorization: `Bearer ${accessToken}`,
            },
          })
          return retryResponse.json()
        }
      } catch {
        // Refresh failed - redirect to login
        Cookies.remove("accessToken")
        Cookies.remove("refreshToken")
        window.location.href = "/login"
      }
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "An error occurred" }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; refreshToken: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () => apiFetch("/auth/logout", { method: "POST" }),

  getMe: () => apiFetch<{ id: string; email: string; firstName: string; lastName: string; type: string }>("/auth/me"),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  refresh: (refreshToken: string) =>
    apiFetch<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  impersonate: (userId: string) =>
    apiFetch<{ accessToken: string }>(`/auth/impersonate/${userId}`, {
      method: "POST",
    }),
}

// Users API
export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    apiFetch<{ users: any[]; total: number; page: number; limit: number }>(
      `/users?${new URLSearchParams(params as any).toString()}`,
    ),

  getMyUsers: () => apiFetch<any[]>("/users/my-users"),

  getById: (id: string) => apiFetch<any>(`/users/${id}`),

  create: (data: { email: string; password: string; firstName: string; lastName: string; type?: string }) =>
    apiFetch("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { firstName?: string; lastName?: string; mobile?: string }) =>
    apiFetch(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  changeStatus: (id: string, status: "ACTIVE" | "SUSPENDED") =>
    apiFetch(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getHierarchy: (id: string) => apiFetch<any[]>(`/users/${id}/hierarchy`),
}

// Wallet API
export const walletApi = {
  getBalance: () => apiFetch<{ balance: number }>("/wallet/balance"),

  getSummary: () => apiFetch<{ balance: number; totalCredits: number; totalDebits: number }>("/wallet/summary"),

  getTransactions: (params?: { page?: number; limit?: number; type?: string }) =>
    apiFetch<{ transactions: any[]; total: number }>(
      `/wallet/transactions?${new URLSearchParams(params as any).toString()}`,
    ),

  adjust: (userId: string, amount: number, type: "CREDIT" | "DEBIT", reason: string) =>
    apiFetch("/wallet/adjust", {
      method: "POST",
      body: JSON.stringify({ userId, amount, type, reason }),
    }),
}

// Packages API
export const packagesApi = {
  getAll: () => apiFetch<any[]>("/packages"),

  getMyPrices: () => apiFetch<any[]>("/packages/my-prices"),

  getMyInventory: () => apiFetch<any[]>("/packages/my-inventory"),

  getById: (id: string) => apiFetch<any>(`/packages/${id}`),

  create: (data: any) =>
    apiFetch("/packages", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiFetch(`/packages/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  setCustomPrice: (userId: string, packageId: string, price: number) =>
    apiFetch("/packages/custom-price", {
      method: "POST",
      body: JSON.stringify({ userId, packageId, price }),
    }),
}

// Orders API
export const ordersApi = {
  createPackageOrder: (packageId: string, quantity: number) =>
    apiFetch("/orders/package", {
      method: "POST",
      body: JSON.stringify({ packageId, quantity }),
    }),

  createValidityOrder: (eventId: string, days: number) =>
    apiFetch("/orders/validity", {
      method: "POST",
      body: JSON.stringify({ eventId, days }),
    }),

  getMyOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    apiFetch<{ orders: any[]; total: number }>(`/orders/my?${new URLSearchParams(params as any).toString()}`),

  getPendingForApproval: () => apiFetch<any[]>("/orders/pending-approval"),

  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    apiFetch<{ orders: any[]; total: number }>(`/orders?${new URLSearchParams(params as any).toString()}`),

  approve: (id: string) => apiFetch(`/orders/${id}/approve`, { method: "POST" }),

  reject: (id: string, reason: string) =>
    apiFetch(`/orders/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  cancel: (id: string) => apiFetch(`/orders/${id}/cancel`, { method: "POST" }),
}

// Events API
export const eventsApi = {
  getMyEvents: (params?: { page?: number; limit?: number; status?: string }) =>
    apiFetch<{ events: any[]; total: number }>(`/events/my?${new URLSearchParams(params as any).toString()}`),

  getById: (id: string) => apiFetch<any>(`/events/${id}`),

  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    apiFetch<{ events: any[]; total: number }>(`/events?${new URLSearchParams(params as any).toString()}`),

  getLive: () => apiFetch<any[]>("/events/live"),

  getPublic: (userId: string, eventUrl: string) => apiFetch<any>(`/events/public/${userId}/${eventUrl}`),

  create: (data: any) =>
    apiFetch("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiFetch(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    apiFetch(`/events/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) => apiFetch(`/events/${id}`, { method: "DELETE" }),

  getTemplates: () => apiFetch<any[]>("/events/templates"),

  addComment: (eventId: string, guestName: string, message: string) =>
    apiFetch(`/events/${eventId}/comments`, {
      method: "POST",
      body: JSON.stringify({ guestName, message }),
    }),

  getComments: (eventId: string) => apiFetch<any[]>(`/events/${eventId}/comments`),

  getStatistics: (eventId: string) => apiFetch<any>(`/events/${eventId}/statistics`),

  extendValidity: (eventId: string, days: number) =>
    apiFetch(`/events/${eventId}/extend-validity`, {
      method: "POST",
      body: JSON.stringify({ days }),
    }),
}

// Domains API
export const domainsApi = {
  getMyDomains: () => apiFetch<any[]>("/domains/my"),

  add: (domain: string) =>
    apiFetch("/domains", {
      method: "POST",
      body: JSON.stringify({ domain }),
    }),

  verify: (id: string) =>
    apiFetch<{ verified: boolean; message: string }>(`/domains/${id}/verify`, {
      method: "POST",
    }),

  setPrimary: (id: string) => apiFetch(`/domains/${id}/primary`, { method: "PATCH" }),

  remove: (id: string) => apiFetch(`/domains/${id}`, { method: "DELETE" }),

  getInstructions: (id: string) => apiFetch<{ records: any[] }>(`/domains/${id}/instructions`),
}

// Payments API
export const paymentsApi = {
  initiateRecharge: (amount: number, gateway?: string) =>
    apiFetch<{ paymentUrl: string; orderId: string }>("/payments/recharge", {
      method: "POST",
      body: JSON.stringify({ amount, gateway }),
    }),

  getHistory: (params?: { page?: number; limit?: number }) =>
    apiFetch<{ payments: any[]; total: number }>(`/payments/history?${new URLSearchParams(params as any).toString()}`),

  getStatus: (id: string) => apiFetch<{ status: string; amount: number }>(`/payments/${id}/status`),

  getGateways: () => apiFetch<any[]>("/payments/gateways"),

  verifyCallback: (data: { paymentId: string; orderId: string; signature?: string }) =>
    apiFetch<{ verified: boolean; message: string }>("/payments/verify", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// Branding API
export const brandingApi = {
  getMyBranding: () => apiFetch<any>("/branding/my"),

  updateMyBranding: (data: any) =>
    apiFetch("/branding/my", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updatePaymentGateway: (gateway: string, apiKey: string, apiSecret: string) =>
    apiFetch("/branding/payment-gateway", {
      method: "POST",
      body: JSON.stringify({ gateway, apiKey, apiSecret }),
    }),

  getByDomain: (domain: string) => apiFetch<any>(`/branding/domain/${domain}`),
}

// Notifications API
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    apiFetch<{ notifications: any[]; total: number }>(
      `/notifications?${new URLSearchParams(params as any).toString()}`,
    ),

  getUnreadCount: () => apiFetch<{ count: number }>("/notifications/unread-count"),

  markAsRead: (id: string) => apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),

  markAllAsRead: () => apiFetch("/notifications/read-all", { method: "PATCH" }),

  delete: (id: string) => apiFetch(`/notifications/${id}`, { method: "DELETE" }),
}

// Streaming API
export const streamingApi = {
  getServerStatus: () => apiFetch<{ status: string; activeStreams: number }>("/streaming/status"),

  getStreamCredentials: (eventId: string) =>
    apiFetch<{ rtmpUrl: string; streamKey: string; playbackUrl: string }>(`/streaming/${eventId}/credentials`),

  regenerateStreamKey: (eventId: string) =>
    apiFetch<{ streamKey: string }>(`/streaming/${eventId}/regenerate-key`, {
      method: "POST",
    }),

  stopStream: (eventId: string) => apiFetch(`/streaming/${eventId}/stop`, { method: "POST" }),

  getRecordings: (eventId: string) => apiFetch<any[]>(`/streaming/${eventId}/recordings`),

  deleteRecording: (recordingId: string) => apiFetch(`/streaming/recordings/${recordingId}`, { method: "DELETE" }),
}

export default {
  auth: authApi,
  users: usersApi,
  wallet: walletApi,
  packages: packagesApi,
  orders: ordersApi,
  events: eventsApi,
  domains: domainsApi,
  payments: paymentsApi,
  branding: brandingApi,
  notifications: notificationsApi,
  streaming: streamingApi,
}
