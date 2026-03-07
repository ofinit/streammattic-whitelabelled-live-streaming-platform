"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Rocket,
  Users,
  Send,
  ThumbsUp,
  MessageCircle,
  Sparkles,
  Volume2,
  Settings,
  Maximize,
  Zap,
  ArrowLeft,
} from "lucide-react"

interface ProductLaunchTemplateProps {
  title: string
  description: string
}

export function ProductLaunchTemplate({ title, description }: ProductLaunchTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ rockets: 1567, likes: 2890 })
  const [showChat, setShowChat] = useState(false)

  const mockChat = [
    { id: 1, user: "TechEnthusiast", message: "Can't wait to try this!", time: "2:01 PM" },
    { id: 2, user: "EarlyAdopter", message: "Day one purchase!", time: "2:02 PM" },
    { id: 3, user: "ProductHunter", message: "This looks amazing!", time: "2:03 PM" },
    { id: 4, user: "StartupFan", message: "Great innovation!", time: "2:04 PM" },
    { id: 5, user: "BetaTester", message: "Finally launching!", time: "2:05 PM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Futuristic grid background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Accent line */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content - responsive with chat toggle */}
        <div className={`flex-1 flex flex-col ${showChat ? "hidden lg:flex" : "flex"}`}>
          {/* Header - responsive */}
          <header className="bg-slate-900/50 backdrop-blur-sm border-b border-indigo-500/30 p-2 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Rocket className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base md:text-xl font-bold text-white truncate">{title}</h1>
                  <p className="text-indigo-400 text-xs md:text-sm flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> PRODUCT LAUNCH
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1 md:gap-2 bg-red-900/50 border border-red-500/30 rounded-full px-2 md:px-4 py-1 md:py-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-200 text-xs md:text-sm font-medium">LIVE</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-indigo-900/50 border border-indigo-500/30 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-indigo-400" />
                  <span className="text-indigo-200 text-sm font-medium">45.8K</span>
                </div>
                {/* Mobile chat toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-indigo-400 hover:bg-indigo-500/20"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Video Player - responsive */}
          <div className="relative flex-1 bg-slate-900/50 m-2 md:m-4 rounded-xl md:rounded-2xl overflow-hidden border border-indigo-500/30">
            <div className="aspect-video bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="relative mb-3 md:mb-4">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/40">
                    <Rocket className="h-12 w-12 md:h-16 md:w-16 text-white" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 md:-top-4 md:-right-4 h-6 w-6 md:h-10 md:w-10 text-yellow-400 animate-pulse" />
                </div>
                <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">{title}</h2>
                <p className="text-indigo-400 text-sm">Template: Product Launch</p>
                <p className="text-purple-400 text-xs md:text-sm mt-1 md:mt-2 flex items-center justify-center gap-2">
                  <Zap className="h-4 w-4" /> Launching Today
                </p>
              </div>
            </div>

            {/* Launch badge - hidden on mobile */}
            <div className="hidden md:flex absolute top-4 left-4 items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              <Rocket className="h-4 w-4" /> Launch Event
            </div>

            {/* Controls - touch friendly */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-transparent p-2 md:p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-indigo-400 hover:bg-indigo-500/20 h-10 w-10"
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-indigo-400 hover:bg-indigo-500/20 h-10 w-10"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-indigo-400 hover:bg-indigo-500/20 h-10 w-10"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Reactions - responsive */}
          <div className="p-2 md:p-4 bg-slate-900/50 border-t border-indigo-500/20">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-white truncate">{title}</h2>
                <p className="text-slate-400 mt-1 text-sm md:text-base">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/20 bg-transparent h-10 min-w-[44px]"
                  onClick={() => setReactions((r) => ({ ...r, rockets: r.rockets + 1 }))}
                >
                  <Rocket className="h-4 w-4 mr-1" /> {reactions.rockets}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20 bg-transparent h-10 min-w-[44px]"
                  onClick={() => setReactions((r) => ({ ...r, likes: r.likes + 1 }))}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" /> {reactions.likes}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel - responsive with toggle */}
        <div
          className={`${showChat ? "flex" : "hidden"} lg:flex w-full lg:w-96 bg-slate-900/50 backdrop-blur-sm border-l border-indigo-500/20 flex-col absolute lg:relative inset-0 lg:inset-auto top-0 z-20`}
        >
          <div className="p-3 md:p-4 border-b border-indigo-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-indigo-400" />
                Launch Chat
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 text-xs md:text-sm flex items-center gap-1">
                  <Users className="h-4 w-4" /> 45.8K
                </span>
                {/* Mobile back button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-indigo-400"
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
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 min-w-0 bg-indigo-900/30 rounded-xl p-2 border border-indigo-500/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs md:text-sm text-indigo-300 truncate">{chat.user}</span>
                      <span className="text-slate-500 text-xs shrink-0">{chat.time}</span>
                    </div>
                    <p className="text-slate-300 text-xs md:text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-indigo-500/20">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share excitement..."
                className="flex-1 bg-slate-800/50 border-indigo-500/30 text-white placeholder:text-slate-500 focus:border-indigo-500 h-10 text-sm rounded-xl"
              />
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl h-10 w-10 min-w-[44px]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
