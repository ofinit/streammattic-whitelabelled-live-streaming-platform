"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Volume2,
  Settings,
  Maximize2,
  Heart,
  Send,
  ArrowLeft,
  Eye,
  Radio,
  Cake,
  PartyPopper,
  Gift,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
}

const mockChatMessages = [
  { id: 1, user: "BestFriend", message: "Happy Birthday!!!", time: "6:00 PM", color: "bg-pink-500" },
  { id: 2, user: "FamilyLove", message: "Many happy returns!", time: "6:01 PM", color: "bg-purple-500" },
  { id: 3, user: "PartyPerson", message: "Let's celebrate!", time: "6:02 PM", color: "bg-yellow-500" },
  { id: 4, user: "CakeLover", message: "Where's the cake?!", time: "6:03 PM", color: "bg-pink-400" },
  { id: 5, user: "WishMaker", message: "Make a wish!", time: "6:04 PM", color: "bg-purple-400" },
]

export function BirthdayTemplate({
  eventTitle = "Birthday Celebration",
  eventDescription = "Join us for a special celebration",
}: TemplateProps) {
  const [chatMessage, setChatMessage] = useState("")
  const [viewerCount] = useState(89)
  const [showChat, setShowChat] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-purple-50 to-yellow-100 text-slate-800 overflow-hidden">
      {/* Confetti-like dots overlay */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-3 h-3 md:w-4 md:h-4 bg-yellow-400 rounded-full animate-bounce" />
        <div
          className="absolute top-20 right-20 w-2 h-2 md:w-3 md:h-3 bg-pink-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        />
        <div
          className="absolute top-40 left-1/4 w-2 h-2 md:w-3 md:h-3 bg-purple-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.4s" }}
        />
        <div
          className="absolute bottom-40 right-1/4 w-3 h-3 md:w-4 md:h-4 bg-cyan-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.6s" }}
        />
      </div>

      {/* Header - responsive */}
      <header className="relative flex items-center justify-between px-2 py-2 md:px-4 md:py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 shadow-lg">
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/admin/events">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10 h-10 min-w-[44px] px-2 md:px-3"
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
          <PartyPopper className="h-4 w-4 md:h-5 md:w-5 text-yellow-300" />
          <span className="font-bold text-white text-sm md:text-base">Birthday</span>
          <Cake className="h-4 w-4 md:h-5 md:w-5 text-pink-200" />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden text-white/80 hover:text-white hover:bg-white/10 h-10 min-w-[44px]"
          onClick={() => setShowChat(!showChat)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </header>

      <div className="relative flex flex-col lg:flex-row h-[calc(100vh-57px)]">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${showChat ? "hidden lg:flex" : "flex"}`}>
          {/* Video Player - responsive */}
          <div className="relative aspect-video m-2 md:m-4 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border-2 md:border-4 border-white">
            <div className="bg-gradient-to-br from-pink-200 via-purple-200 to-yellow-200 h-full">
              {/* Balloon decorations - hidden on mobile */}
              <div className="hidden md:block absolute top-2 left-4 text-4xl">&#127880;</div>
              <div className="hidden md:block absolute top-2 right-4 text-4xl">&#127880;</div>

              {/* Live Badge */}
              <div className="absolute top-2 left-2 md:top-4 md:left-16 flex items-center gap-2 md:gap-3 z-10">
                <span className="flex items-center gap-1 md:gap-1.5 bg-pink-500 text-white text-xs font-bold px-2 md:px-3 py-1 rounded-full animate-pulse">
                  <Radio className="h-3 w-3" />
                  LIVE
                </span>
                <span className="flex items-center gap-1 md:gap-1.5 bg-white/90 text-purple-700 text-xs px-2 md:px-3 py-1 rounded-full shadow">
                  <Eye className="h-3 w-3" />
                  {viewerCount}
                </span>
              </div>

              {/* Video Placeholder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="relative">
                  <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-yellow-400 flex items-center justify-center shadow-xl border-2 md:border-4 border-white">
                    <Cake className="h-10 w-10 md:h-16 md:w-16 text-white" />
                  </div>
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xl md:text-2xl animate-pulse">
                    &#128293;
                  </div>
                </div>
                <h2 className="text-xl md:text-3xl font-bold text-purple-800 mt-4 md:mt-6 text-center">{eventTitle}</h2>
                <p className="text-pink-600 text-xs md:text-sm mt-1 md:mt-2 text-center">{eventDescription}</p>
                <div className="flex items-center gap-2 mt-3 md:mt-4">
                  <span className="text-2xl md:text-3xl">&#127881;</span>
                  <span className="text-2xl md:text-3xl">&#127874;</span>
                  <span className="text-2xl md:text-3xl">&#127881;</span>
                </div>
              </div>

              {/* Video Controls - touch friendly */}
              <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-purple-900/40 to-transparent">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-10 w-10 md:h-9 md:w-9">
                    <Volume2 className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-1 md:gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-10 w-10 md:h-9 md:w-9"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 h-10 w-10 md:h-9 md:w-9"
                    >
                      <Maximize2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event Info - responsive */}
          <div className="px-2 pb-2 md:px-4 md:pb-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-6 shadow-lg border border-pink-100">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg md:text-2xl font-bold text-purple-800 truncate">{eventTitle}</h1>
                  <p className="text-pink-600 mt-1 text-sm md:text-base">{eventDescription}</p>
                </div>
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full px-4 md:px-6 h-10 min-w-[44px] shrink-0">
                  <Gift className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>

              {/* Reactions - touch friendly */}
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-pink-100">
                <span className="text-purple-500 text-xs md:text-sm">Wishes:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-pink-500 hover:text-pink-600 hover:bg-pink-50 h-10 min-w-[44px]"
                >
                  <Heart className="h-5 w-5 fill-pink-200" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 h-10 min-w-[44px]"
                >
                  <PartyPopper className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-500 hover:text-purple-600 hover:bg-purple-50 h-10 min-w-[44px]"
                >
                  <Cake className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cyan-500 hover:text-cyan-600 hover:bg-cyan-50 h-10 min-w-[44px]"
                >
                  <span className="text-xl">&#127880;</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar - responsive with toggle */}
        <div
          className={`${showChat ? "flex" : "hidden"} lg:flex w-full lg:w-80 bg-white/90 backdrop-blur-sm border-l border-pink-100 flex-col absolute lg:relative inset-0 lg:inset-auto top-0 z-20`}
        >
          <div className="p-3 md:p-4 border-b border-pink-100 bg-gradient-to-r from-pink-100 to-purple-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-purple-800 text-sm md:text-base">Birthday Wishes</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-pink-500 flex items-center gap-1 bg-pink-200 px-2 py-1 rounded-full">
                  <Eye className="h-3 w-3" />
                  {viewerCount}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-purple-600"
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
                  <div className="flex-1 min-w-0 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl rounded-tl-none p-2 md:p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-purple-800 text-xs md:text-sm truncate">{msg.user}</span>
                      <span className="text-xs text-pink-400 shrink-0">{msg.time}</span>
                    </div>
                    <p className="text-purple-700 text-xs md:text-sm mt-1">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-pink-100 bg-gradient-to-r from-pink-100 to-purple-100">
            <div className="flex gap-2">
              <Input
                placeholder="Send wishes..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="bg-white border-pink-200 text-purple-800 placeholder:text-pink-400 rounded-full h-10 text-sm md:text-base"
              />
              <Button
                size="icon"
                className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-full h-10 w-10 min-w-[44px]"
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
