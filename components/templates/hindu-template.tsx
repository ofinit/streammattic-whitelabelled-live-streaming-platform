"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Volume2, Settings, Maximize2, Heart, Send, ArrowLeft, Eye, Radio, Flame, MessageCircle, X } from "lucide-react"
import Link from "next/link"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
}

const mockChatMessages = [
  { id: 1, user: "Priya S.", message: "Om Namah Shivaya", time: "06:30 AM", color: "bg-orange-500" },
  { id: 2, user: "Rahul K.", message: "Jai Shri Ram!", time: "06:31 AM", color: "bg-red-500" },
  { id: 3, user: "Anita M.", message: "Beautiful aarti", time: "06:32 AM", color: "bg-amber-500" },
  { id: 4, user: "Vikram P.", message: "Har Har Mahadev", time: "06:33 AM", color: "bg-orange-600" },
  { id: 5, user: "Sunita D.", message: "Blessed to watch this", time: "06:34 AM", color: "bg-red-600" },
]

export function HinduTemplate({
  eventTitle = "Divine Puja",
  eventDescription = "Experience the sacred ceremony",
}: TemplateProps) {
  const [chatMessage, setChatMessage] = useState("")
  const [viewerCount] = useState(1247)
  const [showMobileChat, setShowMobileChat] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-red-50 text-slate-800">
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='40' cy='40' r='35' fill='none' stroke='%23c2410c' strokeWidth='1'/%3E%3Ccircle cx='40' cy='40' r='25' fill='none' stroke='%23c2410c' strokeWidth='1'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%23c2410c' strokeWidth='1'/%3E%3C/svg%3E")`,
        }}
      />

      <header className="relative flex items-center justify-between px-3 py-2 md:px-4 md:py-3 bg-gradient-to-r from-orange-100 to-amber-100 border-b border-orange-200 shadow-sm">
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/admin/events">
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-700 hover:text-orange-900 hover:bg-orange-100 p-2 md:px-3"
            >
              <ArrowLeft className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
          </Link>
          <span className="hidden sm:inline text-xs md:text-sm px-2 md:px-3 py-1 bg-orange-200 rounded-full text-orange-700 font-medium">
            Template Preview
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xl md:text-2xl text-orange-500">&#128330;</span>
          <span className="font-serif text-orange-800 text-sm md:text-base">Hindu Ceremony</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden text-orange-700 hover:text-orange-900 p-2"
          onClick={() => setShowMobileChat(!showMobileChat)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </header>

      <div className="relative flex flex-col lg:flex-row h-[calc(100vh-49px)] md:h-[calc(100vh-57px)]">
        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          <div className="relative aspect-[16/10] sm:aspect-video m-2 md:m-4 rounded-lg overflow-hidden shadow-xl">
            <div className="absolute inset-0 border-4 md:border-8 border-orange-300/50 rounded-lg pointer-events-none z-10">
              <div className="hidden md:block absolute -top-3 left-4 bg-orange-50 px-2 text-orange-500 text-xl">
                &#2384;
              </div>
              <div className="hidden md:block absolute -top-3 right-4 bg-orange-50 px-2 text-orange-500 text-xl">
                &#2384;
              </div>
              <div className="hidden md:block absolute -bottom-3 left-4 bg-orange-50 px-2 text-orange-500 text-xl">
                &#2384;
              </div>
              <div className="hidden md:block absolute -bottom-3 right-4 bg-orange-50 px-2 text-orange-500 text-xl">
                &#2384;
              </div>
            </div>

            <div className="bg-gradient-to-b from-orange-100 via-amber-100 to-red-100 h-full">
              <div className="absolute top-3 left-3 md:top-6 md:left-6 flex items-center gap-2 md:gap-3 z-10">
                <span className="flex items-center gap-1 md:gap-1.5 bg-orange-600 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full">
                  <Radio className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  LIVE
                </span>
                <span className="flex items-center gap-1 md:gap-1.5 bg-white/90 text-orange-700 text-[10px] md:text-xs px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow">
                  <Eye className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  {viewerCount.toLocaleString()}
                </span>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
                <div className="relative">
                  <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-amber-200 via-orange-200 to-red-200 flex items-center justify-center shadow-lg border-2 md:border-4 border-amber-300">
                    <Flame className="h-10 w-10 md:h-16 md:w-16 text-orange-500 fill-amber-300" />
                  </div>
                  <div className="absolute inset-0 w-20 h-20 md:w-32 md:h-32 rounded-full bg-orange-400/30 animate-pulse blur-md" />
                </div>
                <p className="text-4xl md:text-6xl text-orange-400 mt-2 md:mt-4 opacity-80">&#2384;</p>
                <h2 className="text-lg md:text-2xl font-serif text-orange-800 mt-1 md:mt-2 text-center">
                  {eventTitle}
                </h2>
                <p className="text-orange-600 text-xs md:text-sm mt-1 md:mt-2 italic text-center">{eventDescription}</p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-orange-900/50 to-transparent">
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

          <div className="px-2 pb-2 md:px-4 md:pb-4">
            <div className="bg-white rounded-lg p-4 md:p-6 shadow-md border border-orange-100">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-xl md:text-2xl font-serif text-orange-800">{eventTitle}</h1>
                  <p className="text-orange-600 mt-1 italic text-sm md:text-base">{eventDescription}</p>
                </div>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto">
                  Share Blessings
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-orange-100">
                <span className="text-orange-500 text-xs md:text-sm">Offer prayers:</span>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 w-10 md:h-9 md:w-9 p-0"
                  >
                    <Heart className="h-5 w-5 fill-red-200" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 h-10 w-10 md:h-9 md:w-9 p-0"
                  >
                    <Flame className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 h-10 w-10 md:h-9 md:w-9 p-0"
                  >
                    <span className="text-lg md:text-xl">&#128591;</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-10 w-10 md:h-9 md:w-9 p-0"
                  >
                    <span className="text-lg md:text-xl">&#2384;</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`
          ${showMobileChat ? "fixed inset-0 z-50 bg-white" : "hidden"} 
          lg:relative lg:block lg:w-80 lg:bg-white lg:border-l lg:border-orange-100 lg:shadow-lg
          flex flex-col
        `}
        >
          <div className="p-3 md:p-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-orange-800 text-base md:text-lg">Devotee Messages</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-orange-500 flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full">
                  <Eye className="h-3 w-3" />
                  {viewerCount.toLocaleString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden text-orange-700 hover:text-orange-900 p-2"
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
                    className={`w-9 h-9 md:w-8 md:h-8 rounded-full ${msg.color} flex items-center justify-center text-white text-xs font-medium flex-shrink-0`}
                  >
                    {msg.user.charAt(0)}
                  </div>
                  <div className="flex-1 bg-orange-50 rounded-lg rounded-tl-none p-2 md:p-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-orange-800 text-sm">{msg.user}</span>
                      <span className="text-xs text-orange-400">{msg.time}</span>
                    </div>
                    <p className="text-orange-700 text-sm mt-1 break-words">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex gap-2">
              <Input
                placeholder="Share your prayers..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="bg-white border-orange-200 text-orange-800 placeholder:text-orange-400 h-11 md:h-10 text-base md:text-sm"
              />
              <Button size="icon" className="bg-orange-600 hover:bg-orange-700 h-11 w-11 md:h-10 md:w-10 flex-shrink-0">
                <Send className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
