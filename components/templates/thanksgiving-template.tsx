"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Leaf, Users, Send, Heart, MessageCircle, Volume2, Settings, Maximize, Home, ArrowLeft } from "lucide-react"

interface ThanksgivingTemplateProps {
  title: string
  description: string
}

export function ThanksgivingTemplate({ title, description }: ThanksgivingTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ hearts: 345, leaves: 567 })
  const [showChat, setShowChat] = useState(false)

  const mockChat = [
    { id: 1, user: "GratefulHeart", message: "Happy Thanksgiving!", time: "2:01 PM" },
    { id: 2, user: "FamilyTime", message: "So thankful for this!", time: "2:02 PM" },
    { id: 3, user: "PumpkinPie", message: "Love the decorations!", time: "2:03 PM" },
    { id: 4, user: "Harvest2024", message: "Grateful for family!", time: "2:04 PM" },
    { id: 5, user: "TurkeyDay", message: "Blessings to all!", time: "2:05 PM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-950 via-amber-950 to-orange-950 text-white">
      {/* Autumn harvest background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,146,60,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(180,83,9,0.2),transparent_50%)]" />
        {/* Falling leaves - fewer on mobile */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse hidden md:block"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          >
            <Leaf className="h-4 w-4 text-orange-500/30" />
          </div>
        ))}
      </div>

      {/* Autumn accent line */}
      <div className="fixed top-0 left-0 w-full h-1 md:h-2 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${showChat ? "hidden lg:flex" : "flex"}`}>
          {/* Header - responsive */}
          <header className="bg-orange-900/50 backdrop-blur-sm border-b border-amber-500/30 p-2 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Leaf className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base md:text-xl font-bold text-white truncate">{title}</h1>
                  <p className="text-amber-400 text-xs md:text-sm flex items-center gap-1">
                    <Home className="h-3 w-3" /> THANKSGIVING
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1 md:gap-2 bg-orange-800/50 border border-orange-500/30 rounded-full px-2 md:px-4 py-1 md:py-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-orange-200 text-xs md:text-sm font-medium">LIVE</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-amber-800/50 border border-amber-500/30 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-200 text-sm font-medium">567</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-amber-400 hover:bg-amber-500/20"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Video Player - responsive */}
          <div className="relative flex-1 bg-orange-900/30 m-2 md:m-4 rounded-lg overflow-hidden border border-amber-500/30">
            <div className="aspect-video bg-gradient-to-br from-orange-900 via-amber-950 to-orange-900 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="relative mb-3 md:mb-4">
                  <div className="flex items-center justify-center gap-1 md:gap-2">
                    <Leaf className="h-12 w-12 md:h-16 md:w-16 text-orange-500 -rotate-45" />
                    <Leaf className="h-16 w-16 md:h-20 md:w-20 text-amber-500" />
                    <Leaf className="h-12 w-12 md:h-16 md:w-16 text-orange-600 rotate-45" />
                  </div>
                </div>
                <h2 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2">{title}</h2>
                <p className="text-amber-400 text-sm">Template: Thanksgiving</p>
                <p className="text-orange-300 text-xs md:text-sm mt-1 md:mt-2">Give Thanks</p>
              </div>
            </div>

            {/* Gratitude banner - hidden on mobile */}
            <div className="hidden md:block absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              Happy Thanksgiving
            </div>

            {/* Controls - touch friendly */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-950 to-transparent p-2 md:p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-amber-400 hover:bg-amber-500/20 h-10 w-10"
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-amber-400 hover:bg-amber-500/20 h-10 w-10"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-amber-400 hover:bg-amber-500/20 h-10 w-10"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Reactions - responsive */}
          <div className="p-2 md:p-4 bg-orange-900/50 border-t border-amber-500/20">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-white truncate">{title}</h2>
                <p className="text-orange-300 mt-1 text-sm md:text-base">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-pink-500/50 text-pink-400 hover:bg-pink-500/20 bg-transparent h-10 min-w-[44px]"
                  onClick={() => setReactions((r) => ({ ...r, hearts: r.hearts + 1 }))}
                >
                  <Heart className="h-4 w-4 mr-1" /> {reactions.hearts}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20 bg-transparent h-10 min-w-[44px]"
                  onClick={() => setReactions((r) => ({ ...r, leaves: r.leaves + 1 }))}
                >
                  <Leaf className="h-4 w-4 mr-1" /> {reactions.leaves}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel - responsive with toggle */}
        <div
          className={`${showChat ? "flex" : "hidden"} lg:flex w-full lg:w-96 bg-orange-900/50 backdrop-blur-sm border-l border-amber-500/20 flex-col absolute lg:relative inset-0 lg:inset-auto top-0 z-20`}
        >
          <div className="p-3 md:p-4 border-b border-amber-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-amber-400" />
                Gratitude Wall
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-xs md:text-sm flex items-center gap-1">
                  <Users className="h-4 w-4" /> 567
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-amber-400"
                  onClick={() => setShowChat(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-3 md:p-4">
            <div className="space-y-3">
              {mockChat.map((chat) => (
                <div key={chat.id} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 min-w-0 bg-orange-800/50 rounded-lg p-2 border border-amber-500/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs md:text-sm text-amber-300 truncate">{chat.user}</span>
                      <span className="text-orange-400 text-xs shrink-0">{chat.time}</span>
                    </div>
                    <p className="text-orange-100 text-xs md:text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-amber-500/20">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share gratitude..."
                className="flex-1 bg-orange-900/50 border-amber-500/30 text-white placeholder:text-orange-400 focus:border-amber-500 h-10 text-sm"
              />
              <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white h-10 w-10 min-w-[44px]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
