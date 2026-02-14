"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Gamepad2,
  Users,
  Send,
  Heart,
  ThumbsUp,
  Zap,
  Trophy,
  Swords,
  Target,
  Volume2,
  Settings,
  Maximize,
  MessageCircle,
  ArrowLeft,
} from "lucide-react"

interface GamingTemplateProps {
  title: string
  description: string
}

export function GamingTemplate({ title, description }: GamingTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ hearts: 89, likes: 234, zaps: 156 })
  const [showChat, setShowChat] = useState(false)

  const mockChat = [
    { id: 1, user: "ProGamer99", message: "GG!", color: "text-green-400", badge: "VIP" },
    { id: 2, user: "NinjaX", message: "That play was insane!", color: "text-cyan-400" },
    { id: 3, user: "StreamFan", message: "Let's gooo!", color: "text-purple-400" },
    { id: 4, user: "EpicPlayer", message: "Clutch moment!", color: "text-pink-400", badge: "Sub" },
    { id: 5, user: "GameMaster", message: "POG!", color: "text-yellow-400" },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Neon glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      {/* Neon top bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-cyan-500 to-purple-500" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content - responsive with chat toggle */}
        <div className={`flex-1 flex flex-col ${showChat ? "hidden lg:flex" : "flex"}`}>
          {/* Header - responsive */}
          <header className="bg-gray-900/80 backdrop-blur-sm border-b border-green-500/30 p-2 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Gamepad2 className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base md:text-xl font-bold text-white truncate">{title}</h1>
                  <p className="text-green-400 text-xs md:text-sm flex items-center gap-1">
                    <Swords className="h-3 w-3" /> GAMING
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1 md:gap-2 bg-red-900/50 border border-red-500/50 rounded-full px-2 md:px-4 py-1 md:py-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-200 text-xs md:text-sm font-medium">LIVE</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-gray-800 border border-green-500/30 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-green-400" />
                  <span className="text-green-200 text-sm font-medium">12.5K</span>
                </div>
                {/* Mobile chat toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-green-400 hover:bg-green-500/20"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Video Player - responsive */}
          <div className="relative flex-1 bg-black m-2 md:m-4 rounded-lg overflow-hidden border border-green-500/30">
            <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-950 to-black flex items-center justify-center p-4">
              <div className="text-center">
                <div className="relative mb-3 md:mb-4">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-green-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30 rotate-3">
                    <Gamepad2 className="h-12 w-12 md:h-16 md:w-16 text-white -rotate-3" />
                  </div>
                  <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-8 h-8 md:w-12 md:h-12 bg-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50 animate-pulse">
                    <Target className="h-4 w-4 md:h-6 md:w-6 text-white" />
                  </div>
                </div>
                <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">{title}</h2>
                <p className="text-green-400 text-sm">Template: Gaming/Esports</p>
                <p className="text-cyan-400 text-xs md:text-sm mt-1 md:mt-2 flex items-center justify-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-400" /> Tournament Mode
                </p>
              </div>
            </div>

            {/* Game HUD overlay - hidden on mobile */}
            <div className="hidden md:flex absolute top-4 left-4 items-center gap-2 bg-black/80 border border-green-500/50 rounded-lg px-3 py-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span className="text-green-400 text-sm font-mono">RANK #1</span>
            </div>

            {/* Controls - touch friendly */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 md:p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-green-400 hover:bg-green-500/20 h-10 w-10"
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-green-400 hover:bg-green-500/20 h-10 w-10"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-green-400 hover:bg-green-500/20 h-10 w-10"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Reactions - responsive */}
          <div className="p-2 md:p-4 bg-gray-900/80 border-t border-green-500/20">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-white truncate">{title}</h2>
                <p className="text-gray-400 mt-1 text-sm md:text-base">{description}</p>
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
                  className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 bg-transparent h-10 min-w-[44px]"
                  onClick={() => setReactions((r) => ({ ...r, likes: r.likes + 1 }))}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" /> {reactions.likes}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 bg-transparent h-10 min-w-[44px]"
                  onClick={() => setReactions((r) => ({ ...r, zaps: r.zaps + 1 }))}
                >
                  <Zap className="h-4 w-4 mr-1" /> {reactions.zaps}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel - responsive with toggle */}
        <div
          className={`${showChat ? "flex" : "hidden"} lg:flex w-full lg:w-96 bg-gray-900/90 backdrop-blur-sm border-l border-green-500/30 flex-col absolute lg:relative inset-0 lg:inset-auto top-0 z-20`}
        >
          <div className="p-3 md:p-4 border-b border-green-500/20 bg-gray-900">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-green-400" />
                Game Chat
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-xs md:text-sm flex items-center gap-1">
                  <Users className="h-4 w-4" /> 12.5K
                </span>
                {/* Mobile back button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-green-400"
                  onClick={() => setShowChat(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-3 md:p-4">
            <div className="space-y-2 md:space-y-3">
              {mockChat.map((chat) => (
                <div key={chat.id} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-xs md:text-sm ${chat.color} truncate`}>{chat.user}</span>
                      {chat.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/30 text-purple-300 rounded">
                          {chat.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 text-xs md:text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-green-500/20 bg-gray-900">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send a message..."
                className="flex-1 bg-gray-800 border-green-500/30 text-white placeholder:text-gray-500 focus:border-green-500 h-10 text-sm"
              />
              <Button className="bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white h-10 w-10 min-w-[44px]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
