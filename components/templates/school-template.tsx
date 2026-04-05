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
  GraduationCap,
  Star,
} from "lucide-react"
import Link from "next/link"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
}

const mockChatMessages = [
  { id: 1, user: "ProudParent", message: "Go team!", time: "10:30 AM", color: "bg-blue-500" },
  { id: 2, user: "Teacher_Mrs_K", message: "Great performance!", time: "10:31 AM", color: "bg-yellow-500" },
  { id: 3, user: "Student2024", message: "This is amazing!", time: "10:32 AM", color: "bg-green-500" },
  { id: 4, user: "SchoolDad", message: "So proud!", time: "10:33 AM", color: "bg-blue-600" },
  { id: 5, user: "AlumniMom", message: "Memories!", time: "10:34 AM", color: "bg-yellow-600" },
]

export function SchoolTemplate({
  eventTitle = "School Event",
  eventDescription = "Celebrating our students",
}: TemplateProps) {
  const [chatMessage, setChatMessage] = useState("")
  const [viewerCount] = useState(567)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-yellow-50 text-slate-800">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/admin/control-center">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <span className="text-sm px-3 py-1 bg-yellow-400 rounded-full text-blue-900 font-bold">Template Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-yellow-400" />
          <span className="font-bold text-white">School Event</span>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <div className="relative aspect-video m-4 rounded-2xl overflow-hidden shadow-xl border-4 border-blue-200">
            {/* Decorative stars */}
            <div className="absolute top-3 left-3 text-yellow-400 z-10">
              <Star className="h-6 w-6 fill-yellow-400" />
            </div>
            <div className="absolute top-3 right-3 text-yellow-400 z-10">
              <Star className="h-6 w-6 fill-yellow-400" />
            </div>

            <div className="bg-gradient-to-b from-blue-100 to-blue-200 h-full">
              {/* Live Badge */}
              <div className="absolute top-4 left-12 flex items-center gap-3 z-10">
                <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  <Radio className="h-3 w-3" />
                  LIVE
                </span>
                <span className="flex items-center gap-1.5 bg-white/90 text-blue-700 text-xs px-3 py-1 rounded-full shadow">
                  <Eye className="h-3 w-3" />
                  {viewerCount} viewers
                </span>
              </div>

              {/* Video Placeholder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg border-4 border-yellow-400">
                  <GraduationCap className="h-14 w-14 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-blue-800 mt-6">{eventTitle}</h2>
                <p className="text-blue-600 text-sm mt-2">{eventDescription}</p>
              </div>

              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-blue-900/50 to-transparent">
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
          </div>

          {/* Event Info */}
          <div className="px-4 pb-4">
            <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-blue-800">{eventTitle}</h1>
                  <p className="text-blue-600 mt-1">{eventDescription}</p>
                </div>
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold">Share</Button>
              </div>

              {/* Reactions */}
              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-blue-100">
                <span className="text-blue-500 text-sm">Cheer on:</span>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Heart className="h-5 w-5 fill-red-200" />
                </Button>
                <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                  <ThumbsUp className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50">
                  <Star className="h-5 w-5 fill-yellow-200" />
                </Button>
                <Button variant="ghost" size="sm" className="text-green-500 hover:text-green-600 hover:bg-green-50">
                  <span className="text-xl">&#127881;</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-full lg:w-80 bg-white border-l border-blue-100 flex flex-col shadow-lg">
          <div className="p-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-yellow-50">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-blue-800">Community Chat</h3>
              <span className="text-xs text-blue-500 flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-full">
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
                    className={`w-8 h-8 rounded-full ${msg.color} flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {msg.user.charAt(0)}
                  </div>
                  <div className="flex-1 bg-blue-50 rounded-xl rounded-tl-none p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-800 text-sm">{msg.user}</span>
                      <span className="text-xs text-blue-400">{msg.time}</span>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-blue-100 bg-gradient-to-r from-blue-50 to-yellow-50">
            <div className="flex gap-2">
              <Input
                placeholder="Send a message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="bg-white border-blue-200 text-blue-800 placeholder:text-blue-400 rounded-full"
              />
              <Button size="icon" className="bg-blue-600 hover:bg-blue-700 rounded-full">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
