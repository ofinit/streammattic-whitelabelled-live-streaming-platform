"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Volume2, Settings, Maximize2, Heart, Send, ArrowLeft, Eye, Radio, MessageCircle, X } from "lucide-react"
import Link from "next/link"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
}

const mockChatMessages = [
  { id: 1, user: "Emily", message: "So beautiful!", time: "02:30 PM", color: "bg-rose-400" },
  { id: 2, user: "Michael", message: "Congratulations!", time: "02:31 PM", color: "bg-amber-400" },
  { id: 3, user: "Sophia", message: "Love the decorations", time: "02:32 PM", color: "bg-rose-300" },
  { id: 4, user: "James", message: "Wishing you both happiness", time: "02:33 PM", color: "bg-amber-300" },
  { id: 5, user: "Olivia", message: "Tears of joy!", time: "02:34 PM", color: "bg-rose-400" },
]

export function WeddingTemplate({
  eventTitle = "Wedding Ceremony",
  eventDescription = "Celebrating love and unity",
}: TemplateProps) {
  const [chatMessage, setChatMessage] = useState("")
  const [viewerCount] = useState(256)
  const [showMobileChat, setShowMobileChat] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-amber-50 text-rose-900">
      <header className="flex items-center justify-between px-2 py-2 md:px-4 md:py-3 bg-white/80 backdrop-blur-sm border-b border-rose-200">
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/admin/events">
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:text-rose-800 hover:bg-rose-100 p-2 md:px-3"
            >
              <ArrowLeft className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
          </Link>
          <span className="hidden sm:inline text-xs md:text-sm px-2 md:px-3 py-1 bg-rose-100 rounded-full text-rose-600 font-medium">
            Template Preview
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-rose-400">
          <span className="text-xl md:text-2xl">&#10047;</span>
          <span className="font-serif text-rose-700 italic text-sm md:text-base">Wedding</span>
          <span className="text-xl md:text-2xl">&#10047;</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden text-rose-600 hover:text-rose-800 p-2"
          onClick={() => setShowMobileChat(!showMobileChat)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-49px)] md:h-[calc(100vh-57px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          <div className="relative bg-gradient-to-b from-rose-100 to-rose-200 aspect-[16/10] sm:aspect-video m-2 md:m-4 rounded-xl md:rounded-2xl overflow-hidden shadow-xl border-2 md:border-4 border-white">
            {/* Decorative corners - hidden on small screens */}
            <div className="hidden md:block absolute top-2 left-2 text-3xl text-rose-300 opacity-60">&#10048;</div>
            <div className="hidden md:block absolute top-2 right-2 text-3xl text-rose-300 opacity-60">&#10048;</div>
            <div className="hidden md:block absolute bottom-2 left-2 text-3xl text-rose-300 opacity-60">&#10048;</div>
            <div className="hidden md:block absolute bottom-2 right-2 text-3xl text-rose-300 opacity-60">&#10048;</div>

            {/* Live Badge */}
            <div className="absolute top-2 left-2 md:top-4 md:left-4 flex items-center gap-2 md:gap-3 z-10">
              <span className="flex items-center gap-1 md:gap-1.5 bg-rose-500 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-lg">
                <Radio className="h-2.5 w-2.5 md:h-3 md:w-3" />
                LIVE
              </span>
              <span className="flex items-center gap-1 md:gap-1.5 bg-white/90 text-rose-600 text-[10px] md:text-xs px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow">
                <Eye className="h-2.5 w-2.5 md:h-3 md:w-3" />
                {viewerCount}
              </span>
            </div>

            {/* Video Placeholder */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
              <div className="relative">
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-rose-200 flex items-center justify-center">
                  <Heart className="h-10 w-10 md:h-16 md:w-16 text-rose-400 fill-rose-300" />
                </div>
                <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 text-2xl md:text-4xl text-amber-400">
                  &#128141;
                </div>
              </div>
              <h2 className="text-lg md:text-2xl font-serif text-rose-700 mt-4 md:mt-6 italic text-center">
                {eventTitle}
              </h2>
              <p className="text-rose-500 text-xs md:text-sm mt-1 md:mt-2 font-light tracking-wide text-center">
                {eventDescription}
              </p>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-rose-900/40 to-transparent">
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

          <div className="px-2 pb-2 md:px-4 md:pb-4">
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-rose-100">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-xl md:text-2xl font-serif text-rose-800">{eventTitle}</h1>
                  <p className="text-rose-500 mt-1 italic text-sm md:text-base">{eventDescription}</p>
                </div>
                <Button className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-4 md:px-6 w-full sm:w-auto">
                  <Heart className="h-4 w-4 mr-2 fill-white" />
                  Share Love
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-rose-100">
                <span className="text-rose-400 text-xs md:text-sm italic">Send wishes:</span>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full h-10 w-10 md:h-9 md:w-9 p-0"
                  >
                    <Heart className="h-5 w-5 fill-rose-200" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-full h-10 w-10 md:h-9 md:w-9 p-0"
                  >
                    <span className="text-lg md:text-xl">&#128141;</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-400 hover:text-rose-500 hover:bg-rose-50 rounded-full h-10 w-10 md:h-9 md:w-9 p-0"
                  >
                    <span className="text-lg md:text-xl">&#128144;</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-pink-400 hover:text-pink-500 hover:bg-pink-50 rounded-full h-10 w-10 md:h-9 md:w-9 p-0"
                  >
                    <span className="text-lg md:text-xl">&#128149;</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`
          ${showMobileChat ? "fixed inset-0 z-50 bg-white" : "hidden"} 
          lg:relative lg:block lg:w-80 lg:bg-white lg:border-l lg:border-rose-100 lg:shadow-xl
          flex flex-col
        `}
        >
          <div className="p-3 md:p-4 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-amber-50">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-rose-700 text-base md:text-lg">Guest Messages</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-400 flex items-center gap-1 bg-rose-100 px-2 py-1 rounded-full">
                  <Eye className="h-3 w-3" />
                  {viewerCount}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden text-rose-600 hover:text-rose-800 p-2"
                  onClick={() => setShowMobileChat(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-3 md:p-4">
            <div className="space-y-3 md:space-y-4">
              {mockChatMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2 md:gap-3">
                  <div
                    className={`w-9 h-9 md:w-8 md:h-8 rounded-full ${msg.color} flex items-center justify-center text-white text-xs font-medium shadow flex-shrink-0`}
                  >
                    {msg.user.charAt(0)}
                  </div>
                  <div className="flex-1 bg-rose-50 rounded-2xl rounded-tl-none p-2 md:p-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-rose-700 text-sm">{msg.user}</span>
                      <span className="text-xs text-rose-300">{msg.time}</span>
                    </div>
                    <p className="text-rose-600 text-sm mt-1 break-words">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-rose-100 bg-gradient-to-r from-rose-50 to-amber-50">
            <div className="flex gap-2">
              <Input
                placeholder="Send your wishes..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="bg-white border-rose-200 text-rose-800 placeholder:text-rose-300 rounded-full focus:border-rose-400 h-11 md:h-10 text-base md:text-sm"
              />
              <Button
                size="icon"
                className="bg-rose-500 hover:bg-rose-600 rounded-full shadow-lg h-11 w-11 md:h-10 md:w-10 flex-shrink-0"
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
