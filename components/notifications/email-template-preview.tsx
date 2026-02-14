"use client"

import { Mail } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { EmailTemplate } from "@/lib/types"

interface EmailTemplatePreviewProps {
  template: EmailTemplate
}

export function EmailTemplatePreview({ template }: EmailTemplatePreviewProps) {
  const getPreviewContent = () => {
    switch (template.type) {
      case "welcome":
        return (
          <>
            <h2 style={{ color: "#333", marginBottom: 16 }}>Welcome to LiveStream Pro! 🎉</h2>
            <p>Hi John,</p>
            <p>Thank you for joining us! Your account is ready.</p>
            <div style={{ textAlign: "center", margin: "24px 0" }}>
              <a
                href="#"
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                Get Started
              </a>
            </div>
          </>
        )
      case "order_confirmation":
        return (
          <>
            <h2 style={{ color: "#333", marginBottom: 16 }}>Order Confirmation</h2>
            <p>Hi John,</p>
            <p>Your order has been received.</p>
            <div
              style={{
                background: "#f0f9ff",
                borderLeft: "4px solid #2563eb",
                padding: 15,
                margin: "20px 0",
              }}
            >
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr>
                    <td>
                      <strong>Order:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>ORD-M1K8X-ABC1</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Type:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>Professional Package</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Status:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span
                        style={{
                          background: "#fef9c3",
                          color: "#854d0e",
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                        }}
                      >
                        PENDING
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Total:</strong>
                    </td>
                    <td style={{ textAlign: "right", fontSize: 24, fontWeight: "bold", color: "#2563eb" }}>₹2,499</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )
      case "payment_success":
        return (
          <>
            <h2 style={{ color: "#333", marginBottom: 16 }}>Payment Successful ✓</h2>
            <p>Hi John,</p>
            <p>Your payment has been processed.</p>
            <div
              style={{
                background: "#f0f9ff",
                borderLeft: "4px solid #2563eb",
                padding: 15,
                margin: "20px 0",
              }}
            >
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr>
                    <td>Amount:</td>
                    <td style={{ textAlign: "right" }}>₹10,000</td>
                  </tr>
                  <tr>
                    <td>GST (18%):</td>
                    <td style={{ textAlign: "right" }}>₹1,800</td>
                  </tr>
                  <tr>
                    <td colSpan={2}>
                      <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Total Paid:</strong>
                    </td>
                    <td style={{ textAlign: "right", fontSize: 24, fontWeight: "bold", color: "#2563eb" }}>₹11,800</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>₹10,000 has been added to your wallet.</p>
          </>
        )
      case "event_live":
        return (
          <>
            <h2 style={{ color: "#333", marginBottom: 16 }}>🔴 Your Event is LIVE!</h2>
            <p>Hi John,</p>
            <p>
              <strong>Tech Conference 2024</strong> is now streaming live.
            </p>
            <div style={{ textAlign: "center", margin: "24px 0" }}>
              <a
                href="#"
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  backgroundColor: "#2563eb",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                Watch Live
              </a>
            </div>
          </>
        )
      default:
        return (
          <>
            <h2 style={{ color: "#333", marginBottom: 16 }}>{template.name}</h2>
            <p>This is a preview of the {template.name.toLowerCase()} email template.</p>
            <p>Variables available: {template.variables.join(", ")}</p>
          </>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </div>
          </div>
          <Badge variant="outline">{template.type}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          {/* Email Header */}
          <div className="bg-muted px-4 py-2 border-b">
            <p className="text-sm">
              <span className="text-muted-foreground">Subject:</span>{" "}
              <span className="font-medium">{template.subject}</span>
            </p>
          </div>

          {/* Email Body */}
          <div className="bg-[#f5f5f5] p-4">
            <div
              style={{
                maxWidth: 600,
                margin: "0 auto",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                lineHeight: 1.6,
                color: "#333",
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 8,
                  padding: 40,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: 30 }}>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: "#2563eb" }}>LiveStream Pro</div>
                </div>
                {getPreviewContent()}
              </div>
              <div style={{ textAlign: "center", color: "#666", fontSize: 12, marginTop: 30 }}>
                <p>© 2025 LiveStream Pro. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Variables */}
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">Available variables:</p>
          <div className="flex flex-wrap gap-2">
            {template.variables.map((variable) => (
              <Badge key={variable} variant="secondary">
                {`{{${variable}}}`}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
