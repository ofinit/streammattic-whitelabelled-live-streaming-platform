"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Volume2,
  Settings,
  Maximize2,
  ThumbsUp,
  MessageSquare,
  Send,
  ArrowLeft,
  Eye,
  Radio,
  Building2,
  MessageCircle,
  X,
} from "lucide-react"
import Link from "next/link"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
}

const mockChatMessages = [
  { id: 1, user: "David Chen", message: "Great presentation!", time: "10:30 AM", color: "bg-slate-600" },
  { id: 2, user: "Lisa Park", message: "Very insightful", time: "10:31 AM", color: "bg-blue-600" },
  { id: 3, user: "Mark Wilson", message: "Question about Q3 metrics?", time: "10:32 AM", color: "bg-slate-500" },
  { id: 4, user: "Sarah Johnson", message: "Excellent strategy overview", time: "10:33 AM", color: "bg-blue-500" },
  { id: 5, user: "Tom Anderson", message: "Thanks for the update", time: "10:34 AM", color: "bg-slate-600" },
]

export function CorporateTemplate({
  eventTitle = "Corporate Event",
  eventDescription = "Professional business presentation",
}: TemplateProps) {
  const [chatMessage, setChatMessage] = useState("")
  const [viewerCount] = useState(489)
  const [showMobileChat, setShowMobileChat] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between px-3 py-2 md:px-6 md:py-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 md:gap-4">
          <Link href="/admin/events">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-2 md:px-3"
            >
              <ArrowLeft className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
          </Link>
          <div className="hidden sm:block h-6 w-px bg-slate-200" />
          <span className="hidden sm:inline text-xs md:text-sm px-2 md:px-3 py-1 bg-blue-50 text-blue-600 rounded font-medium">
            Template Preview
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-slate-700 text-sm md:text-base">Corporate</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden text-slate-600 hover:text-slate-900 p-2"
          onClick={() => setShowMobileChat(!showMobileChat)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-49px)] md:h-[calc(100vh-65px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col p-3 md:p-6 min-h-0 overflow-auto">
          <div className="relative bg-slate-900 aspect-[16/10] sm:aspect-video rounded-lg overflow-hidden shadow-2xl">
            <div className="absolute top-2 left-2 md:top-4 md:left-4 flex items-center gap-2 md:gap-3 z-10">
              <span className="flex items-center gap-1 md:gap-1.5 bg-red-600 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1.5 rounded">
                <Radio className="h-2.5 w-2.5 md:h-3 md:w-3" />
                LIVE
              </span>
              <span className="flex items-center gap-1 md:gap-1.5 bg-slate-800 text-slate-200 text-[10px] md:text-xs px-2 py-0.5 md:px-3 md:py-1.5 rounded">
                <Eye className="h-2.5 w-2.5 md:h-3 md:w-3" />
                {viewerCount}
              </span>
            </div>

            <div className="hidden md:block absolute top-4 right-4 z-10">
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded">
                <span className="text-white text-sm font-medium">CORPORATE EVENT</span>
              </div>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 px-4">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-lg bg-blue-600 flex items-center justify-center mb-2 md:mb-4 shadow-lg">
                <Building2 className="h-8 w-8 md:h-12 md:w-12 text-white" />
              </div>
              <h2 className="text-base md:text-xl font-semibold text-white text-center">{eventTitle}</h2>
              <p className="text-slate-400 text-xs md:text-sm mt-1 md:mt-2 text-center">
                Professional Business Broadcast
              </p>
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

          <div className="mt-3 md:mt-6 bg-white rounded-lg p-4 md:p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-semibold text-slate-900">{eventTitle}</h1>
                <p className="text-slate-500 mt-1 text-sm md:text-base">{eventDescription}</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">Share Event</Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-6 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 h-10 md:h-9"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Helpful
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 h-10 md:h-9"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Ask Question
              </Button>
            </div>
          </div>
        </div>

        <div
          className={`
          ${showMobileChat ? "fixed inset-0 z-50 bg-white" : "hidden"} 
          lg:relative lg:block lg:w-96 lg:bg-white lg:border-l lg:border-slate-200
          flex flex-col
        `}
        >
          <div className="p-3 md:p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-base md:text-lg">Live Q&A</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                  <Eye className="h-3 w-3" />
                  {viewerCount}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden text-slate-600 hover:text-slate-900 p-2"
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
                <div key={msg.id} className="flex items-start gap-2 md:gap-3 p-2 md:p-3 bg-slate-50 rounded-lg">
                  <div
                    className={`w-9 h-9 md:w-10 md:h-10 rounded-full ${msg.color} flex items-center justify-center text-white text-xs md:text-sm font-medium flex-shrink-0`}
                  >
                    {msg.user
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 text-sm truncate">{msg.user}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">{msg.time}</span>
                    </div>
                    <p className="text-slate-600 text-sm mt-1 break-words">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex gap-2">
              <Input
                placeholder="Ask a question..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 h-11 md:h-10 text-base md:text-sm"
              />
              <Button size="icon" className="bg-blue-600 hover:bg-blue-700 h-11 w-11 md:h-10 md:w-10 flex-shrink-0">
                <Send className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
