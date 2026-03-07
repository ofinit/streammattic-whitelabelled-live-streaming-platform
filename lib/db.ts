import { neon } from "@neondatabase/serverless"

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return neon(process.env.DATABASE_URL)
}

// Helper to format rows from snake_case DB columns to camelCase JS objects
export function toCamel<T extends Record<string, unknown>>(row: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = value
  }
  return result as T
}

// Apply toCamel to an array of rows
export function toCamelRows<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.map(toCamel)
}
