import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib"
import type { PlatformGSTSettings } from "@/lib/platform-gst"

const BLACK   = rgb(0, 0, 0)
const DARK    = rgb(0.1, 0.1, 0.1)
const MID     = rgb(0.4, 0.4, 0.4)
const LIGHT   = rgb(0.7, 0.7, 0.7)
const WHITE   = rgb(1, 1, 1)
const ACCENT  = rgb(0.04, 0.47, 0.35)   // dark teal
const ACCENT2 = rgb(0.93, 0.97, 0.95)   // very light teal tint for row bg

const PAGE_W = 595.28
const PAGE_H = 841.89
const ML = 45   // margin left
const MR = 45   // margin right
const CONTENT_W = PAGE_W - ML - MR

function fmt(paise: number) {
  return `Rs. ${(paise / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
}

function drawRect(
  page: PDFPage,
  x: number, y: number, w: number, h: number,
  fill?: ReturnType<typeof rgb>,
  stroke?: ReturnType<typeof rgb>,
  strokeWidth = 0.5
) {
  if (fill) {
    page.drawRectangle({ x, y, width: w, height: h, color: fill, borderWidth: 0 })
  }
  if (stroke) {
    page.drawRectangle({ x, y, width: w, height: h, borderColor: stroke, borderWidth: strokeWidth, color: undefined })
  }
}

function drawLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number, color = LIGHT, thickness = 0.5) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, color, thickness })
}

function text(
  page: PDFPage,
  str: string,
  x: number, y: number,
  size: number,
  font: PDFFont,
  color = BLACK,
  maxWidth?: number
) {
  page.drawText(str, { x, y, size, font, color, ...(maxWidth ? { maxWidth } : {}) })
}

export async function buildWalletRechargeGstInvoicePdf(params: {
  invoiceNumber: string
  issuedAt: Date
  platform: PlatformGSTSettings
  recipientName: string
  recipientEmail: string
  recipientGstNumber?: string | null
  recipientAddress?: string | null
  invoiceType?: string | null
  baseAmountPaise: number
  gstPercentage: number
  gstAmountPaise: number
  totalPaidPaise: number
  paymentId: string
  orderId: string
  orderType?: string | null
}): Promise<Uint8Array> {
  const isStudioUpgrade = params.orderType === "studio_upgrade"
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([PAGE_W, PAGE_H])
  const font     = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  /* ── HEADER BAND ──────────────────────────────────────────────────── */
  drawRect(page, 0, PAGE_H - 80, PAGE_W, 80, ACCENT)

  // Company name (left)
  text(page, params.platform.businessName || "StreamLivee", ML, PAGE_H - 35, 18, fontBold, WHITE)
  const gstinLine = params.platform.gstNumber ? `GSTIN: ${params.platform.gstNumber}` : ""
  if (gstinLine) text(page, gstinLine, ML, PAGE_H - 52, 9, font, rgb(0.8, 1, 0.9))

  // TAX INVOICE label (right)
  const label = "TAX INVOICE"
  const labelW = fontBold.widthOfTextAtSize(label, 20)
  text(page, label, PAGE_W - MR - labelW, PAGE_H - 38, 20, fontBold, WHITE)
  const invType = params.invoiceType ? String(params.invoiceType).toUpperCase() : ""
  if (invType && invType !== "TAX_INVOICE") {
    const tw = font.widthOfTextAtSize(invType, 9)
    text(page, invType, PAGE_W - MR - tw, PAGE_H - 53, 9, font, rgb(0.8, 1, 0.9))
  }

  let y = PAGE_H - 100

  /* ── INVOICE META BOX ─────────────────────────────────────────────── */
  const metaBoxH = 40
  drawRect(page, ML, y - metaBoxH, CONTENT_W, metaBoxH, ACCENT2)
  drawRect(page, ML, y - metaBoxH, CONTENT_W, metaBoxH, undefined, LIGHT)

  const dateStr = params.issuedAt.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  })
  text(page, "Invoice No:", ML + 10, y - 16, 9, font, MID)
  text(page, params.invoiceNumber, ML + 10, y - 29, 10, fontBold, DARK)

  const col2 = ML + CONTENT_W / 2
  text(page, "Date:", col2, y - 16, 9, font, MID)
  text(page, dateStr, col2, y - 29, 10, fontBold, DARK)

  y -= metaBoxH + 20

  /* ── SUPPLIER / BILL TO ─────────────────────────────────────────────── */
  const halfW = (CONTENT_W - 20) / 2

  // Supplier box
  drawRect(page, ML, y - 130, halfW, 130, undefined, LIGHT)
  drawRect(page, ML, y - 18, halfW, 18, ACCENT)
  text(page, "SUPPLIER (BILLED FROM)", ML + 8, y - 13, 8, fontBold, WHITE)

  let sy = y - 32
  const platAddr = [params.platform.businessAddress, params.platform.city, params.platform.state, params.platform.pincode]
    .filter(Boolean).join(", ")
  text(page, params.platform.businessName || "StreamLivee", ML + 8, sy, 10, fontBold, DARK); sy -= 14
  if (params.platform.gstNumber) {
    text(page, `GSTIN: ${params.platform.gstNumber}`, ML + 8, sy, 9, font, MID); sy -= 13
  }
  if (platAddr) {
    // wrap long address
    const words = platAddr.split(" ")
    let line1 = "", line2 = ""
    for (const w of words) {
      if (font.widthOfTextAtSize(line1 + " " + w, 9) < halfW - 20) line1 += (line1 ? " " : "") + w
      else line2 += (line2 ? " " : "") + w
    }
    text(page, line1, ML + 8, sy, 9, font, MID); sy -= 12
    if (line2) { text(page, line2, ML + 8, sy, 9, font, MID); sy -= 12 }
  }

  // Bill To box
  const bx = ML + halfW + 20
  drawRect(page, bx, y - 130, halfW, 130, undefined, LIGHT)
  drawRect(page, bx, y - 18, halfW, 18, ACCENT)
  text(page, "BILL TO (RECIPIENT)", bx + 8, y - 13, 8, fontBold, WHITE)

  let by = y - 32
  text(page, params.recipientName, bx + 8, by, 10, fontBold, DARK); by -= 14
  text(page, params.recipientEmail, bx + 8, by, 9, font, MID); by -= 13
  if (params.recipientGstNumber) {
    text(page, `GSTIN: ${params.recipientGstNumber}`, bx + 8, by, 9, font, MID); by -= 13
  }
  if (params.recipientAddress) {
    const words = params.recipientAddress.split(" ")
    let line1 = "", line2 = ""
    for (const w of words) {
      if (font.widthOfTextAtSize(line1 + " " + w, 9) < halfW - 20) line1 += (line1 ? " " : "") + w
      else line2 += (line2 ? " " : "") + w
    }
    text(page, line1, bx + 8, by, 9, font, MID); by -= 12
    if (line2) { text(page, line2, bx + 8, by, 9, font, MID) }
  }

  y -= 148

  /* ── ITEMS TABLE ──────────────────────────────────────────────────── */
  const COL = {
    desc: ML,
    hsn:  ML + CONTENT_W * 0.46,
    qty:  ML + CONTENT_W * 0.60,
    rate: ML + CONTENT_W * 0.72,
    amt:  ML + CONTENT_W * 0.84,
  }
  const tableRight = ML + CONTENT_W

  // Table header
  const thH = 22
  drawRect(page, ML, y - thH, CONTENT_W, thH, ACCENT)
  text(page, "Description",       COL.desc + 6, y - 15, 8, fontBold, WHITE)
  text(page, "HSN/SAC",           COL.hsn  + 4, y - 15, 8, fontBold, WHITE)
  text(page, "Qty",               COL.qty  + 4, y - 15, 8, fontBold, WHITE)
  text(page, "Rate (Rs.)",        COL.rate + 4, y - 15, 8, fontBold, WHITE)
  text(page, "Amount (Rs.)",      COL.amt  + 4, y - 15, 8, fontBold, WHITE)
  y -= thH

  // Item row
  const rowH = 28
  drawRect(page, ML, y - rowH, CONTENT_W, rowH, ACCENT2)
  drawRect(page, ML, y - rowH, CONTENT_W, rowH, undefined, LIGHT)

  const descText = isStudioUpgrade ? "Annual Studio Subscription" : "Wallet Recharge (Platform Credits)"
  text(page, descText,                   COL.desc + 6, y - 11, 9, fontBold, DARK, COL.hsn - COL.desc - 10)
  text(page, "998313",                   COL.hsn  + 4, y - 11, 9, font, DARK)
  text(page, "1",                        COL.qty  + 4, y - 11, 9, font, DARK)
  text(page, fmt(params.baseAmountPaise), COL.rate + 4, y - 11, 9, font, DARK)
  text(page, fmt(params.baseAmountPaise), COL.amt  + 4, y - 11, 9, font, DARK)

  // secondary desc line
  const subDesc = isStudioUpgrade
    ? "Platform subscription — access to studio features"
    : "Amount credited to wallet (excl. GST)"
  text(page, subDesc, COL.desc + 6, y - 22, 7.5, font, MID, COL.hsn - COL.desc - 10)
  y -= rowH

  /* ── TAX SUMMARY ──────────────────────────────────────────────────── */
  y -= 12
  // Tax breakdown header
  const taxX = ML + CONTENT_W * 0.5
  const taxW = CONTENT_W * 0.5
  drawRect(page, taxX, y - 18, taxW, 18, ACCENT)
  text(page, "TAX SUMMARY", taxX + 8, y - 13, 8, fontBold, WHITE)
  y -= 18

  const taxRowH = 20
  const taxRows: [string, string, string, string][] = [
    ["GST Type", `Rate`, "Taxable Amt", "Tax Amt"],
  ]
  // header row
  drawRect(page, taxX, y - taxRowH, taxW, taxRowH, rgb(0.88, 0.93, 0.91))
  drawRect(page, taxX, y - taxRowH, taxW, taxRowH, undefined, LIGHT)
  const [th0, th1, th2, th3] = taxRows[0]
  const cw = taxW / 4
  text(page, th0, taxX + 4,        y - 14, 8, fontBold, DARK)
  text(page, th1, taxX + cw + 4,   y - 14, 8, fontBold, DARK)
  text(page, th2, taxX + cw*2 + 4, y - 14, 8, fontBold, DARK)
  text(page, th3, taxX + cw*3 + 4, y - 14, 8, fontBold, DARK)
  y -= taxRowH

  // CGST / SGST rows (split GST 50/50) or IGST for inter-state
  const halfGst = params.gstAmountPaise / 2
  const halfPct = params.gstPercentage / 2
  const taxData: [string, string, string, string][] = [
    ["CGST", `${halfPct}%`, fmt(params.baseAmountPaise), fmt(halfGst)],
    ["SGST", `${halfPct}%`, fmt(params.baseAmountPaise), fmt(halfGst)],
    ["Total GST", `${params.gstPercentage}%`, "", fmt(params.gstAmountPaise)],
  ]
  for (let i = 0; i < taxData.length; i++) {
    const isTotal = i === taxData.length - 1
    const bg = isTotal ? ACCENT2 : WHITE
    drawRect(page, taxX, y - taxRowH, taxW, taxRowH, bg)
    drawRect(page, taxX, y - taxRowH, taxW, taxRowH, undefined, LIGHT)
    const [c0, c1, c2, c3] = taxData[i]
    const f = isTotal ? fontBold : font
    text(page, c0, taxX + 4,        y - 14, 8, f, DARK)
    text(page, c1, taxX + cw + 4,   y - 14, 8, f, DARK)
    text(page, c2, taxX + cw*2 + 4, y - 14, 8, f, DARK)
    text(page, c3, taxX + cw*3 + 4, y - 14, 8, f, DARK)
    y -= taxRowH
  }

  /* ── TOTALS BOX ───────────────────────────────────────────────────── */
  y -= 12
  const totX = ML + CONTENT_W * 0.5
  const totW = CONTENT_W * 0.5
  const totRows: [string, string, boolean][] = [
    ["Taxable Amount",       fmt(params.baseAmountPaise), false],
    [`GST (${params.gstPercentage}%)`, fmt(params.gstAmountPaise), false],
    ["Total (incl. GST)",    fmt(params.totalPaidPaise), true],
  ]
  for (const [label, val, bold] of totRows) {
    const rh = bold ? 26 : 20
    const bg = bold ? ACCENT : WHITE
    const fc = bold ? WHITE : DARK
    const lfc = bold ? WHITE : MID
    drawRect(page, totX, y - rh, totW, rh, bg)
    drawRect(page, totX, y - rh, totW, rh, undefined, LIGHT)
    const valW = font.widthOfTextAtSize(val, bold ? 11 : 9)
    text(page, label, totX + 8,              y - (bold ? 17 : 14), bold ? 10 : 9, bold ? fontBold : font, lfc)
    text(page, val,   tableRight - valW - 8,  y - (bold ? 17 : 14), bold ? 11 : 9, bold ? fontBold : font, fc)
    y -= rh
  }

  /* ── PAYMENT REFERENCE ────────────────────────────────────────────── */
  y -= 20
  drawLine(page, ML, y, ML + CONTENT_W, y)
  y -= 14
  text(page, "Payment Reference", ML, y, 9, fontBold, DARK)
  y -= 13
  text(page, `Payment ID : ${params.paymentId}`, ML, y, 8.5, font, MID)
  y -= 12
  text(page, `Order ID   : ${params.orderId}`, ML, y, 8.5, font, MID)

  /* ── FOOTER ───────────────────────────────────────────────────────── */
  drawRect(page, 0, 0, PAGE_W, 40, ACCENT)
  text(page, "This is a computer-generated invoice and does not require a physical signature.", ML, 25, 7.5, font, rgb(0.8, 1, 0.9), CONTENT_W)
  const footerRight = `${params.platform.businessName || "StreamLivee"} | GSTIN: ${params.platform.gstNumber || "N/A"}`
  const frw = font.widthOfTextAtSize(footerRight, 7.5)
  text(page, footerRight, PAGE_W - MR - frw, 13, 7.5, font, rgb(0.7, 0.9, 0.8))

  return pdf.save()
}
