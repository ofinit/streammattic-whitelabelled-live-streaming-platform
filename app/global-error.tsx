"use client"

/**
 * Catches errors that escape the root layout (e.g. during RSC render).
 * This component replaces the entire root layout when triggered.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: "48rem", margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>
          {error?.message ?? "Internal Server Error"}
        </p>
        {error?.stack && (
          <pre
            style={{
              fontSize: "0.75rem",
              overflow: "auto",
              maxHeight: "12rem",
              padding: "1rem",
              background: "#f5f5f5",
              borderRadius: "0.5rem",
              marginTop: "1rem",
            }}
          >
            {error.stack}
          </pre>
        )}
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
