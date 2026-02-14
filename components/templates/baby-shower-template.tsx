"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Baby,
  Users,
  Send,
  Heart,
  MessageCircle,
  Star,
  Volume2,
  Settings,
  Maximize,
  Gift,
  ArrowLeft,
} from "lucide-react"

interface BabyShowerTemplateProps {
  title: string
  description: string
}

export function BabyShowerTemplate({ title, description }: BabyShowerTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ hearts: 189, stars: 234 })
  const [showChat, setShowChat] = useState(false)

  const mockChat = [
    { id: 1, user: "AuntSarah", message: "So excited for the baby!", time: "2:01 PM" },
    { id: 2, user: "BestFriend", message: "Congratulations!", time: "2:02 PM" },
    { id: 3, user: "GrandmaRose", message: "Sending love from afar!", time: "2:03 PM" },
    { id: 4, user: "CousinMike", message: "Can't wait to meet the little one!", time: "2:04 PM" },
    { id: 5, user: "WorkFriend", message: "Beautiful celebration!", time: "2:05 PM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-pink-50 text-slate-800">
      {/* Soft pastel background with floating elements */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(244,114,182,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(147,197,253,0.2),transparent_50%)]" />
        {/* Floating circles - fewer on mobile */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-30 animate-pulse hidden md:block"
            style={{
              width: `${20 + Math.random() * 40}px`,
              height: `${20 + Math.random() * 40}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: i % 2 === 0 ? "#f9a8d4" : "#93c5fd",
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Pastel ribbon */}
      <div className="fixed top-0 left-0 w-full h-1 md:h-2 bg-gradient-to-r from-pink-300 via-blue-300 to-pink-300" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${showChat ? "hidden lg:flex" : "flex"}`}>
          {/* Header - responsive */}
          <header className="bg-white/70 backdrop-blur-sm border-b border-pink-200 p-2 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-pink-400 to-blue-400 rounded-full flex items-center justify-center shadow-lg shadow-pink-300/30">
                  <Baby className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base md:text-xl font-bold text-slate-800 truncate">{title}</h1>
                  <p className="text-pink-500 text-xs md:text-sm flex items-center gap-1">
                    <Gift className="h-3 w-3" /> BABY SHOWER
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1 md:gap-2 bg-pink-100 border border-pink-200 rounded-full px-2 md:px-4 py-1 md:py-1.5">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <span className="text-pink-600 text-xs md:text-sm font-medium">LIVE</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-blue-100 border border-blue-200 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-blue-600 text-sm font-medium">87</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-pink-500"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Video Player - responsive */}
          <div className="relative flex-1 bg-white/70 m-2 md:m-4 rounded-xl md:rounded-3xl overflow-hidden border-2 border-pink-200 shadow-xl">
            <div className="aspect-video bg-gradient-to-br from-pink-100 via-white to-blue-100 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="relative mb-3 md:mb-4">
                  <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-pink-400 to-blue-400 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                    <Baby className="h-10 w-10 md:h-14 md:w-14 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-8 h-8 md:w-10 md:h-10 bg-yellow-300 rounded-full flex items-center justify-center">
                    <Star className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
                  </div>
                </div>
                <h2 className="text-lg md:text-2xl font-bold text-slate-700 mb-1 md:mb-2">{title}</h2>
                <p className="text-pink-500 text-sm">Template: Baby Shower</p>
                <p className="text-blue-400 text-xs md:text-sm mt-1 md:mt-2">Welcome Little One!</p>
              </div>
            </div>

            {/* Decorative banner - hidden on mobile */}
            <div className="hidden md:block absolute top-4 left-4 bg-gradient-to-r from-pink-400 to-blue-400 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              It&apos;s a Celebration!
            </div>

            {/* Controls - touch friendly */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-pink-100 to-transparent p-2 md:p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-pink-600 hover:text-pink-700 hover:bg-pink-200/50 h-10 w-10"
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-pink-600 hover:text-pink-700 hover:bg-pink-200/50 h-10 w-10"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-pink-600 hover:text-pink-700 hover:bg-pink-200/50 h-10 w-10"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Reactions - responsive */}
          <div className="p-2 md:p-4 bg-white/70 border-t border-pink-200">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate">{title}</h2>
                <p className="text-slate-600 mt-1 text-sm md:text-base">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-pink-300 text-pink-500 hover:bg-pink-100 bg-transparent h-10 min-w-[44px]"
                  onClick={() => setReactions((r) => ({ ...r, hearts: r.hearts + 1 }))}
                >
                  <Heart className="h-4 w-4 mr-1" /> {reactions.hearts}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-300 text-yellow-500 hover:bg-yellow-100 bg-transparent h-10 min-w-[44px]"
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
          className={`${showChat ? "flex" : "hidden"} lg:flex w-full lg:w-96 bg-white/70 backdrop-blur-sm border-l border-pink-200 flex-col absolute lg:relative inset-0 lg:inset-auto top-0 z-20`}
        >
          <div className="p-3 md:p-4 border-b border-pink-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-pink-500" />
                Guest Messages
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-blue-500 text-xs md:text-sm flex items-center gap-1">
                  <Users className="h-4 w-4" /> 87
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-pink-600"
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-blue-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 min-w-0 bg-pink-50 rounded-2xl p-2 border border-pink-100">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs md:text-sm text-pink-600 truncate">{chat.user}</span>
                      <span className="text-slate-400 text-xs shrink-0">{chat.time}</span>
                    </div>
                    <p className="text-slate-700 text-xs md:text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-pink-200">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send wishes..."
                className="flex-1 bg-white border-pink-200 text-slate-800 placeholder:text-slate-400 focus:border-pink-400 rounded-full h-10 text-sm"
              />
              <Button className="bg-gradient-to-r from-pink-400 to-blue-400 hover:from-pink-500 hover:to-blue-500 text-white rounded-full h-10 w-10 min-w-[44px]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
