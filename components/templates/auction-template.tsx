"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Gavel,
  Users,
  Send,
  DollarSign,
  MessageCircle,
  Clock,
  Volume2,
  Settings,
  Maximize,
  TrendingUp,
  AlertCircle,
} from "lucide-react"

interface AuctionTemplateProps {
  title: string
  description: string
}

export function AuctionTemplate({ title, description }: AuctionTemplateProps) {
  const [message, setMessage] = useState("")
  const [currentBid, setCurrentBid] = useState(15750)

  const mockChat = [
    { id: 1, user: "Collector_A", message: "Bid: $15,000", time: "4:01 PM", isBid: true },
    { id: 2, user: "ArtLover99", message: "Beautiful piece!", time: "4:02 PM" },
    { id: 3, user: "BidKing", message: "Bid: $15,500", time: "4:03 PM", isBid: true },
    { id: 4, user: "Collector_A", message: "Bid: $15,750", time: "4:04 PM", isBid: true },
    { id: 5, user: "AuctionFan", message: "This is intense!", time: "4:05 PM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 text-white">
      {/* Elegant auction house background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(234,179,8,0.1),transparent_50%)]" />
      </div>

      {/* Gold accent line */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-yellow-500 to-emerald-500" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-slate-900/50 backdrop-blur-sm border-b border-emerald-500/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Gavel className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{title}</h1>
                  <p className="text-emerald-400 text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" /> LIVE AUCTION
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-red-900/50 border border-red-500/30 rounded-full px-4 py-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-200 text-sm font-medium">LIVE</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-800/50 border border-emerald-500/30 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-200 text-sm font-medium">892</span>
                </div>
              </div>
            </div>
          </header>

          {/* Video Player */}
          <div className="relative flex-1 bg-slate-900/50 m-4 rounded-2xl overflow-hidden border border-emerald-500/20">
            <div className="aspect-video bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-28 h-28 bg-gradient-to-br from-emerald-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
                  <Gavel className="h-14 w-14 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                <p className="text-emerald-400">Template: Live Auction</p>
              </div>
            </div>

            {/* Current bid display */}
            <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4 shadow-lg">
              <p className="text-yellow-400 text-xs font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> CURRENT BID
              </p>
              <p className="text-white font-bold text-2xl">${currentBid.toLocaleString()}</p>
              <p className="text-emerald-400 text-xs mt-1">12 bids</p>
            </div>

            {/* Time remaining */}
            <div className="absolute top-4 right-4 bg-red-900/90 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 shadow-lg">
              <p className="text-red-400 text-xs font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> TIME LEFT
              </p>
              <p className="text-white font-bold text-2xl font-mono">02:34</p>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-emerald-400 hover:bg-emerald-500/20"
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-emerald-400 hover:bg-emerald-500/20"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-emerald-400 hover:bg-emerald-500/20"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Bid controls */}
          <div className="p-4 bg-slate-900/50 border-t border-emerald-500/20">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <p className="text-slate-400 mt-1">{description}</p>
              </div>
              <Button
                className="bg-gradient-to-r from-emerald-500 to-yellow-500 hover:from-emerald-600 hover:to-yellow-600 text-white font-bold px-8 py-6 text-lg"
                onClick={() => setCurrentBid((b) => b + 250)}
              >
                <DollarSign className="h-5 w-5 mr-1" /> Place Bid
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-full lg:w-96 bg-slate-900/50 backdrop-blur-sm border-l border-emerald-500/20 flex flex-col">
          <div className="p-4 border-b border-emerald-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-emerald-400" />
                Bid History
              </h3>
              <span className="text-emerald-400 text-sm flex items-center gap-1">
                <Users className="h-4 w-4" /> 892
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {mockChat.map((chat) => (
                <div key={chat.id} className="flex items-start gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${chat.isBid ? "bg-gradient-to-br from-yellow-500 to-emerald-500" : "bg-gradient-to-br from-slate-600 to-slate-700"}`}
                  >
                    {chat.user[0]}
                  </div>
                  <div
                    className={`flex-1 rounded-lg p-2 border ${chat.isBid ? "bg-emerald-900/50 border-yellow-500/30" : "bg-slate-800/50 border-slate-700/30"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold text-sm ${chat.isBid ? "text-yellow-300" : "text-slate-300"}`}>
                        {chat.user}
                      </span>
                      <span className="text-slate-500 text-xs">{chat.time}</span>
                    </div>
                    <p className={`text-sm ${chat.isBid ? "text-emerald-300 font-bold" : "text-slate-300"}`}>
                      {chat.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-emerald-500/20">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send a message..."
                className="flex-1 bg-slate-800/50 border-emerald-500/30 text-white placeholder:text-slate-500 focus:border-emerald-500"
              />
              <Button className="bg-gradient-to-r from-emerald-500 to-yellow-500 hover:from-emerald-600 hover:to-yellow-600 text-white">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
