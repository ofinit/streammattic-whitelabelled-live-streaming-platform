"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Volume2, Settings, Maximize2, Heart, Send, ArrowLeft, Eye, Radio, Sparkles, MessageCircle } from "lucide-react"
import Link from "next/link"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
}

const mockChatMessages = [
  { id: 1, user: "Priya", message: "Happy Diwali!", time: "7:30 PM", color: "bg-orange-500" },
  { id: 2, user: "Raj", message: "Beautiful celebration!", time: "7:31 PM", color: "bg-yellow-500" },
  { id: 3, user: "Meera", message: "Shubh Deepavali!", time: "7:32 PM", color: "bg-pink-500" },
  { id: 4, user: "Arjun", message: "Jai Ho!", time: "7:33 PM", color: "bg-red-500" },
  { id: 5, user: "Ananya", message: "So colorful!", time: "7:34 PM", color: "bg-purple-500" },
]

export function IndianFestivalTemplate({
  eventTitle = "Festival Celebration",
  eventDescription = "Experience the joy and colors",
}: TemplateProps) {
  const [chatMessage, setChatMessage] = useState("")
  const [viewerCount] = useState(2847)
  const [showChat, setShowChat] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-yellow-50 to-pink-100 text-slate-800 overflow-hidden">
      {/* Rangoli-inspired pattern overlay - hidden on mobile for performance */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none hidden md:block"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%23ea580c' strokeWidth='2'/%3E%3Ccircle cx='50' cy='50' r='30' fill='none' stroke='%23eab308' strokeWidth='2'/%3E%3Ccircle cx='50' cy='50' r='20' fill='none' stroke='%23ec4899' strokeWidth='2'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header - responsive */}
      <header className="relative flex items-center justify-between px-2 py-2 md:px-4 md:py-3 bg-gradient-to-r from-orange-500 via-yellow-500 to-pink-500 shadow-lg">
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/admin/events">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/90 hover:text-white hover:bg-white/10 h-10 min-w-[44px] px-2 md:px-3"
            >
              <ArrowLeft className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
          </Link>
          <span className="text-xs md:text-sm px-2 md:px-3 py-1 bg-white/30 rounded-full text-white font-bold">
            Preview
          </span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-yellow-200" />
          <span className="font-bold text-white text-sm md:text-base hidden sm:inline">Indian Festival</span>
          <span className="text-xl md:text-2xl">&#127917;</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden text-white/90 hover:text-white hover:bg-white/10 h-10 min-w-[44px]"
          onClick={() => setShowChat(!showChat)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </header>

      <div className="relative flex flex-col lg:flex-row h-[calc(100vh-57px)]">
        {/* Main Content - hidden when chat is shown on mobile */}
        <div className={`flex-1 flex flex-col ${showChat ? "hidden lg:flex" : "flex"}`}>
          {/* Video Player - responsive */}
          <div className="relative aspect-video m-2 md:m-4 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">
            {/* Decorative border - simplified on mobile */}
            <div className="absolute inset-0 border-4 md:border-8 border-yellow-400/50 rounded-xl md:rounded-2xl pointer-events-none z-10">
              {/* Diya corners - hidden on mobile */}
              <div className="hidden md:block absolute -top-1 -left-1 text-2xl">&#127917;</div>
              <div className="hidden md:block absolute -top-1 -right-1 text-2xl">&#127917;</div>
              <div className="hidden md:block absolute -bottom-1 -left-1 text-2xl">&#127917;</div>
              <div className="hidden md:block absolute -bottom-1 -right-1 text-2xl">&#127917;</div>
            </div>

            <div className="bg-gradient-to-br from-orange-200 via-yellow-200 to-pink-200 h-full">
              {/* Live Badge */}
              <div className="absolute top-2 left-2 md:top-6 md:left-6 flex items-center gap-2 md:gap-3 z-10">
                <span className="flex items-center gap-1 md:gap-1.5 bg-orange-600 text-white text-xs font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-full animate-pulse">
                  <Radio className="h-3 w-3" />
                  LIVE
                </span>
                <span className="flex items-center gap-1 md:gap-1.5 bg-white/90 text-orange-700 text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-full shadow">
                  <Eye className="h-3 w-3" />
                  {viewerCount.toLocaleString()}
                </span>
              </div>

              {/* Video Placeholder - responsive */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="relative">
                  <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-orange-400 via-yellow-400 to-pink-400 flex items-center justify-center shadow-xl border-2 md:border-4 border-white">
                    <div className="w-18 h-18 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-yellow-300 via-orange-300 to-red-300 flex items-center justify-center border md:border-2 border-white/50">
                      <Sparkles className="h-8 w-8 md:h-14 md:w-14 text-white" />
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 text-xl md:text-3xl animate-pulse">
                    &#10024;
                  </div>
                </div>
                <h2 className="text-xl md:text-3xl font-bold text-orange-800 mt-4 md:mt-6 text-center">{eventTitle}</h2>
                <p className="text-orange-600 text-xs md:text-sm mt-1 md:mt-2 text-center">{eventDescription}</p>
                <div className="flex items-center gap-2 md:gap-3 mt-3 md:mt-4">
                  <span className="text-xl md:text-3xl">&#127917;</span>
                  <span className="text-xl md:text-3xl">&#10024;</span>
                  <span className="text-xl md:text-3xl">&#127912;</span>
                </div>
              </div>

              {/* Video Controls - touch friendly */}
              <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-orange-900/50 to-transparent">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-10 w-10">
                    <Volume2 className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-1 md:gap-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-10 w-10">
                      <Settings className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-10 w-10">
                      <Maximize2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event Info - responsive */}
          <div className="px-2 pb-2 md:px-4 md:pb-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg md:rounded-xl p-3 md:p-6 shadow-lg border border-orange-200">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg md:text-2xl font-bold text-orange-800 truncate">{eventTitle}</h1>
                  <p className="text-orange-600 mt-1 text-sm md:text-base">{eventDescription}</p>
                </div>
                <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-full px-4 md:px-6 h-10 min-w-[44px] shrink-0">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>

              {/* Reactions - touch friendly */}
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-orange-100">
                <span className="text-orange-500 text-xs md:text-sm">Celebrate:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 min-w-[44px]"
                >
                  <Heart className="h-5 w-5 fill-red-200" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 h-10 min-w-[44px]"
                >
                  <span className="text-xl">&#127917;</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 h-10 min-w-[44px]"
                >
                  <span className="text-xl">&#127912;</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-pink-500 hover:text-pink-600 hover:bg-pink-50 h-10 min-w-[44px]"
                >
                  <span className="text-xl">&#10024;</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar - responsive with toggle */}
        <div
          className={`${showChat ? "flex" : "hidden"} lg:flex w-full lg:w-80 bg-white/90 backdrop-blur-sm border-l border-orange-100 flex-col absolute lg:relative inset-0 lg:inset-auto top-0 z-20`}
        >
          <div className="p-3 md:p-4 border-b border-orange-100 bg-gradient-to-r from-orange-100 via-yellow-100 to-pink-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-orange-800 text-sm md:text-base">Festival Wishes</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-orange-500 flex items-center gap-1 bg-orange-200 px-2 py-1 rounded-full">
                  <Eye className="h-3 w-3" />
                  {viewerCount.toLocaleString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-orange-600"
                  onClick={() => setShowChat(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-3 md:p-4">
            <div className="space-y-3 md:space-y-4">
              {mockChatMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2 md:gap-3">
                  <div
                    className={`w-8 h-8 rounded-full ${msg.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                  >
                    {msg.user.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0 bg-gradient-to-r from-orange-50 via-yellow-50 to-pink-50 rounded-xl rounded-tl-none p-2 md:p-3 border border-orange-100">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-orange-800 text-xs md:text-sm truncate">{msg.user}</span>
                      <span className="text-xs text-orange-400 shrink-0">{msg.time}</span>
                    </div>
                    <p className="text-orange-700 text-xs md:text-sm mt-1">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-orange-100 bg-gradient-to-r from-orange-100 via-yellow-100 to-pink-100">
            <div className="flex gap-2">
              <Input
                placeholder="Send wishes..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="bg-white border-orange-200 text-orange-800 placeholder:text-orange-400 rounded-full h-10 text-sm"
              />
              <Button
                size="icon"
                className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-full h-10 w-10 min-w-[44px]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
