import { promises as dns } from "dns"
import { getDb, toCamelRows } from "@/lib/db"
import { jsonOk, jsonError, withRole } from "@/lib/api-helpers"
import { getVerificationTxtHostDisplay } from "@/lib/platform-dns"

export const POST = withRole(["studio", "admin"], async (user, request) => {
  try {
    const { domainId } = await request.json()
    if (!domainId) return jsonError("domainId is required")

    const sql = getDb()
    const rows = await sql`SELECT * FROM domains WHERE id = ${domainId} AND user_id = ${user.id}`
    if (rows.length === 0) return jsonError("Domain not found")

    const domainRecord = toCamelRows(rows as Record<string, unknown>[])[0]
    const hostname = domainRecord.domain as string
    
    // Determine the exact TXT record name to check (e.g. _verify.live.example.com or _verify.example.com)
    // getVerificationTxtHostDisplay returns relative path e.g. _verify.live
    // So we need to append the root domain parts for a full resolveTxt call
    const domainParts = hostname.split(".")
    const rootDomain = domainParts.slice(-2).join(".")
    const txtPrefix = getVerificationTxtHostDisplay(hostname)
    const fullTxtRecord = `${txtPrefix}.${rootDomain}`

    try {
      const records = await dns.resolveTxt(fullTxtRecord)
      const flatRecords = records.flat()
      
      const isVerified = flatRecords.some(r => r.includes(domainRecord.verificationToken as string))

      if (isVerified) {
        await sql`
          UPDATE domains 
          SET verification_status = 'verified', verified_at = NOW() 
          WHERE id = ${domainId}
        `
        return jsonOk({ verified: true, message: "Domain verified successfully" })
      } else {
        return jsonOk({ 
          verified: false, 
          message: "Verification record not found or does not match. Please ensure your DNS has propagated.",
          checkedRecord: fullTxtRecord,
          expectedToken: domainRecord.verificationToken
        })
      }
    } catch (dnsErr: any) {
      console.warn(`DNS check failed for ${fullTxtRecord}:`, dnsErr.code)
      return jsonOk({ 
        verified: false, 
        message: dnsErr.code === "ENOTFOUND" ? "DNS record not found yet." : "Could not reach your DNS provider.",
        checkedRecord: fullTxtRecord
      })
    }
  } catch (err) {
    console.error("POST /api/studio/domains/verify error:", err)
    return jsonError("Internal verification error")
  }
})
