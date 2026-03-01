import { getDb, toCamelRows, toCamel } from "./db"

// ============================================================
// USERS
// ============================================================

export async function getUsers(filters?: {
  role?: string
  status?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const sql = getDb()
  const conditions: string[] = []
  const params: unknown[] = []
  let paramIdx = 1

  if (filters?.role) {
    conditions.push(`role = $${paramIdx++}`)
    params.push(filters.role)
  }
  if (filters?.status) {
    conditions.push(`status = $${paramIdx++}`)
    params.push(filters.status)
  }
  if (filters?.search) {
    conditions.push(`(name ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`)
    params.push(`%${filters.search}%`)
    paramIdx++
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const limit = filters?.limit ?? 50
  const offset = filters?.offset ?? 0

  const rows = await sql(`
    SELECT * FROM users ${where}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `, params)

  return toCamelRows(rows as Record<string, unknown>[])
}

export async function getUserById(id: string) {
  const sql = getDb()
  const rows = await sql`SELECT * FROM users WHERE id = ${id}`
  return rows.length > 0 ? toCamel(rows[0] as Record<string, unknown>) : null
}

export async function getUserByEmail(email: string) {
  const sql = getDb()
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`
  return rows.length > 0 ? toCamel(rows[0] as Record<string, unknown>) : null
}

export async function getUserCount(filters?: { role?: string; status?: string }) {
  const sql = getDb()
  const conditions: string[] = []
  const params: unknown[] = []
  let paramIdx = 1

  if (filters?.role) {
    conditions.push(`role = $${paramIdx++}`)
    params.push(filters.role)
  }
  if (filters?.status) {
    conditions.push(`status = $${paramIdx++}`)
    params.push(filters.status)
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const rows = await sql(`SELECT COUNT(*)::int AS count FROM users ${where}`, params)
  return (rows[0] as { count: number }).count
}

// ============================================================
// STUDIOS (users with role='studio')
// ============================================================

export async function getStudios(filters?: { status?: string; search?: string; limit?: number; offset?: number }) {
  return getUsers({ ...filters, role: "studio" })
}

export async function getStudioCount(status?: string) {
  return getUserCount({ role: "studio", status })
}

export async function getStudioWithStats(studioId: string) {
  const sql = getDb()
  const rows = await sql`
    SELECT
      u.*,
      (SELECT COUNT(*)::int FROM events WHERE studio_id = u.id) AS total_events,
      (SELECT COUNT(*)::int FROM events WHERE studio_id = u.id AND status = 'live') AS live_events,
      (SELECT COALESCE(w.balance, 0)::numeric FROM wallets w WHERE w.user_id = u.id) AS wallet_balance
    FROM users u
    WHERE u.id = ${studioId} AND u.role = 'studio'
  `
  return rows.length > 0 ? toCamel(rows[0] as Record<string, unknown>) : null
}

// ============================================================
// WALLETS
// ============================================================

export async function getWalletByUserId(userId: string) {
  const sql = getDb()
  const rows = await sql`SELECT * FROM wallets WHERE user_id = ${userId}`
  return rows.length > 0 ? toCamel(rows[0] as Record<string, unknown>) : null
}

export async function getWalletTransactions(walletId: string, limit = 20, offset = 0) {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM wallet_transactions
    WHERE wallet_id = ${walletId}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `
  return toCamelRows(rows as Record<string, unknown>[])
}

// ============================================================
// PACKAGES
// ============================================================

export async function getPackages(filters?: { isStudio?: boolean; isActive?: boolean }) {
  const sql = getDb()
  const conditions: string[] = []
  const params: unknown[] = []
  let paramIdx = 1

  if (filters?.isStudio !== undefined) {
    conditions.push(`is_reseller_package = $${paramIdx++}`)
    params.push(filters.isStudio)
  }
  if (filters?.isActive !== undefined) {
    conditions.push(`is_active = $${paramIdx++}`)
    params.push(filters.isActive)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const rows = await sql(`SELECT * FROM packages ${where} ORDER BY sort_order ASC, created_at ASC`, params)
  return toCamelRows(rows as Record<string, unknown>[])
}

export async function getPackageById(id: string) {
  const sql = getDb()
  const rows = await sql`SELECT * FROM packages WHERE id = ${id}`
  return rows.length > 0 ? toCamel(rows[0] as Record<string, unknown>) : null
}

// ============================================================
// ORDERS
// ============================================================

export async function getOrders(filters?: {
  userId?: string
  studioId?: string
  status?: string
  limit?: number
  offset?: number
}) {
  const sql = getDb()
  const conditions: string[] = []
  const params: unknown[] = []
  let paramIdx = 1

  if (filters?.userId) {
    conditions.push(`o.user_id = $${paramIdx++}`)
    params.push(filters.userId)
  }
  if (filters?.studioId) {
    conditions.push(`o.studio_id = $${paramIdx++}`)
    params.push(filters.studioId)
  }
  if (filters?.status) {
    conditions.push(`o.status = $${paramIdx++}`)
    params.push(filters.status)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const limit = filters?.limit ?? 50
  const offset = filters?.offset ?? 0

  const rows = await sql(`
    SELECT o.*, u.name AS user_name, u.email AS user_email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ${where}
    ORDER BY o.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `, params)

  return toCamelRows(rows as Record<string, unknown>[])
}

export async function getOrderCount(filters?: { userId?: string; studioId?: string; status?: string }) {
  const sql = getDb()
  const conditions: string[] = []
  const params: unknown[] = []
  let paramIdx = 1

  if (filters?.userId) {
    conditions.push(`user_id = $${paramIdx++}`)
    params.push(filters.userId)
  }
  if (filters?.studioId) {
    conditions.push(`studio_id = $${paramIdx++}`)
    params.push(filters.studioId)
  }
  if (filters?.status) {
    conditions.push(`status = $${paramIdx++}`)
    params.push(filters.status)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const rows = await sql(`SELECT COUNT(*)::int AS count FROM orders ${where}`, params)
  return (rows[0] as { count: number }).count
}

export async function getRevenueTotal(filters?: { studioId?: string; days?: number }) {
  const sql = getDb()
  const conditions: string[] = ["status = 'completed'"]
  const params: unknown[] = []
  let paramIdx = 1

  if (filters?.studioId) {
    conditions.push(`studio_id = $${paramIdx++}`)
    params.push(filters.studioId)
  }
  if (filters?.days) {
    conditions.push(`created_at >= NOW() - INTERVAL '${filters.days} days'`)
  }

  const where = `WHERE ${conditions.join(" AND ")}`
  const rows = await sql(`SELECT COALESCE(SUM(total), 0)::numeric AS total FROM orders ${where}`, params)
  return Number((rows[0] as { total: string }).total)
}

// ============================================================
// EVENTS
// ============================================================

export async function getEvents(filters?: {
  userId?: string
  studioId?: string
  status?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const sql = getDb()
  const conditions: string[] = []
  const params: unknown[] = []
  let paramIdx = 1

  if (filters?.userId) {
    conditions.push(`e.user_id = $${paramIdx++}`)
    params.push(filters.userId)
  }
  if (filters?.studioId) {
    conditions.push(`e.studio_id = $${paramIdx++}`)
    params.push(filters.studioId)
  }
  if (filters?.status) {
    conditions.push(`e.status = $${paramIdx++}`)
    params.push(filters.status)
  }
  if (filters?.search) {
    conditions.push(`(e.title ILIKE $${paramIdx})`)
    params.push(`%${filters.search}%`)
    paramIdx++
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const limit = filters?.limit ?? 50
  const offset = filters?.offset ?? 0

  const rows = await sql(`
    SELECT e.*, u.name AS user_name, u.email AS user_email
    FROM events e
    LEFT JOIN users u ON e.user_id = u.id
    ${where}
    ORDER BY e.scheduled_start DESC NULLS LAST, e.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `, params)

  return toCamelRows(rows as Record<string, unknown>[])
}

export async function getEventById(id: string) {
  const sql = getDb()
  const rows = await sql`
    SELECT e.*, u.name AS user_name, u.email AS user_email, r.platform_name AS studio_name
    FROM events e
    LEFT JOIN users u ON e.user_id = u.id
    LEFT JOIN users r ON e.studio_id = r.id
    WHERE e.id = ${id}
  `
  return rows.length > 0 ? toCamel(rows[0] as Record<string, unknown>) : null
}

export async function getEventCount(filters?: { userId?: string; studioId?: string; status?: string }) {
  const sql = getDb()
  const conditions: string[] = []
  const params: unknown[] = []
  let paramIdx = 1

  if (filters?.userId) {
    conditions.push(`user_id = $${paramIdx++}`)
    params.push(filters.userId)
  }
  if (filters?.studioId) {
    conditions.push(`studio_id = $${paramIdx++}`)
    params.push(filters.studioId)
  }
  if (filters?.status) {
    conditions.push(`status = $${paramIdx++}`)
    params.push(filters.status)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const rows = await sql(`SELECT COUNT(*)::int AS count FROM events ${where}`, params)
  return (rows[0] as { count: number }).count
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function getNotifications(userId: string, limit = 20, unreadOnly = false) {
  const sql = getDb()
  const readFilter = unreadOnly ? "AND is_read = false" : ""
  const rows = await sql(`
    SELECT * FROM notifications
    WHERE user_id = $1 ${readFilter}
    ORDER BY created_at DESC
    LIMIT $2
  `, [userId, limit])
  return toCamelRows(rows as Record<string, unknown>[])
}

export async function getUnreadNotificationCount(userId: string) {
  const sql = getDb()
  const rows = await sql`
    SELECT COUNT(*)::int AS count FROM notifications
    WHERE user_id = ${userId} AND is_read = false
  `
  return (rows[0] as { count: number }).count
}

// ============================================================
// DASHBOARD STATS (admin)
// ============================================================

export async function getAdminDashboardStats() {
  const sql = getDb()
  const rows = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE role = 'studio') AS total_studios,
      (SELECT COUNT(*)::int FROM users WHERE role = 'studio' AND status = 'active') AS active_studios,
      (SELECT COUNT(*)::int FROM users WHERE role = 'user') AS total_users,
      (SELECT COUNT(*)::int FROM users WHERE role = 'user' AND status = 'active') AS active_users,
      (SELECT COUNT(*)::int FROM events) AS total_events,
      (SELECT COUNT(*)::int FROM events WHERE status = 'live') AS live_events,
      (SELECT COUNT(*)::int FROM events WHERE status = 'scheduled') AS scheduled_events,
      (SELECT COUNT(*)::int FROM events WHERE status = 'completed') AS completed_events,
      (SELECT COUNT(*)::int FROM orders) AS total_orders,
      (SELECT COUNT(*)::int FROM orders WHERE status = 'completed') AS completed_orders,
      (SELECT COUNT(*)::int FROM orders WHERE status = 'pending') AS pending_orders,
      (SELECT COALESCE(SUM(total), 0)::numeric FROM orders WHERE status = 'completed') AS total_revenue,
      (SELECT COALESCE(SUM(total), 0)::numeric FROM orders WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days') AS monthly_revenue,
      (SELECT COALESCE(SUM(balance), 0)::numeric FROM wallets) AS total_wallet_balance,
      (SELECT COUNT(*)::int FROM packages WHERE is_active = true) AS active_packages
  `
  return toCamel(rows[0] as Record<string, unknown>)
}

// ============================================================
// DASHBOARD STATS (reseller)
// ============================================================

export async function getStudioDashboardStats(studioId: string) {
  const sql = getDb()
  const rows = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM events WHERE studio_id = ${studioId}) AS total_events,
      (SELECT COUNT(*)::int FROM events WHERE studio_id = ${studioId} AND status = 'live') AS live_events,
      (SELECT COUNT(*)::int FROM events WHERE studio_id = ${studioId} AND status = 'scheduled') AS scheduled_events,
      (SELECT COUNT(*)::int FROM events WHERE studio_id = ${studioId} AND status = 'completed') AS completed_events,
      (SELECT COUNT(*)::int FROM orders WHERE studio_id = ${studioId}) AS total_orders,
      (SELECT COALESCE(SUM(total), 0)::numeric FROM orders WHERE studio_id = ${studioId} AND status = 'completed') AS total_revenue,
      (SELECT COALESCE(SUM(total), 0)::numeric FROM orders WHERE studio_id = ${studioId} AND status = 'completed' AND created_at >= NOW() - INTERVAL '30 days') AS monthly_revenue,
      (SELECT COALESCE(balance, 0)::numeric FROM wallets WHERE user_id = ${studioId}) AS wallet_balance
  `
  return toCamel(rows[0] as Record<string, unknown>)
}

// ============================================================
// PLATFORM SETTINGS
// ============================================================

export async function getPlatformSetting(key: string) {
  const sql = getDb()
  const rows = await sql`SELECT value FROM platform_settings WHERE key = ${key}`
  return rows.length > 0 ? (rows[0] as { value: unknown }).value : null
}

export async function setPlatformSetting(key: string, value: unknown, userId?: string) {
  const sql = getDb()
  await sql`
    INSERT INTO platform_settings (key, value, updated_by)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, ${userId ?? null})
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}::jsonb, updated_by = ${userId ?? null}, updated_at = NOW()
  `
}

// ============================================================
// RECENT ACTIVITY (admin)
// ============================================================

export async function getRecentOrders(limit = 5) {
  const sql = getDb()
  const rows = await sql`
    SELECT o.*, u.name AS user_name, u.email AS user_email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
    LIMIT ${limit}
  `
  return toCamelRows(rows as Record<string, unknown>[])
}

export async function getRecentEvents(limit = 5) {
  const sql = getDb()
  const rows = await sql`
    SELECT e.*, u.name AS user_name
    FROM events e
    LEFT JOIN users u ON e.user_id = u.id
    ORDER BY e.created_at DESC
    LIMIT ${limit}
  `
  return toCamelRows(rows as Record<string, unknown>[])
}
