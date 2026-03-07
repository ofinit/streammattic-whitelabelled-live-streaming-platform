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
  ThumbsUp,
  Send,
  ArrowLeft,
  Eye,
  Radio,
  Trophy,
  Users,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
}

const mockChatMessages = [
  { id: 1, user: "SportsFan23", message: "GOOOAAL!", time: "7:45 PM", color: "bg-red-600" },
  { id: 2, user: "TeamPlayer", message: "What a save!", time: "7:45 PM", color: "bg-blue-600" },
  { id: 3, user: "ChampionMind", message: "Best game ever!", time: "7:46 PM", color: "bg-green-600" },
  { id: 4, user: "VictorySeeker", message: "Come on team!", time: "7:46 PM", color: "bg-red-500" },
  { id: 5, user: "GameDay", message: "Incredible play!", time: "7:47 PM", color: "bg-blue-500" },
]

export function SportsTemplate({
  eventTitle = "Live Match",
  eventDescription = "Watch the action unfold",
}: TemplateProps) {
  const [chatMessage, setChatMessage] = useState("")
  const [viewerCount] = useState(45230)
  const [showChat, setShowChat] = useState(false)

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Dynamic background */}
      <div className="fixed inset-0 bg-gradient-to-br from-green-900/30 via-slate-900 to-blue-900/30 pointer-events-none" />

      {/* Header - responsive */}
      <header className="relative flex items-center justify-between px-2 py-2 md:px-4 md:py-3 bg-gradient-to-r from-red-600 to-blue-600 shadow-lg z-10">
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
          <span className="text-xs md:text-sm px-2 md:px-3 py-1 bg-white/20 rounded-full text-white font-bold">
            Preview
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
          <span className="font-bold text-white uppercase tracking-wide text-sm md:text-base">Sports</span>
        </div>
        {/* Mobile chat toggle */}
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
        {/* Main Content - responsive with chat toggle */}
        <div className={`flex-1 flex flex-col ${showChat ? "hidden lg:flex" : "flex"}`}>
          {/* Scoreboard */}
          <div className="bg-slate-800/80 backdrop-blur px-3 py-2 md:px-6 md:py-3 border-b border-slate-700 flex items-center justify-center gap-4 md:gap-8">
            <div className="text-center">
              <div className="text-lg md:text-2xl font-bold text-red-500">HOME</div>
              <div className="text-2xl md:text-4xl font-black">2</div>
            </div>
            <div className="text-center">
              <div className="text-xs md:text-sm text-slate-400">LIVE</div>
              <div className="text-xl md:text-2xl font-mono text-green-400">45:23</div>
            </div>
            <div className="text-center">
              <div className="text-lg md:text-2xl font-bold text-blue-500">AWAY</div>
              <div className="text-2xl md:text-4xl font-black">1</div>
            </div>
          </div>

          {/* Video Player - responsive */}
          <div className="relative flex-1 bg-green-900/20 m-2 md:m-4 rounded-lg overflow-hidden border border-green-500/30">
            {/* Live indicator */}
            <div className="absolute top-2 left-2 md:top-4 md:left-4 flex items-center gap-2 md:gap-3 z-10">
              <span className="flex items-center gap-1 md:gap-1.5 bg-red-600 text-white text-xs font-bold px-2 md:px-3 py-1 rounded animate-pulse">
                <Radio className="h-3 w-3" />
                LIVE
              </span>
              <span className="flex items-center gap-1 md:gap-1.5 bg-slate-800/80 text-white text-xs px-2 md:px-3 py-1 rounded">
                <Eye className="h-3 w-3" />
                {(viewerCount / 1000).toFixed(1)}K
              </span>
            </div>

            {/* Video Placeholder */}
            <div className="aspect-video bg-gradient-to-b from-green-800 to-green-900 flex flex-col items-center justify-center p-4">
              {/* Field lines */}
              <div className="absolute inset-4 md:inset-8 border-2 border-white/20 rounded-lg" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20" />
              <div className="absolute top-1/4 md:top-1/3 left-1/2 -translate-x-1/2 w-16 md:w-24 h-16 md:h-24 border-2 border-white/20 rounded-full" />

              <Trophy className="h-12 w-12 md:h-20 md:w-20 text-yellow-400 mb-3 md:mb-4" />
              <h2 className="text-xl md:text-3xl font-bold text-white text-center">{eventTitle}</h2>
              <p className="text-green-300 mt-1 md:mt-2 text-sm md:text-base text-center">{eventDescription}</p>
            </div>

            {/* Video Controls - touch friendly */}
            <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-slate-900/90 to-transparent">
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

          {/* Event Info - responsive */}
          <div className="px-2 pb-2 md:px-4 md:pb-4">
            <div className="bg-slate-800/60 backdrop-blur rounded-lg p-3 md:p-4 border border-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg md:text-xl font-bold text-white truncate">{eventTitle}</h1>
                  <p className="text-slate-400 mt-1 text-sm md:text-base">{eventDescription}</p>
                </div>
                <Button className="bg-gradient-to-r from-red-600 to-blue-600 text-white h-10 min-w-[44px] shrink-0">
                  Share
                </Button>
              </div>

              {/* Reactions - touch friendly */}
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-700">
                <span className="text-slate-400 text-xs md:text-sm">React:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-10 min-w-[44px]"
                >
                  <Heart className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 h-10 min-w-[44px]"
                >
                  <ThumbsUp className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 h-10 min-w-[44px]"
                >
                  <Trophy className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar - responsive with toggle */}
        <div
          className={`${showChat ? "flex" : "hidden"} lg:flex w-full lg:w-80 bg-slate-800/80 backdrop-blur border-l border-slate-700 flex-col absolute lg:relative inset-0 lg:inset-auto top-0 z-20`}
        >
          <div className="p-3 md:p-4 border-b border-slate-700 bg-gradient-to-r from-red-900/50 to-blue-900/50">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                Match Chat
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 flex items-center gap-1 bg-slate-700 px-2 py-1 rounded-full">
                  <Users className="h-3 w-3" />
                  {(viewerCount / 1000).toFixed(1)}K
                </span>
                {/* Mobile back button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-white"
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-xs md:text-sm truncate">{msg.user}</span>
                      <span className="text-xs text-slate-400 shrink-0">{msg.time}</span>
                    </div>
                    <p className="text-slate-300 text-xs md:text-sm">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <Input
                placeholder="Cheer your team..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 h-10 text-sm"
              />
              <Button size="icon" className="bg-gradient-to-r from-red-600 to-blue-600 h-10 w-10 min-w-[44px]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
