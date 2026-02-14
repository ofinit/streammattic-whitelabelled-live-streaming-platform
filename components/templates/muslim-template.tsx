"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Volume2, Settings, Maximize2, Heart, Send, ArrowLeft, Eye, Radio, Moon, MessageCircle, X } from "lucide-react"
import Link from "next/link"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
}

const mockChatMessages = [
  { id: 1, user: "Ahmad K.", message: "MashaAllah!", time: "02:30 PM", color: "bg-emerald-600" },
  { id: 2, user: "Fatima S.", message: "Alhamdulillah", time: "02:31 PM", color: "bg-teal-600" },
  { id: 3, user: "Omar H.", message: "Beautiful recitation", time: "02:32 PM", color: "bg-emerald-500" },
  { id: 4, user: "Aisha M.", message: "SubhanAllah", time: "02:33 PM", color: "bg-teal-500" },
  { id: 5, user: "Yusuf A.", message: "JazakAllah Khair", time: "02:34 PM", color: "bg-emerald-600" },
]

export function MuslimTemplate({
  eventTitle = "Islamic Gathering",
  eventDescription = "Peace and blessings upon you",
}: TemplateProps) {
  const [chatMessage, setChatMessage] = useState("")
  const [viewerCount] = useState(892)
  const [showMobileChat, setShowMobileChat] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 text-slate-800">
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30L30 0z' fill='%23047857' fillOpacity='0.4'/%3E%3C/svg%3E")`,
        }}
      />

      <header className="relative flex items-center justify-between px-3 py-2 md:px-4 md:py-3 bg-white/90 backdrop-blur-sm border-b border-emerald-100 shadow-sm">
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/admin/events">
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 p-2 md:px-3"
            >
              <ArrowLeft className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
          </Link>
          <span className="hidden sm:inline text-xs md:text-sm px-2 md:px-3 py-1 bg-emerald-100 rounded-full text-emerald-700 font-medium">
            Template Preview
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Moon className="h-5 w-5 text-emerald-600" />
          <span className="font-serif text-emerald-800 text-sm md:text-base">Islamic Ceremony</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden text-emerald-700 hover:text-emerald-900 p-2"
          onClick={() => setShowMobileChat(!showMobileChat)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </header>

      <div className="relative flex flex-col lg:flex-row h-[calc(100vh-49px)] md:h-[calc(100vh-57px)]">
        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          <div className="relative aspect-[16/10] sm:aspect-video m-2 md:m-4 rounded-lg overflow-hidden shadow-xl">
            <div className="absolute inset-0 border-4 md:border-8 border-emerald-600/20 rounded-lg pointer-events-none z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-50 px-2 md:px-4">
                <span className="text-emerald-600 font-arabic text-xl md:text-2xl">&#65010;</span>
              </div>
            </div>

            <div className="bg-gradient-to-b from-emerald-100 to-teal-100 h-full">
              <div className="absolute top-3 left-3 md:top-6 md:left-6 flex items-center gap-2 md:gap-3 z-10">
                <span className="flex items-center gap-1 md:gap-1.5 bg-emerald-600 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full">
                  <Radio className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  LIVE
                </span>
                <span className="flex items-center gap-1 md:gap-1.5 bg-white/90 text-emerald-700 text-[10px] md:text-xs px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow">
                  <Eye className="h-2.5 w-2.5 md:h-3 md:w-3" />
                  {viewerCount}
                </span>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
                <div className="relative">
                  <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-emerald-200 to-teal-200 flex items-center justify-center shadow-lg border-2 md:border-4 border-white">
                    <div className="relative">
                      <Moon className="h-10 w-10 md:h-16 md:w-16 text-emerald-600" />
                      <span className="absolute -top-1 -right-1 text-lg md:text-2xl text-emerald-500">&#10022;</span>
                    </div>
                  </div>
                </div>
                <h2 className="text-lg md:text-2xl font-serif text-emerald-800 mt-4 md:mt-6 text-center">
                  {eventTitle}
                </h2>
                <p className="text-emerald-600 text-xs md:text-sm mt-1 md:mt-2 italic text-center">
                  {eventDescription}
                </p>
                <p className="hidden md:block text-emerald-500 text-xs mt-4 font-arabic">
                  &#1576;&#1616;&#1587;&#1618;&#1605;&#1616; &#1575;&#1604;&#1604;&#1617;&#1614;&#1607;&#1616;
                  &#1575;&#1604;&#1585;&#1617;&#1614;&#1581;&#1618;&#1605;&#1614;&#1648;&#1606;&#1616;
                  &#1575;&#1604;&#1585;&#1617;&#1614;&#1581;&#1616;&#1610;&#1605;&#1616;
                </p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-emerald-900/50 to-transparent">
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
            <div className="bg-white rounded-lg p-4 md:p-6 shadow-md border border-emerald-100">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-xl md:text-2xl font-serif text-emerald-800">{eventTitle}</h1>
                  <p className="text-emerald-600 mt-1 italic text-sm md:text-base">{eventDescription}</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">Share</Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-emerald-100">
                <span className="text-emerald-500 text-xs md:text-sm">Send blessings:</span>
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
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-10 w-10 md:h-9 md:w-9 p-0"
                  >
                    <span className="text-lg md:text-xl">&#128591;</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-teal-500 hover:text-teal-600 hover:bg-teal-50 h-10 w-10 md:h-9 md:w-9 p-0"
                  >
                    <Moon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 h-10 w-10 md:h-9 md:w-9 p-0"
                  >
                    <span className="text-lg md:text-xl">&#10022;</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`
          ${showMobileChat ? "fixed inset-0 z-50 bg-white" : "hidden"} 
          lg:relative lg:block lg:w-80 lg:bg-white lg:border-l lg:border-emerald-100 lg:shadow-lg
          flex flex-col
        `}
        >
          <div className="p-3 md:p-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-emerald-800 text-base md:text-lg">Community</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-500 flex items-center gap-1 bg-emerald-100 px-2 py-1 rounded-full">
                  <Eye className="h-3 w-3" />
                  {viewerCount}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden text-emerald-700 hover:text-emerald-900 p-2"
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
                  <div className="flex-1 bg-emerald-50 rounded-lg rounded-tl-none p-2 md:p-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-emerald-800 text-sm">{msg.user}</span>
                      <span className="text-xs text-emerald-400">{msg.time}</span>
                    </div>
                    <p className="text-emerald-700 text-sm mt-1 break-words">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex gap-2">
              <Input
                placeholder="Share your thoughts..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="bg-white border-emerald-200 text-emerald-800 placeholder:text-emerald-400 h-11 md:h-10 text-base md:text-sm"
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
