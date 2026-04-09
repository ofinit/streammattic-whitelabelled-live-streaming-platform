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

export function validateCompanyStep(input: {
  companyName: string
  email: string
  phone: string
  website: string
}): string | null {
  if (!input.companyName.trim()) return "Company name is required."
  if (!input.email.trim()) return "Support email is required."
  if (!EMAIL_RE.test(input.email.trim())) return "Enter a valid support email."
  if (input.phone.trim()) {
    const digits = input.phone.replace(/\D/g, "")
    if (digits.length < 10 || digits.length > 15) return "Enter a valid phone number (10–15 digits)."
  }
  if (input.website.trim()) {
    try {
      const u = new URL(input.website.startsWith("http") ? input.website : `https://${input.website}`)
      if (u.protocol !== "https:" && u.protocol !== "http:") return "Company website must be a valid http(s) URL."
    } catch {
      return "Company website must be a valid URL."
    }
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

export function validatePaymentStep(input: {
  gateway: string
  skipPayment: boolean
}): string | null {
  if (input.skipPayment) return null
  if (!input.gateway) return "Choose a preferred gateway or skip for now."
  return null
}
