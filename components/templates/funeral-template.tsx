"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Volume2, Settings, Maximize2, Heart, Send, ArrowLeft, Eye, Radio, MessageCircle } from "lucide-react"
import Link from "next/link"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
}

const mockChatMessages = [
  { id: 1, user: "Family Member", message: "Rest in peace", time: "11:30 AM", color: "bg-slate-500" },
  { id: 2, user: "Old Friend", message: "Forever in our hearts", time: "11:31 AM", color: "bg-slate-600" },
  { id: 3, user: "Colleague", message: "Deepest condolences", time: "11:32 AM", color: "bg-slate-500" },
  { id: 4, user: "Neighbor", message: "Thinking of you all", time: "11:33 AM", color: "bg-slate-600" },
  { id: 5, user: "Loved One", message: "Gone but never forgotten", time: "11:34 AM", color: "bg-slate-500" },
]

export function FuneralTemplate({
  eventTitle = "Memorial Service",
  eventDescription = "Celebrating a life well lived",
}: TemplateProps) {
  const [chatMessage, setChatMessage] = useState("")
  const [viewerCount] = useState(124)
  const [showChat, setShowChat] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 text-slate-800">
      {/* Header - responsive */}
      <header className="flex items-center justify-between px-2 py-2 md:px-4 md:py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/admin/events">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-white hover:bg-slate-700 h-10 min-w-[44px] px-2 md:px-3"
            >
              <ArrowLeft className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
          </Link>
          <span className="text-xs md:text-sm px-2 md:px-3 py-1 bg-slate-700 rounded text-slate-300">Preview</span>
        </div>
        <span className="font-serif text-slate-300 italic text-sm md:text-base">In Loving Memory</span>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden text-slate-300 hover:text-white hover:bg-slate-700 h-10 min-w-[44px]"
          onClick={() => setShowChat(!showChat)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)]">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${showChat ? "hidden lg:flex" : "flex"}`}>
          {/* Video Player - responsive */}
          <div className="relative aspect-video m-2 md:m-6 rounded-lg overflow-hidden shadow-xl bg-slate-800 border border-slate-600">
            {/* Candle decorations - hidden on mobile */}
            <div className="hidden md:block absolute top-4 left-4 text-2xl opacity-60">&#128367;</div>
            <div className="hidden md:block absolute top-4 right-4 text-2xl opacity-60">&#128367;</div>

            {/* Live Badge */}
            <div className="absolute top-2 left-2 md:top-4 md:left-12 flex items-center gap-2 md:gap-3 z-10">
              <span className="flex items-center gap-1 md:gap-1.5 bg-slate-600 text-white text-xs px-2 md:px-3 py-1 rounded">
                <Radio className="h-3 w-3" />
                LIVE
              </span>
              <span className="flex items-center gap-1 md:gap-1.5 bg-slate-700 text-slate-300 text-xs px-2 md:px-3 py-1 rounded">
                <Eye className="h-3 w-3" />
                {viewerCount}
              </span>
            </div>

            {/* Video Placeholder */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-b from-slate-600 to-slate-700 flex items-center justify-center border-2 border-slate-500">
                <span className="text-2xl md:text-4xl text-slate-400">&#128367;</span>
              </div>
              <h2 className="text-lg md:text-2xl font-serif text-slate-300 mt-4 md:mt-6 italic text-center">
                {eventTitle}
              </h2>
              <p className="text-slate-400 text-xs md:text-sm mt-1 md:mt-2 text-center">{eventDescription}</p>
              <div className="mt-3 md:mt-4 w-16 md:w-24 h-px bg-slate-600" />
            </div>

            {/* Video Controls - touch friendly */}
            <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-slate-700 h-10 w-10">
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-slate-700 h-10 w-10">
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-slate-700 h-10 w-10">
                    <Maximize2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Event Info - responsive */}
          <div className="px-2 pb-2 md:px-6 md:pb-6">
            <div className="bg-white rounded-lg p-3 md:p-6 shadow-md border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg md:text-2xl font-serif text-slate-800 italic">{eventTitle}</h1>
                  <p className="text-slate-500 mt-1 text-sm md:text-base">{eventDescription}</p>
                </div>
                <Button
                  variant="outline"
                  className="border-slate-300 text-slate-600 hover:bg-slate-50 bg-transparent h-10 min-w-[44px] shrink-0"
                >
                  Share
                </Button>
              </div>

              {/* Tribute - touch friendly */}
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-slate-200">
                <span className="text-slate-500 text-xs md:text-sm">Tribute:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-400 hover:text-rose-500 hover:bg-rose-50 h-10 min-w-[44px]"
                >
                  <Heart className="h-5 w-5 fill-rose-200" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-500 hover:bg-slate-100 h-10 min-w-[44px]"
                >
                  <span className="text-xl">&#128367;</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-500 hover:bg-slate-100 h-10 min-w-[44px]"
                >
                  <span className="text-xl">&#127800;</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-500 hover:bg-slate-100 h-10 min-w-[44px]"
                >
                  <span className="text-xl">&#128330;</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Condolences Sidebar - responsive with toggle */}
        <div
          className={`${showChat ? "flex" : "hidden"} lg:flex w-full lg:w-80 bg-white border-l border-slate-200 flex-col absolute lg:relative inset-0 lg:inset-auto top-0 z-20`}
        >
          <div className="p-3 md:p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-slate-700 italic text-sm md:text-base">Condolences</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {viewerCount}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-slate-600"
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
                    className={`w-8 h-8 rounded-full ${msg.color} flex items-center justify-center text-white text-xs font-medium shrink-0`}
                  >
                    {msg.user.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0 bg-slate-50 rounded-lg p-2 md:p-3 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700 text-xs md:text-sm truncate">{msg.user}</span>
                      <span className="text-xs text-slate-400 shrink-0">{msg.time}</span>
                    </div>
                    <p className="text-slate-600 text-xs md:text-sm mt-1 italic">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex gap-2">
              <Input
                placeholder="Share condolences..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 h-10 text-sm md:text-base"
              />
              <Button size="icon" className="bg-slate-700 hover:bg-slate-800 h-10 w-10 min-w-[44px]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
