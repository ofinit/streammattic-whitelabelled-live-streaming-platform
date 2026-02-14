import type { GSTConfiguration, PriceBreakdown, Invoice } from "./types"

// Calculate price breakdown with GST
export function calculatePriceBreakdown(desiredAmount: number, gstConfig: GSTConfiguration | null): PriceBreakdown {
  const baseAmount = desiredAmount // What user wants in wallet

  if (!gstConfig || !gstConfig.gstEnabled) {
    return {
      desiredWalletAmount: desiredAmount,
      gstEnabled: false,
      gstPercentage: 0,
      baseAmount: desiredAmount,
      gstAmount: 0,
      totalPayable: desiredAmount,
      walletCreditAmount: desiredAmount,
    }
  }

  // GST is ADDED ON TOP of desired amount
  const gstAmount = Math.round((baseAmount * gstConfig.gstPercentage) / 100)
  const totalPayable = baseAmount + gstAmount

  return {
    desiredWalletAmount: desiredAmount,
    gstEnabled: true,
    gstPercentage: gstConfig.gstPercentage,
    baseAmount: baseAmount,
    gstAmount: gstAmount,
    totalPayable: totalPayable,
    walletCreditAmount: baseAmount, // User gets exactly what they wanted
  }
}

// Generate invoice number
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0")
  return `INV-${year}-${random}`
}

// Split GST into CGST and SGST for intrastate (or IGST for interstate)
export function splitGST(totalGst: number, isInterstate = false) {
  if (isInterstate) {
    return {
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: totalGst,
    }
  }
  // For intrastate, split equally
  const half = Math.round(totalGst / 2)
  return {
    cgstAmount: half,
    sgstAmount: totalGst - half, // Ensure total adds up perfectly
    igstAmount: 0,
  }
}

// Create invoice object
export function createInvoice(params: {
  transactionId: string
  issuerId: string
  issuerType: string
  issuerGstConfig: GSTConfiguration
  recipientId: string
  recipientType: string
  recipientName: string
  recipientEmail: string
  recipientGstNumber?: string
  baseAmount: number
  gstAmount: number
  gstPercentage: number
  paymentId?: string
  paymentMethod?: string
}): Partial<Invoice> {
  const { cgstAmount, sgstAmount, igstAmount } = splitGST(params.gstAmount, false)

  return {
    invoiceNumber: generateInvoiceNumber(),
    invoiceType: params.issuerGstConfig.gstEnabled ? "gst_invoice" : "regular_invoice",
    issuerId: params.issuerId,
    issuerType: params.issuerType as any,
    issuerBusinessName: params.issuerGstConfig.businessName,
    issuerGstNumber: params.issuerGstConfig.gstNumber,
    issuerAddress: `${params.issuerGstConfig.businessAddress}, ${params.issuerGstConfig.city}, ${params.issuerGstConfig.state} - ${params.issuerGstConfig.pincode}`,
    recipientId: params.recipientId,
    recipientType: params.recipientType as any,
    recipientName: params.recipientName,
    recipientEmail: params.recipientEmail,
    recipientGstNumber: params.recipientGstNumber,
    baseAmount: params.baseAmount,
    gstPercentage: params.gstPercentage,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalGstAmount: params.gstAmount,
    totalAmount: params.baseAmount + params.gstAmount,
    transactionId: params.transactionId,
    paymentId: params.paymentId,
    paymentMethod: params.paymentMethod,
    invoiceDate: new Date(),
    status: "issued",
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}
