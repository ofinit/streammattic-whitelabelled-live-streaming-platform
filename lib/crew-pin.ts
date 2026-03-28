import { randomBytes, scryptSync, timingSafeEqual } from "crypto"

const CREW_PIN_SALT = process.env.CREW_PIN_SALT || "streamlivee-crew-pin-v1"

export function hashCrewPin(pin: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(pin, salt + CREW_PIN_SALT, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyCrewPin(plainPin: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":")
    if (!salt || !hash) return false
    const derived = scryptSync(plainPin, salt + CREW_PIN_SALT, 64).toString("hex")
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(derived, "hex"))
  } catch {
    return false
  }
}
