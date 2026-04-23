import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import type { PlatformGSTSettings } from "@/lib/platform-gst"

export async function buildWalletRechargeGstInvoicePdf(params: {
  invoiceNumber: string
  issuedAt: Date
  platform: PlatformGSTSettings
  recipientName: string
  recipientEmail: string
  recipientGstNumber?: string | null
  recipientAddress?: string | null
  /** b2b | b2c | legacy tax_invoice */
  invoiceType?: string | null
  baseAmountPaise: number
  gstPercentage: number
  gstAmountPaise: number
  totalPaidPaise: number
  paymentId: string
  orderId: string
  /** Determines description copy — "studio_upgrade" uses subscription wording, otherwise wallet recharge */
  orderType?: string | null
}): Promise<Uint8Array> {
  const isStudioUpgrade = params.orderType === "studio_upgrade"
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595.28, 841.89])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const { width } = page.getSize()
  let y = 800
  const left = 50
  const line = (text: string, size = 11, bold = false, color = rgb(0, 0, 0)) => {
    page.drawText(text, { x: left, y, size, font: bold ? fontBold : font, color })
    y -= size + 6
  }

  line("TAX INVOICE", 16, true)
  y -= 6
  line(`Invoice No: ${params.invoiceNumber}`, 10)
  line(`Date: ${params.issuedAt.toLocaleString("en-IN")}`, 10)
  y -= 10

  line("Supplier (Platform)", 12, true)
  line(params.platform.businessName || "StreamLivee", 10)
  if (params.platform.gstNumber) line(`GSTIN: ${params.platform.gstNumber}`, 10)
  const addr = [params.platform.businessAddress, params.platform.city, params.platform.state, params.platform.pincode]
    .filter(Boolean)
    .join(", ")
  if (addr) line(addr, 9)
  y -= 8

  line("Bill To", 12, true)
  line(params.recipientName, 10)
  line(params.recipientEmail, 10)
  if (params.invoiceType && params.invoiceType !== "tax_invoice") {
    line(`Invoice type: ${String(params.invoiceType).toUpperCase()}`, 10)
  }
  if (params.recipientGstNumber) {
    line(`GSTIN: ${params.recipientGstNumber}`, 10)
  }
  if (params.recipientAddress) {
    line(params.recipientAddress, 9)
  }
  y -= 10

  // Standard PDF fonts (Helvetica) only support Latin-1 — use "Rs." instead of the rupee symbol
  const fmt = (paise: number) => `Rs. ${(paise / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
  if (isStudioUpgrade) {
    line("Description: Annual Studio Subscription", 10)
    line(`Taxable value: ${fmt(params.baseAmountPaise)}`, 10)
    line(`GST @ ${params.gstPercentage}%: ${fmt(params.gstAmountPaise)}`, 10)
    line(`Total paid (incl. GST): ${fmt(params.totalPaidPaise)}`, 11, true)
  } else {
    line("Description: Wallet recharge (amount to be credited to wallet)", 10)
    line(`Taxable value: ${fmt(params.baseAmountPaise)}`, 10)
    line(`GST @ ${params.gstPercentage}%: ${fmt(params.gstAmountPaise)}`, 10)
    line(`Total paid (incl. GST): ${fmt(params.totalPaidPaise)}`, 11, true)
    line(`Amount credited to wallet (excl. GST): ${fmt(params.baseAmountPaise)}`, 10)
  }
  y -= 8
  line(`Payment ID: ${params.paymentId}`, 9, false, rgb(0.3, 0.3, 0.3))
  line(`Order ID: ${params.orderId}`, 9, false, rgb(0.3, 0.3, 0.3))
  y -= 12
  line("This is a computer-generated invoice.", 8, false, rgb(0.4, 0.4, 0.4))

  const footer = isStudioUpgrade
    ? "StreamLivee — GST invoice for annual studio subscription"
    : "StreamLivee — GST invoice for wallet recharge"
  page.drawText(footer, {
    x: left,
    y: 40,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
    maxWidth: width - left * 2,
  })

  return pdf.save()
}
