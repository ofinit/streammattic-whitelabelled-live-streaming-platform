"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Flame,
  Users,
  Send,
  Heart,
  MessageCircle,
  Sparkles,
  Volume2,
  Settings,
  Maximize,
  Star,
  ArrowLeft,
} from "lucide-react"

interface ChineseFestivalTemplateProps {
  title: string
  description: string
}

export function ChineseFestivalTemplate({ title, description }: ChineseFestivalTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ hearts: 888, stars: 666 })
  const [showChat, setShowChat] = useState(false)

  const mockChat = [
    { id: 1, user: "Dragon88", message: "Happy New Year!", time: "8:08 PM" },
    { id: 2, user: "LuckyRed", message: "Gong Xi Fa Cai!", time: "8:09 PM" },
    { id: 3, user: "MoonFest", message: "Beautiful lanterns!", time: "8:10 PM" },
    { id: 4, user: "JadeEmpire", message: "Prosperity to all!", time: "8:11 PM" },
    { id: 5, user: "GoldenDragon", message: "Amazing celebration!", time: "8:12 PM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-red-950 text-white">
      {/* Traditional Chinese background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(234,179,8,0.2),transparent_50%)]" />
      </div>

      {/* Gold and red ribbon */}
      <div className="fixed top-0 left-0 w-full h-1 md:h-2 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${showChat ? "hidden lg:flex" : "flex"}`}>
          {/* Header - responsive */}
          <header className="bg-red-900/50 backdrop-blur-sm border-b border-yellow-500/30 p-2 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-red-600 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/30 border-2 border-yellow-500">
                  <Flame className="h-5 w-5 md:h-6 md:w-6 text-yellow-300" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base md:text-xl font-bold text-white truncate">{title}</h1>
                  <p className="text-yellow-400 text-xs md:text-sm flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> FESTIVAL
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1 md:gap-2 bg-red-800/50 border border-red-500/30 rounded-full px-2 md:px-4 py-1 md:py-1.5">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                  <span className="text-yellow-200 text-xs md:text-sm font-medium">LIVE</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-red-800/50 border border-yellow-500/30 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-200 text-sm font-medium">8,888</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-yellow-400 hover:bg-yellow-500/20"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Video Player - responsive */}
          <div className="relative flex-1 bg-red-900/30 m-2 md:m-4 rounded-lg overflow-hidden border-2 border-yellow-500/40">
            <div className="aspect-video bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="relative mb-3 md:mb-4">
                  <div className="w-24 h-28 md:w-32 md:h-40 bg-gradient-to-b from-red-600 to-red-700 rounded-xl flex items-center justify-center mx-auto shadow-2xl border-2 md:border-4 border-yellow-500 relative">
                    <span className="text-2xl md:text-4xl font-bold text-yellow-400">福</span>
                    <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 w-12 md:w-16 h-3 md:h-4 bg-yellow-500 rounded-t-lg" />
                    <div className="absolute -bottom-6 md:-bottom-8 left-1/2 -translate-x-1/2 w-1 h-6 md:h-8 bg-yellow-500" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-4 md:-top-4 md:-right-8 h-6 w-6 md:h-10 md:w-10 text-yellow-400 animate-pulse" />
                </div>
                <h2 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2 mt-8 md:mt-12">{title}</h2>
                <p className="text-yellow-400 text-sm">Template: Chinese Festival</p>
              </div>
            </div>

            {/* Fortune banner - hidden on mobile */}
            <div className="hidden md:block absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-red-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              Gong Xi Fa Cai
            </div>

            {/* Controls - touch friendly */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-950 to-transparent p-2 md:p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-yellow-400 hover:bg-yellow-500/20 h-10 w-10"
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-yellow-400 hover:bg-yellow-500/20 h-10 w-10"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-yellow-400 hover:bg-yellow-500/20 h-10 w-10"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Reactions - responsive */}
          <div className="p-2 md:p-4 bg-red-900/50 border-t border-yellow-500/20">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-white truncate">{title}</h2>
                <p className="text-red-300 mt-1 text-sm md:text-base">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/20 bg-transparent h-10 min-w-[44px]"
                  onClick={() => setReactions((r) => ({ ...r, hearts: r.hearts + 1 }))}
                >
                  <Heart className="h-4 w-4 mr-1" /> {reactions.hearts}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 bg-transparent h-10 min-w-[44px]"
                  onClick={() => setReactions((r) => ({ ...r, stars: r.stars + 1 }))}
                >
                  <Star className="h-4 w-4 mr-1" /> {reactions.stars}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel - responsive with toggle */}
        <div
          className={`${showChat ? "flex" : "hidden"} lg:flex w-full lg:w-96 bg-red-900/50 backdrop-blur-sm border-l border-yellow-500/20 flex-col absolute lg:relative inset-0 lg:inset-auto top-0 z-20`}
        >
          <div className="p-3 md:p-4 border-b border-yellow-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
                Festival Chat
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-xs md:text-sm flex items-center gap-1">
                  <Users className="h-4 w-4" /> 8,888
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-yellow-400"
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
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-yellow-500 flex items-center justify-center text-white text-xs font-bold border border-yellow-500 shrink-0">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 min-w-0 bg-red-800/50 rounded-lg p-2 border border-yellow-500/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs md:text-sm text-yellow-300 truncate">{chat.user}</span>
                      <span className="text-red-400 text-xs shrink-0">{chat.time}</span>
                    </div>
                    <p className="text-red-100 text-xs md:text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-yellow-500/20">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send blessings..."
                className="flex-1 bg-red-900/50 border-yellow-500/30 text-white placeholder:text-red-400 focus:border-yellow-500 h-10 text-sm"
              />
              <Button className="bg-gradient-to-r from-red-600 to-yellow-500 hover:from-red-700 hover:to-yellow-600 text-white h-10 w-10 min-w-[44px]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
