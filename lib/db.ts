import { Pool } from "pg"

const DATABASE_URL = process.env.DATABASE_URL
let pool: Pool | null = null

function getPool(): Pool {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  if (!pool) {
    pool = new Pool({ connectionString: DATABASE_URL })
  }
  return pool
}

/** Tagged-template SQL helper compatible with existing call sites. Returns rows array.
 *
 * Two calling conventions are supported:
 *  1. Tagged template:  sql`SELECT ... WHERE id = ${id}`
 *  2. Pre-built query:  sql("SELECT ... WHERE id = $1", [id])
 */
async function sql(
  strings: TemplateStringsArray | string,
  ...values: unknown[]
): Promise<Record<string, unknown>[]> {
  let text: string
  let params: unknown[]

  if (typeof strings === "string") {
    // Called as sql(queryString, paramsArray) — query already has $1/$2 placeholders
    text = strings
    params = values.length === 1 && Array.isArray(values[0]) ? (values[0] as unknown[]) : values
  } else {
    // Tagged template literal: sql`SELECT ... ${value1} ... ${value2}`
    text = strings.reduce(
      (acc: string, part: string, i: number) => acc + part + (i < values.length ? `$${i + 1}` : ""),
      ""
    )
    params = values
  }

  const result = await getPool().query(text, params)
  return (result.rows || []) as Record<string, unknown>[]
}

export function getDb() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return sql
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
