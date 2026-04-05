"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Volume2, Settings, Maximize2, ThumbsUp, MessageSquare, Send, ArrowLeft, Eye, Radio, Flag } from "lucide-react"
import Link from "next/link"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
}

const mockChatMessages = [
  { id: 1, user: "Citizen_V", message: "Great speech!", time: "3:30 PM", color: "bg-blue-700" },
  { id: 2, user: "VoterFirst", message: "Important message", time: "3:31 PM", color: "bg-red-700" },
  { id: 3, user: "DemocracyNow", message: "Democracy in action", time: "3:32 PM", color: "bg-slate-600" },
  { id: 4, user: "CivicDuty", message: "Every vote counts!", time: "3:33 PM", color: "bg-blue-600" },
  { id: 5, user: "PublicServ", message: "Thank you for this", time: "3:34 PM", color: "bg-red-600" },
]

export function PoliticalTemplate({
  eventTitle = "Political Address",
  eventDescription = "Live broadcast for citizens",
}: TemplateProps) {
  const [chatMessage, setChatMessage] = useState("")
  const [viewerCount] = useState(28456)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Header with official styling */}
      <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-900 via-slate-800 to-red-900 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/admin/control-center">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <span className="text-sm px-3 py-1 bg-white/20 rounded text-white font-medium">Template Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-white" />
          <span className="font-semibold text-white">Political Event</span>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col p-6">
          {/* Video Player with formal frame */}
          <div className="relative aspect-video rounded-none overflow-hidden shadow-2xl border-4 border-slate-300">
            {/* Official seal overlay */}
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center z-10 border-2 border-white/30">
              <Flag className="h-8 w-8 text-white" />
            </div>

            <div className="bg-gradient-to-b from-blue-900 to-slate-900 h-full">
              {/* Live Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
                <span className="flex items-center gap-1.5 bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded">
                  <Radio className="h-3 w-3" />
                  LIVE BROADCAST
                </span>
                <span className="flex items-center gap-1.5 bg-slate-800 text-white text-xs px-3 py-1.5 rounded">
                  <Eye className="h-3 w-3" />
                  {viewerCount.toLocaleString()} viewers
                </span>
              </div>

              {/* Video Placeholder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-b from-slate-700 to-slate-800 flex items-center justify-center shadow-lg border-4 border-slate-600">
                  <Flag className="h-14 w-14 text-slate-300" />
                </div>
                <h2 className="text-2xl font-bold text-white mt-6 uppercase tracking-wide">{eventTitle}</h2>
                <p className="text-slate-400 text-sm mt-2">{eventDescription}</p>
                <div className="mt-4 px-4 py-2 bg-slate-800/80 rounded border border-slate-600">
                  <span className="text-slate-300 text-xs uppercase tracking-wider">Official Broadcast</span>
                </div>
              </div>

              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
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
          <div className="mt-6 bg-white rounded-lg p-6 shadow-md border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{eventTitle}</h1>
                <p className="text-slate-600 mt-1">{eventDescription}</p>
              </div>
              <Button className="bg-blue-800 hover:bg-blue-900 text-white">Share Broadcast</Button>
            </div>

            {/* Engagement */}
            <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-200">
              <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-800 hover:bg-blue-50">
                <ThumbsUp className="h-4 w-4 mr-2" />
                Support
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800 hover:bg-slate-100">
                <MessageSquare className="h-4 w-4 mr-2" />
                Comment
              </Button>
              <Button variant="ghost" size="sm" className="text-red-700 hover:text-red-800 hover:bg-red-50">
                <Flag className="h-4 w-4 mr-2" />
                Important
              </Button>
            </div>
          </div>
        </div>

        {/* Public Forum Sidebar */}
        <div className="w-full lg:w-96 bg-white border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-red-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Public Forum</h3>
              <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-200 px-2 py-1 rounded">
                <Eye className="h-3 w-3" />
                {viewerCount.toLocaleString()}
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {mockChatMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div
                    className={`w-10 h-10 rounded-full ${msg.color} flex items-center justify-center text-white text-sm font-medium`}
                  >
                    {msg.user.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 text-sm">{msg.user}</span>
                      <span className="text-xs text-slate-400">{msg.time}</span>
                    </div>
                    <p className="text-slate-600 text-sm mt-1">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex gap-2">
              <Input
                placeholder="Share your thoughts..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
              />
              <Button size="icon" className="bg-blue-800 hover:bg-blue-900">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
