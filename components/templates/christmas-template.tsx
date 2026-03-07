"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  TreePine,
  Users,
  Send,
  Heart,
  MessageCircle,
  Gift,
  Volume2,
  Settings,
  Maximize,
  Star,
  Snowflake,
  ArrowLeft,
} from "lucide-react"

interface ChristmasTemplateProps {
  title: string
  description: string
}

export function ChristmasTemplate({ title, description }: ChristmasTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ hearts: 567, stars: 890 })
  const [showChat, setShowChat] = useState(false)

  const mockChat = [
    { id: 1, user: "SantaFan", message: "Merry Christmas!", time: "12:01 PM" },
    { id: 2, user: "JingleBells", message: "Ho Ho Ho!", time: "12:02 PM" },
    { id: 3, user: "SnowAngel", message: "Beautiful decorations!", time: "12:03 PM" },
    { id: 4, user: "ReindeerLover", message: "Happy Holidays!", time: "12:04 PM" },
    { id: 5, user: "ChristmasJoy", message: "Season's Greetings!", time: "12:05 PM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-red-950 to-green-950 text-white">
      {/* Christmas background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(239,68,68,0.2),transparent_50%)]" />
        {/* Snowflakes - fewer on mobile */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse hidden md:block"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            <Snowflake className="h-3 w-3 text-white/30" />
          </div>
        ))}
      </div>

      {/* Red and green ribbon */}
      <div className="fixed top-0 left-0 w-full h-1 md:h-2 bg-gradient-to-r from-red-600 via-green-600 to-red-600" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${showChat ? "hidden lg:flex" : "flex"}`}>
          {/* Header - responsive */}
          <header className="bg-green-900/50 backdrop-blur-sm border-b border-red-500/30 p-2 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-600 to-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/30">
                  <TreePine className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base md:text-xl font-bold text-white truncate">{title}</h1>
                  <p className="text-red-400 text-xs md:text-sm flex items-center gap-1">
                    <Gift className="h-3 w-3" /> CHRISTMAS
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1 md:gap-2 bg-red-900/50 border border-red-500/30 rounded-full px-2 md:px-4 py-1 md:py-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-200 text-xs md:text-sm font-medium">LIVE</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-green-900/50 border border-green-500/30 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-green-400" />
                  <span className="text-green-200 text-sm font-medium">2,456</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-red-400 hover:bg-red-500/20"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Video Player - responsive */}
          <div className="relative flex-1 bg-green-900/30 m-2 md:m-4 rounded-lg md:rounded-xl overflow-hidden border border-red-500/30">
            <div className="aspect-video bg-gradient-to-br from-green-900 via-red-950 to-green-900 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="relative mb-3 md:mb-4">
                  <div className="relative">
                    <TreePine className="h-24 w-24 md:h-32 md:w-32 text-green-500 mx-auto" />
                    <Star className="absolute -top-1 md:-top-2 left-1/2 -translate-x-1/2 h-6 w-6 md:h-8 md:w-8 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="absolute top-10 md:top-12 left-1/2 -translate-x-6 md:-translate-x-8 w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full" />
                  <div className="absolute top-14 md:top-16 left-1/2 translate-x-3 md:translate-x-4 w-2 h-2 md:w-3 md:h-3 bg-yellow-500 rounded-full" />
                </div>
                <h2 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2">{title}</h2>
                <p className="text-red-400 text-sm">Template: Christmas</p>
                <p className="text-green-400 text-xs md:text-sm mt-1 md:mt-2">Merry Christmas!</p>
              </div>
            </div>

            {/* Holiday banner - hidden on mobile */}
            <div className="hidden md:block absolute top-4 left-4 bg-gradient-to-r from-red-600 to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              Happy Holidays
            </div>

            {/* Controls - touch friendly */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-950 to-transparent p-2 md:p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-red-400 hover:bg-red-500/20 h-10 w-10"
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-red-400 hover:bg-red-500/20 h-10 w-10"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-red-400 hover:bg-red-500/20 h-10 w-10"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Reactions - responsive */}
          <div className="p-2 md:p-4 bg-green-900/50 border-t border-red-500/20">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-white truncate">{title}</h2>
                <p className="text-green-300 mt-1 text-sm md:text-base">{description}</p>
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
          className={`${showChat ? "flex" : "hidden"} lg:flex w-full lg:w-96 bg-green-900/50 backdrop-blur-sm border-l border-red-500/20 flex-col absolute lg:relative inset-0 lg:inset-auto top-0 z-20`}
        >
          <div className="p-3 md:p-4 border-b border-red-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-red-400" />
                Holiday Chat
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-xs md:text-sm flex items-center gap-1">
                  <Users className="h-4 w-4" /> 2,456
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-red-400"
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
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 min-w-0 bg-green-800/50 rounded-lg p-2 border border-red-500/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs md:text-sm text-red-300 truncate">{chat.user}</span>
                      <span className="text-green-400 text-xs shrink-0">{chat.time}</span>
                    </div>
                    <p className="text-green-100 text-xs md:text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-red-500/20">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Holiday wishes..."
                className="flex-1 bg-green-900/50 border-red-500/30 text-white placeholder:text-green-400 focus:border-red-500 h-10 text-sm"
              />
              <Button className="bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 text-white h-10 w-10 min-w-[44px]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
