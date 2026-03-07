"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Facebook, Check, Shield, Radio, BarChart3 } from "lucide-react"

interface ConnectFacebookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (data: {
    pageId: string
    pageName: string
    pageThumbnail: string
    accessToken: string
  }) => void
}

export function ConnectFacebookDialog({ open, onOpenChange, onSuccess }: ConnectFacebookDialogProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [step, setStep] = useState<"info" | "connecting" | "success">("info")

  const handleConnect = async () => {
    setIsConnecting(true)
    setStep("connecting")

    // Simulate OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock successful connection
    const mockPageData = {
      pageId: `fb-${Date.now()}`,
      pageName: "My Facebook Page",
      pageThumbnail: "/generic-social-media-page.png",
      accessToken: `mock-fb-token-${Date.now()}`,
    }

    setStep("success")
    setTimeout(() => {
      onSuccess(mockPageData)
      onOpenChange(false)
      setStep("info")
      setIsConnecting(false)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-[#1877F2]" />
            Connect Facebook Page
          </DialogTitle>
          <DialogDescription>Connect your Facebook Page to stream directly from StreamMattic</DialogDescription>
        </DialogHeader>

        {step === "info" && (
          <div className="space-y-4">
            <Card className="border-[#1877F2]/20 bg-[#1877F2]/5">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-medium text-sm">Permissions Required</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Radio className="h-4 w-4 mt-0.5 text-[#1877F2]" />
                    <span>Create and manage live videos on your Page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <BarChart3 className="h-4 w-4 mt-0.5 text-[#1877F2]" />
                    <span>Access live video insights and analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="h-4 w-4 mt-0.5 text-[#1877F2]" />
                    <span>Read your Page's basic information</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Button className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90" onClick={handleConnect}>
              <Facebook className="h-4 w-4 mr-2" />
              Continue with Facebook
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              You can disconnect your Page at any time from Settings
            </p>
          </div>
        )}

        {step === "connecting" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#1877F2]/10 flex items-center justify-center mx-auto animate-pulse">
              <Facebook className="h-8 w-8 text-[#1877F2]" />
            </div>
            <div>
              <p className="font-medium">Connecting to Facebook...</p>
              <p className="text-sm text-muted-foreground">Please complete the authorization in the popup window</p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium">Facebook Page Connected!</p>
              <p className="text-sm text-muted-foreground">You can now stream to your Facebook Page</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
