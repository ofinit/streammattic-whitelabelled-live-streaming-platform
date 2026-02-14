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
  Smile,
  Send,
  ArrowLeft,
  Eye,
  Radio,
  MessageCircle,
  X,
} from "lucide-react"
import Link from "next/link"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
}

const mockChatMessages = [
  { id: 1, user: "John D.", message: "Great stream!", time: "09:46 AM", color: "bg-emerald-500" },
  { id: 2, user: "Sarah M.", message: "This looks amazing!", time: "09:46 AM", color: "bg-blue-500" },
  { id: 3, user: "Alex K.", message: "Love the quality", time: "09:46 AM", color: "bg-purple-500" },
  { id: 4, user: "Mike R.", message: "First time watching!", time: "09:46 AM", color: "bg-orange-500" },
  { id: 5, user: "Emma W.", message: "Thanks for streaming!", time: "09:46 AM", color: "bg-pink-500" },
]

export function DefaultTemplate({
  eventTitle = "Live Event",
  eventDescription = "Welcome to our live stream",
}: TemplateProps) {
  const [chatMessage, setChatMessage] = useState("")
  const [viewerCount] = useState(342)
  const [showMobileChat, setShowMobileChat] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <header className="flex items-center justify-between px-2 py-2 md:px-4 md:py-3 bg-zinc-800 border-b border-zinc-700">
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/admin/events">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white p-2 md:px-3">
              <ArrowLeft className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
          </Link>
          <span className="hidden sm:inline text-xs md:text-sm px-2 py-1 bg-zinc-700 rounded text-zinc-300">
            Template Preview
          </span>
          <span className="text-xs md:text-sm text-zinc-400 truncate max-w-[120px] sm:max-w-none">
            Default Template
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden text-zinc-400 hover:text-white p-2"
          onClick={() => setShowMobileChat(!showMobileChat)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-49px)] md:h-[calc(100vh-57px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="relative bg-zinc-950 aspect-[16/10] sm:aspect-video">
            {/* Live Badge */}
            <div className="absolute top-2 left-2 md:top-4 md:left-4 flex items-center gap-2 md:gap-3 z-10">
              <span className="flex items-center gap-1 md:gap-1.5 bg-red-600 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                <Radio className="h-2.5 w-2.5 md:h-3 md:w-3" />
                LIVE
              </span>
              <span className="flex items-center gap-1 md:gap-1.5 bg-black/60 text-white text-[10px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-1 rounded">
                <Eye className="h-2.5 w-2.5 md:h-3 md:w-3" />
                {viewerCount}
              </span>
            </div>

            {/* Video Placeholder */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2 md:mb-4">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-emerald-500/40 flex items-center justify-center">
                  <Radio className="h-6 w-6 md:h-8 md:w-8 text-emerald-500" />
                </div>
              </div>
              <h2 className="text-base md:text-xl font-semibold text-white text-center px-4">{eventTitle}</h2>
              <p className="text-zinc-500 text-xs md:text-sm mt-1">Default Template</p>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-10 w-10 md:h-9 md:w-9">
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-10 w-10 md:h-9 md:w-9">
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-10 w-10 md:h-9 md:w-9">
                    <Maximize2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 md:p-4 bg-zinc-800 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-white truncate">{eventTitle}</h1>
                <p className="text-zinc-400 mt-1 text-sm md:text-base line-clamp-2">{eventDescription}</p>
              </div>
              <Button
                variant="outline"
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-700 bg-transparent w-full sm:w-auto flex-shrink-0"
              >
                Share
              </Button>
            </div>

            <div className="flex items-center gap-2 md:gap-4 mt-3 md:mt-4">
              <span className="text-zinc-400 text-xs md:text-sm">React:</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-10 w-10 md:h-9 md:w-9 p-0"
              >
                <Heart className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 h-10 w-10 md:h-9 md:w-9 p-0"
              >
                <ThumbsUp className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 h-10 w-10 md:h-9 md:w-9 p-0"
              >
                <Smile className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div
          className={`
          ${showMobileChat ? "fixed inset-0 z-50 bg-zinc-800" : "hidden"} 
          lg:relative lg:block lg:w-80 lg:bg-zinc-800 lg:border-l lg:border-zinc-700 
          flex flex-col
        `}
        >
          <div className="p-3 md:p-4 border-b border-zinc-700 flex items-center justify-between">
            <h3 className="font-semibold text-white text-base md:text-lg">Live Chat</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {viewerCount}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-zinc-400 hover:text-white p-2"
                onClick={() => setShowMobileChat(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-3 md:p-4">
            <div className="space-y-3 md:space-y-4">
              {mockChatMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2 md:gap-3">
                  <div
                    className={`w-9 h-9 md:w-8 md:h-8 rounded-full ${msg.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                  >
                    {msg.user.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{msg.user}</span>
                      <span className="text-xs text-zinc-500">{msg.time}</span>
                    </div>
                    <p className="text-zinc-300 text-sm break-words">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-zinc-700">
            <div className="flex gap-2">
              <Input
                placeholder="Send a message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-500 h-11 md:h-10 text-base md:text-sm"
              />
              <Button
                size="icon"
                className="bg-emerald-600 hover:bg-emerald-700 h-11 w-11 md:h-10 md:w-10 flex-shrink-0"
              >
                <Send className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
