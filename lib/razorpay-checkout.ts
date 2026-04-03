/** Shared Razorpay Checkout.js loader for wallet recharge and studio upgrade. */

export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("No window"))
      return
    }
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
      resolve()
      return
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed")), { once: true })
      return
    }
    const s = document.createElement("script")
    s.src = "https://checkout.razorpay.com/v1/checkout.js"
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Failed to load Razorpay"))
    document.body.appendChild(s)
  })
}

export type RazorpayConstructor = new (options: Record<string, unknown>) => { open: () => void }
