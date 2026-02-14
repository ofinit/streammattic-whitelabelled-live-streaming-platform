"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Gem, Users, Send, Heart, MessageCircle, Sparkles, Volume2, Settings, Maximize, ArrowLeft } from "lucide-react"

interface EngagementTemplateProps {
  title: string
  description: string
}

export function EngagementTemplate({ title, description }: EngagementTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ hearts: 456, rings: 234 })
  const [showChat, setShowChat] = useState(false)

  const mockChat = [
    { id: 1, user: "BestFriend", message: "OMG Congratulations!", time: "7:01 PM" },
    { id: 2, user: "MomLove", message: "My babies! So happy!", time: "7:02 PM" },
    { id: 3, user: "CollegeBuddy", message: "Finally! About time!", time: "7:03 PM" },
    { id: 4, user: "SisterDear", message: "I knew it was coming!", time: "7:04 PM" },
    { id: 5, user: "CousinTom", message: "Welcome to the family!", time: "7:05 PM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-pink-950 to-purple-950 text-white">
      {/* Romantic sparkling background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.2),transparent_50%)]" />
        {/* Sparkles - fewer on mobile */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse hidden md:block"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Silver/diamond accent line */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-pink-300 to-purple-400" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${showChat ? "hidden lg:flex" : "flex"}`}>
          {/* Header - responsive */}
          <header className="bg-purple-900/30 backdrop-blur-sm border-b border-pink-500/20 p-2 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30">
                  <Gem className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base md:text-xl font-bold text-white truncate">{title}</h1>
                  <p className="text-pink-400 text-xs md:text-sm flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> SHE SAID YES!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1 md:gap-2 bg-pink-900/50 border border-pink-500/30 rounded-full px-2 md:px-4 py-1 md:py-1.5">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <span className="text-pink-200 text-xs md:text-sm font-medium">LIVE</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-purple-900/50 border border-purple-500/30 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-200 text-sm font-medium">156</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-pink-400 hover:bg-pink-500/20"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Video Player - responsive */}
          <div className="relative flex-1 bg-purple-900/20 m-2 md:m-4 rounded-xl md:rounded-2xl overflow-hidden border border-pink-500/30">
            <div className="aspect-video bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="relative mb-3 md:mb-4">
                  <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-pink-500/40">
                    <Gem className="h-10 w-10 md:h-14 md:w-14 text-white" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 md:-top-4 md:-right-4 h-6 w-6 md:h-10 md:w-10 text-pink-300 animate-pulse" />
                </div>
                <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">{title}</h2>
                <p className="text-pink-400 text-sm">Template: Engagement</p>
                <div className="flex items-center justify-center gap-2 mt-3 md:mt-4">
                  <Heart className="h-4 w-4 md:h-5 md:w-5 text-pink-400 fill-pink-400" />
                  <span className="text-pink-300 text-sm">Together Forever</span>
                  <Heart className="h-4 w-4 md:h-5 md:w-5 text-pink-400 fill-pink-400" />
                </div>
              </div>
            </div>

            {/* Celebration banner - hidden on mobile */}
            <div className="hidden md:block absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              Engaged!
            </div>

            {/* Controls - touch friendly */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-950 to-transparent p-2 md:p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-pink-400 hover:bg-pink-500/20 h-10 w-10"
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-pink-400 hover:bg-pink-500/20 h-10 w-10"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-pink-400 hover:bg-pink-500/20 h-10 w-10"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Reactions - responsive */}
          <div className="p-2 md:p-4 bg-purple-900/30 border-t border-pink-500/20">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-white truncate">{title}</h2>
                <p className="text-purple-300 mt-1 text-sm md:text-base">{description}</p>
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
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20 bg-transparent h-10 min-w-[44px]"
                  onClick={() => setReactions((r) => ({ ...r, rings: r.rings + 1 }))}
                >
                  <Gem className="h-4 w-4 mr-1" /> {reactions.rings}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel - responsive with toggle */}
        <div
          className={`${showChat ? "flex" : "hidden"} lg:flex w-full lg:w-96 bg-purple-900/30 backdrop-blur-sm border-l border-pink-500/20 flex-col absolute lg:relative inset-0 lg:inset-auto top-0 z-20`}
        >
          <div className="p-3 md:p-4 border-b border-pink-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-pink-400" />
                Love Messages
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-purple-400 text-xs md:text-sm flex items-center gap-1">
                  <Users className="h-4 w-4" /> 156
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-pink-400"
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 min-w-0 bg-pink-900/30 rounded-xl p-2 border border-pink-500/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs md:text-sm text-pink-300 truncate">{chat.user}</span>
                      <span className="text-purple-400 text-xs shrink-0">{chat.time}</span>
                    </div>
                    <p className="text-purple-100 text-xs md:text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-pink-500/20">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send love..."
                className="flex-1 bg-purple-900/50 border-pink-500/30 text-white placeholder:text-purple-400 focus:border-pink-500 rounded-full h-10 text-sm"
              />
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full h-10 w-10 min-w-[44px]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
