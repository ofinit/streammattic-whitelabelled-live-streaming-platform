"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, User, Building2, Shield } from "lucide-react"

interface CascadeFlowProps {
  packageName: string
  streamerPrice: number
  studioCost: number
  userName?: string
  studioName?: string
}

export function CascadeFlow({
  packageName,
  streamerPrice,
  studioCost,
  userName = "Streamer",
  studioName = "Studio",
}: CascadeFlowProps) {
  const studioProfit = streamerPrice - studioCost
  const adminRevenue = studioCost

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Revenue Flow</CardTitle>
        <p className="text-sm text-muted-foreground">
          How money flows when {userName} purchases {packageName}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-2">
          {/* User Level */}
          <div className="w-full max-w-sm">
            <div className="flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                  <User className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground">End User</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-500">-{"₹"}{(streamerPrice / 100).toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground">Pays full price</p>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center py-1">
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
            <Badge variant="outline" className="mt-1 text-xs">
              {"₹"}{((streamerPrice - studioCost) / 100).toLocaleString("en-IN")} profit
            </Badge>
          </div>

          {/* Studio Level */}
          <div className="w-full max-w-sm">
            <div className="flex items-center justify-between rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                  <Building2 className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{studioName}</p>
                  <p className="text-xs text-muted-foreground">Studio</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-500">-{"₹"}{(studioCost / 100).toLocaleString("en-IN")}</p>
                <p className="text-xs text-emerald-500">+{"₹"}{(studioProfit / 100).toLocaleString("en-IN")} margin</p>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center py-1">
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Admin Level */}
          <div className="w-full max-w-sm">
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                  <Shield className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Platform Admin</p>
                  <p className="text-xs text-muted-foreground">Admin</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-emerald-500">+{"₹"}{(adminRevenue / 100).toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 rounded-lg bg-muted/50 p-4">
          <p className="text-sm font-medium text-foreground">Transaction Summary</p>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User Paid</span>
              <span className="font-medium">{"₹"}{(streamerPrice / 100).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Studio Profit</span>
              <span className="font-medium text-emerald-500">{"₹"}{(studioProfit / 100).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Admin Revenue</span>
              <span className="font-medium text-emerald-500">{"₹"}{(adminRevenue / 100).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
