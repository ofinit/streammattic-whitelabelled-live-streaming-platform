"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Ghost, Users, Send, MessageCircle, Volume2, Settings, Maximize, Moon, Skull, ArrowLeft } from "lucide-react"

interface HalloweenTemplateProps {
  title: string
  description: string
}

export function HalloweenTemplate({ title, description }: HalloweenTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ skulls: 666, ghosts: 999 })
  const [showChat, setShowChat] = useState(false)

  const mockChat = [
    { id: 1, user: "SpookyGhost", message: "BOO! Happy Halloween!", time: "11:31 PM" },
    { id: 2, user: "WitchyVibes", message: "Love the costumes!", time: "11:32 PM" },
    { id: 3, user: "PumpkinKing", message: "Trick or treat!", time: "11:33 PM" },
    { id: 4, user: "NightCreature", message: "So spooky!", time: "11:34 PM" },
    { id: 5, user: "CandyCorn", message: "Best party ever!", time: "11:35 PM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white">
      {/* Spooky Halloween background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(147,51,234,0.2),transparent_50%)]" />
        {/* Floating spooky elements - hidden on mobile */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse opacity-20 hidden md:block"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            {i % 2 === 0 ? <Ghost className="h-6 w-6 text-white" /> : <Skull className="h-5 w-5 text-orange-500" />}
          </div>
        ))}
      </div>

      {/* Orange and purple ribbon */}
      <div className="fixed top-0 left-0 w-full h-1 md:h-2 bg-gradient-to-r from-orange-500 via-purple-600 to-orange-500" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${showChat ? "hidden lg:flex" : "flex"}`}>
          {/* Header - responsive */}
          <header className="bg-gray-900/50 backdrop-blur-sm border-b border-orange-500/30 p-2 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Ghost className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base md:text-xl font-bold text-white truncate">{title}</h1>
                  <p className="text-orange-400 text-xs md:text-sm flex items-center gap-1">
                    <Moon className="h-3 w-3" /> HALLOWEEN
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1 md:gap-2 bg-purple-900/50 border border-purple-500/30 rounded-full px-2 md:px-4 py-1 md:py-1.5">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-orange-200 text-xs md:text-sm font-medium">LIVE</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-gray-800/50 border border-orange-500/30 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-orange-400" />
                  <span className="text-orange-200 text-sm font-medium">1,313</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-orange-400 hover:bg-orange-500/20"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Video Player - responsive */}
          <div className="relative flex-1 bg-gray-900/50 m-2 md:m-4 rounded-lg overflow-hidden border border-purple-500/30">
            <div className="aspect-video bg-gradient-to-br from-gray-900 via-purple-950 to-gray-900 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="relative mb-3 md:mb-4">
                  <div className="relative">
                    <Ghost className="h-20 w-20 md:h-28 md:w-28 text-white mx-auto" />
                    <div className="absolute -bottom-1 md:-bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      <Skull className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                      <Skull className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
                      <Skull className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                    </div>
                  </div>
                </div>
                <h2 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2 mt-3 md:mt-4">{title}</h2>
                <p className="text-orange-400 text-sm">Template: Halloween</p>
                <p className="text-purple-400 text-xs md:text-sm mt-1 md:mt-2">Trick or Treat!</p>
              </div>
            </div>

            {/* Spooky banner - hidden on mobile */}
            <div className="hidden md:block absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              Happy Halloween
            </div>

            {/* Controls - touch friendly */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-950 to-transparent p-2 md:p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-orange-400 hover:bg-orange-500/20 h-10 w-10"
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-orange-400 hover:bg-orange-500/20 h-10 w-10"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-orange-400 hover:bg-orange-500/20 h-10 w-10"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Reactions - responsive */}
          <div className="p-2 md:p-4 bg-gray-900/50 border-t border-purple-500/20">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-white truncate">{title}</h2>
                <p className="text-gray-400 mt-1 text-sm md:text-base">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20 bg-transparent h-10 min-w-[44px]"
                  onClick={() => setReactions((r) => ({ ...r, skulls: r.skulls + 1 }))}
                >
                  <Skull className="h-4 w-4 mr-1" /> {reactions.skulls}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20 bg-transparent h-10 min-w-[44px]"
                  onClick={() => setReactions((r) => ({ ...r, ghosts: r.ghosts + 1 }))}
                >
                  <Ghost className="h-4 w-4 mr-1" /> {reactions.ghosts}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel - responsive with toggle */}
        <div
          className={`${showChat ? "flex" : "hidden"} lg:flex w-full lg:w-96 bg-gray-900/50 backdrop-blur-sm border-l border-purple-500/20 flex-col absolute lg:relative inset-0 lg:inset-auto top-0 z-20`}
        >
          <div className="p-3 md:p-4 border-b border-purple-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
                Spooky Chat
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-purple-400 text-xs md:text-sm flex items-center gap-1">
                  <Users className="h-4 w-4" /> 1,313
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-orange-400"
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
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 min-w-0 bg-purple-900/30 rounded-lg p-2 border border-orange-500/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs md:text-sm text-orange-300 truncate">{chat.user}</span>
                      <span className="text-purple-400 text-xs shrink-0">{chat.time}</span>
                    </div>
                    <p className="text-gray-300 text-xs md:text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-purple-500/20">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Spooky message..."
                className="flex-1 bg-gray-800/50 border-orange-500/30 text-white placeholder:text-gray-500 focus:border-orange-500 h-10 text-sm"
              />
              <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white h-10 w-10 min-w-[44px]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
