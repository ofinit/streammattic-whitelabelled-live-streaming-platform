import { GstInvoicesClient } from "@/components/invoices/gst-invoices-client"

export default function StreamerGstInvoicesPage() {
  return (
    <GstInvoicesClient
      mode="self"
      title="GST invoices"
      description="Download PDFs or a ZIP of your wallet recharge tax invoices for any date range."
    />
  )
}
