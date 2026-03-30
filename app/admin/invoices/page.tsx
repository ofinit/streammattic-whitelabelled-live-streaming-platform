import { GstInvoicesClient } from "@/components/invoices/gst-invoices-client"

export default function AdminGstInvoicesPage() {
  return (
    <GstInvoicesClient
      mode="admin"
      title="GST invoices"
      description="Download wallet tax invoices by month or date range. Bulk month ZIP is platform-wide unless you set a recipient user ID. Streamers and studios have their own GST invoices page."
    />
  )
}
