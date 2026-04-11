/** Escape `%`, `_`, `\` for safe use in SQL ILIKE with ESCAPE '\'. */
export function escapeSqlLikePattern(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")
}
