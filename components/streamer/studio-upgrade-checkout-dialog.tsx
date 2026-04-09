"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { STUDIO_UPGRADE_CHECKOUT_DIALOG_DESCRIPTION } from "@/lib/studio-upgrade-copy"
import {
  StudioUpgradePaymentPanel,
  type StudioUpgradePayGateway,
} from "@/components/streamer/studio-upgrade-payment-panel"

export type StudioUpgradeCheckoutDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-tax subscription amount in paise (must match server `studio_annual_subscription`) */
  pricePaisa: number
  walletBalancePaise: number
  onPaidSuccess?: () => void
}

export function StudioUpgradeCheckoutDialog({
  open,
  onOpenChange,
  pricePaisa,
  walletBalancePaise,
  onPaidSuccess,
}: StudioUpgradeCheckoutDialogProps) {
  const [gateway, setGateway] = useState<StudioUpgradePayGateway>("wallet")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to Studio</DialogTitle>
          <DialogDescription>{STUDIO_UPGRADE_CHECKOUT_DIALOG_DESCRIPTION}</DialogDescription>
        </DialogHeader>

        <div className="py-2 max-h-[70vh] overflow-y-auto">
          <StudioUpgradePaymentPanel
            pricePaisa={pricePaisa}
            walletBalancePaise={walletBalancePaise}
            selectedGateway={open ? gateway : "wallet"}
            onSelectedGatewayChange={setGateway}
            showActions
            onCancel={() => onOpenChange(false)}
            onPaidSuccess={() => {
              onOpenChange(false)
              onPaidSuccess?.()
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
