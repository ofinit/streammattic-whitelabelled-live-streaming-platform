"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Volume2, Settings, Maximize2, Heart, Send, ArrowLeft, Eye, Radio, Cross, MessageCircle } from "lucide-react"
import Link from "next/link"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
}

const mockChatMessages = [
  { id: 1, user: "Grace M.", message: "Amen!", time: "10:30 AM", color: "bg-sky-600" },
  { id: 2, user: "Peter J.", message: "God bless everyone", time: "10:31 AM", color: "bg-amber-600" },
  { id: 3, user: "Mary S.", message: "Beautiful service", time: "10:32 AM", color: "bg-sky-500" },
  { id: 4, user: "John D.", message: "Hallelujah!", time: "10:33 AM", color: "bg-amber-500" },
  { id: 5, user: "Ruth A.", message: "Praying along", time: "10:34 AM", color: "bg-sky-600" },
]

export function ChristianTemplate({
  eventTitle = "Christian Wedding",
  eventDescription = "Join us as we celebrate our marriage before God, family, and friends.",
}: TemplateProps) {
  const [chatMessage, setChatMessage] = useState("")
  const [viewerCount] = useState(534)
  const [showMobileChat, setShowMobileChat] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-amber-50 text-slate-800">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 md:px-4 md:py-3 bg-white/90 backdrop-blur-sm border-b border-sky-100 shadow-sm">
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/admin/events">
            <Button variant="ghost" size="sm" className="text-sky-700 hover:text-sky-900 hover:bg-sky-50 p-2 md:px-3">
              <ArrowLeft className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
          </Link>
          <span className="hidden sm:inline text-xs md:text-sm px-2 md:px-3 py-1 bg-sky-100 rounded-full text-sky-700 font-medium">
            Template Preview
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Cross className="h-5 w-5 text-amber-600" />
          <span className="font-serif text-sky-800 text-sm md:text-base">Christian Wedding</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden text-sky-700 hover:text-sky-900 p-2"
          onClick={() => setShowMobileChat(!showMobileChat)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-49px)] md:h-[calc(100vh-57px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          {/* Video Player with sacred frame */}
          <div className="relative aspect-[16/10] sm:aspect-video m-2 md:m-4 rounded-lg overflow-hidden shadow-xl bg-gradient-to-b from-sky-100 to-sky-200 border-2 md:border-4 border-amber-200">
            {/* Decorative cross corners */}
            <div className="absolute top-3 left-3 text-amber-400 opacity-50">
              <Cross className="h-6 w-6" />
            </div>
            <div className="absolute top-3 right-3 text-amber-400 opacity-50">
              <Cross className="h-6 w-6" />
            </div>

            {/* Live Badge */}
            <div className="absolute top-4 left-12 flex items-center gap-3 z-10">
              <span className="flex items-center gap-1.5 bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                <Radio className="h-3 w-3" />
                LIVE
              </span>
              <span className="flex items-center gap-1.5 bg-white/90 text-sky-700 text-xs px-3 py-1 rounded-full shadow">
                <Eye className="h-3 w-3" />
                {viewerCount} worshippers
              </span>
            </div>

            {/* Video Placeholder */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-b from-amber-100 to-amber-200 flex items-center justify-center shadow-lg">
                  <Cross className="h-14 w-14 text-amber-600" />
                </div>
                {/* Light rays effect */}
                <div className="absolute inset-0 w-28 h-28 rounded-full bg-amber-300/20 animate-pulse" />
              </div>
              <h2 className="text-2xl font-serif text-sky-800 mt-6">{eventTitle}</h2>
              <p className="text-sky-600 text-sm mt-2 italic">{eventDescription}</p>
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-sky-900/50 to-transparent">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <Maximize2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Event Info */}
          <div className="px-2 pb-2 md:px-4 md:pb-4">
            <div className="bg-white rounded-lg p-4 md:p-6 shadow-md border border-sky-100">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-serif text-sky-800">{eventTitle}</h1>
                  <p className="text-sky-600 mt-1 italic">{eventDescription}</p>
                </div>
                <Button className="bg-sky-600 hover:bg-sky-700 text-white">Share Blessings</Button>
              </div>

              {/* Reactions */}
              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-sky-100">
                <span className="text-sky-500 text-sm">Send blessings:</span>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Heart className="h-5 w-5 fill-red-200" />
                </Button>
                <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-600 hover:bg-amber-50">
                  <span className="text-xl">&#128591;</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-sky-500 hover:text-sky-600 hover:bg-sky-50">
                  <span className="text-xl">&#128588;</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                  <Cross className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Prayer Requests Sidebar */}
        <div
          className={`
          ${showMobileChat ? "fixed inset-0 z-50 bg-white" : "hidden"} 
          lg:relative lg:block lg:w-80 lg:bg-white lg:border-l lg:border-sky-100 lg:shadow-lg
          flex flex-col
        `}
        >
          <div className="p-4 border-b border-sky-100 bg-gradient-to-r from-sky-50 to-amber-50">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-sky-800 text-lg">Prayer & Praise</h3>
              <span className="text-xs text-sky-500 flex items-center gap-1 bg-sky-100 px-2 py-1 rounded-full">
                <Eye className="h-3 w-3" />
                {viewerCount}
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {mockChatMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full ${msg.color} flex items-center justify-center text-white text-xs font-medium`}
                  >
                    {msg.user.charAt(0)}
                  </div>
                  <div className="flex-1 bg-sky-50 rounded-lg rounded-tl-none p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sky-800 text-sm">{msg.user}</span>
                      <span className="text-xs text-sky-400">{msg.time}</span>
                    </div>
                    <p className="text-sky-700 text-sm mt-1">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-sky-100 bg-gradient-to-r from-sky-50 to-amber-50">
            <div className="flex gap-2">
              <Input
                placeholder="Share your prayer..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="bg-white border-sky-200 text-sky-800 placeholder:text-sky-400"
              />
              <Button size="icon" className="bg-sky-600 hover:bg-sky-700">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
