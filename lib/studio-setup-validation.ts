const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Basic hostname: labels, no protocol or path */
export function isValidHostname(host: string): boolean {
  const h = host.trim().toLowerCase()
  if (!h || h.includes("/") || h.includes(":")) return false
  if (h.startsWith("http://") || h.startsWith("https://")) return false
  const labels = h.split(".").filter(Boolean)
  if (labels.length < 2) return false
  return labels.every((lab) => /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(lab) && lab.length <= 63)
}

/** Hostname only, from stored `https://host` or user-typed host. */
export function companyWebsiteHost(input: string): string {
  const w = input.trim()
  if (!w) return ""
  try {
    const u = new URL(w.includes("://") ? w : `https://${w}`)
    return u.hostname.toLowerCase().replace(/^\[|\]$/g, "")
  } catch {
    return ""
  }
}

export function validateCompanyStep(input: {
  companyName: string
  email: string
  phoneDialCode: string
  /** National number only (no country code). */
  phoneLocal: string
  /** Same hostname rules as Custom Domain step (no https://). */
  customDomain: string
}): string | null {
  if (!input.companyName.trim()) return "Company name is required."
  if (!input.email.trim()) return "Support email is required."
  if (!EMAIL_RE.test(input.email.trim())) return "Enter a valid support email."
  const localDigits = input.phoneLocal.replace(/\D/g, "")
  if (localDigits.length > 0) {
    if (localDigits.length < 6 || localDigits.length > 15) {
      return "Enter a valid national phone number (6–15 digits), or leave blank."
    }
  }
  const d = input.customDomain.trim().toLowerCase()
  if (!d) return "Enter your custom domain (e.g. live.yourcompany.com or yourcompany.com)."
  if (!isValidHostname(d)) {
    return "Enter a valid domain (e.g. yourcompany.com) without https://. Use a real suffix like .com or .in."
  }
  return null
}

export function validateBrandingStep(input: { platformName: string; primaryColor: string }): string | null {
  if (!input.platformName.trim()) return "Platform name is required."
  if (!/^#[0-9A-Fa-f]{6}$/.test(input.primaryColor.trim())) return "Primary color must be a valid hex color."
  return null
}

export function validateDomainStep(input: { customDomain: string; skipDomain: boolean }): string | null {
  if (input.skipDomain) return null
  const d = input.customDomain.trim().toLowerCase()
  if (!d) return "Enter your domain or skip this step."
  if (!isValidHostname(d)) return "Enter a valid domain (e.g. yourcompany.com) without https://."
  return null
}

export function validatePaymentStep(
  input: {
    gateway: string
    skipPayment: boolean
    studioUpgradePayMethod?: "" | "wallet" | "razorpay" | "instamojo"
  },
  opts?: { streamerUpgrade?: boolean },
): string | null {
  if (opts?.streamerUpgrade) {
    if (!input.studioUpgradePayMethod) {
      return "Choose Wallet, Razorpay, or Instamojo to pay for your Studio subscription."
    }
    return null
  }
  return null
}
