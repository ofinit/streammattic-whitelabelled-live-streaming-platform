"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Play, Calendar, Video, MessageSquare, Check, Info, Package } from "lucide-react"
import { useRouter } from "next/navigation"
import { DemoStreamTypeSelector } from "@/components/events/demo-stream-type-selector"
import { demoUserStates } from "@/lib/demo-user-states"
import type { StreamTypeKey } from "@/lib/types"

export default function DemoNoPackagePage() {
  const router = useRouter()
  const demoState = demoUserStates.noCredits
  const [selectedType, setSelectedType] = useState<StreamTypeKey | "">("")

  const steps = [
    { id: 0, name: "Type", icon: Play },
    { id: 1, name: "Details", icon: Calendar },
    { id: 2, name: "Template", icon: Video },
    { id: 3, name: "Settings", icon: MessageSquare },
    { id: 4, name: "Review", icon: Check },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Event</h1>
              <p className="mt-1 text-muted-foreground">Set up your live streaming event in a few steps</p>
            </div>
            <Button variant="ghost" onClick={() => router.push("/streamer/control-center")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      index === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <step.icon className="h-4 w-4" />
                  </div>
                  <p
                    className={`hidden text-xs font-medium sm:block ${index === 0 ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {step.name}
                  </p>
                </div>
                {index < steps.length - 1 && <div className="mx-2 h-0.5 w-8 shrink-0 sm:mx-3 sm:w-12 bg-border" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Demo Banner */}
        <Alert className="mb-6 bg-blue-500/10 border-blue-500/20">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-600 dark:text-blue-400">
            Visualization Mode: {demoState.scenario}
          </AlertDescription>
        </Alert>

        {/* No Credits Info */}
        <Alert className="mb-6 bg-orange-500/10 border-orange-500/20">
          <Package className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-600 dark:text-orange-400">
            You have no stream credits yet. Purchase credits to get started or pay per event from your wallet.
          </AlertDescription>
        </Alert>

        {/* Wallet Display */}
        <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div>
            <p className="text-sm text-muted-foreground">Wallet Balance</p>
            <p className="text-2xl font-bold text-foreground">₹{demoState.walletBalance.toLocaleString()}</p>
          </div>
          <Button variant="outline">Recharge Wallet</Button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Choose Event Type</h2>
            <p className="mt-1 text-muted-foreground">Select how you want to stream your event</p>
          </div>

          <DemoStreamTypeSelector
            value={selectedType}
            onChange={setSelectedType}
            availableEvents={0}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" onClick={() => router.push("/streamer/control-center")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push("/streamer/packages")}>
                <Package className="mr-2 h-4 w-4" />
                Buy Credits
              </Button>
              <Button disabled>Pay Per Event (Demo mode)</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
