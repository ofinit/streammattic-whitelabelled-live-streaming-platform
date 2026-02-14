"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Presentation,
  Users,
  Send,
  Heart,
  Hand,
  MessageCircle,
  BookOpen,
  Volume2,
  Settings,
  Maximize,
  FileText,
  Download,
} from "lucide-react"

interface WebinarTemplateProps {
  title: string
  description: string
}

export function WebinarTemplate({ title, description }: WebinarTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ hands: 234, hearts: 156 })

  const mockChat = [
    { id: 1, user: "Learner101", message: "Great explanation!", time: "3:15 PM" },
    { id: 2, user: "ProDev", message: "Can you show an example?", time: "3:16 PM" },
    { id: 3, user: "StudentMike", message: "This is so helpful!", time: "3:17 PM" },
    { id: 4, user: "TeamLead", message: "Sharing with my team", time: "3:18 PM" },
    { id: 5, user: "NewHire", message: "Taking notes!", time: "3:19 PM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 text-slate-900">
      {/* Clean professional background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.1),transparent_50%)]" />
      </div>

      {/* Blue accent line */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-sm border-b border-blue-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Presentation className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                  <p className="text-blue-600 text-sm flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> WEBINAR
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-red-100 border border-red-200 rounded-full px-4 py-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-600 text-sm font-medium">LIVE</span>
                </div>
                <div className="flex items-center gap-2 bg-blue-100 border border-blue-200 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600 text-sm font-medium">1,234</span>
                </div>
              </div>
            </div>
          </header>

          {/* Video Player */}
          <div className="relative flex-1 bg-white m-4 rounded-2xl overflow-hidden border border-blue-200 shadow-xl">
            <div className="aspect-video bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
                  <Presentation className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                <p className="text-blue-400">Template: Webinar/Training</p>
              </div>
            </div>

            {/* Session info */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-blue-200 rounded-xl p-3 shadow-lg">
              <p className="text-blue-600 text-xs font-medium">SESSION</p>
              <p className="text-slate-800 font-bold">Module 3 of 5</p>
            </div>

            {/* Resources button */}
            <div className="absolute top-4 right-4">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/90 border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <FileText className="h-4 w-4 mr-1" /> Resources
                <Download className="h-3 w-3 ml-2" />
              </Button>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="text-white hover:text-blue-400 hover:bg-blue-500/20">
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-white hover:text-blue-400 hover:bg-blue-500/20">
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white hover:text-blue-400 hover:bg-blue-500/20">
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Reactions */}
          <div className="p-4 bg-white/80 border-t border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <p className="text-slate-600 mt-1">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-400 text-yellow-600 hover:bg-yellow-50 bg-transparent"
                  onClick={() => setReactions((r) => ({ ...r, hands: r.hands + 1 }))}
                >
                  <Hand className="h-4 w-4 mr-1" /> {reactions.hands}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-pink-400 text-pink-600 hover:bg-pink-50 bg-transparent"
                  onClick={() => setReactions((r) => ({ ...r, hearts: r.hearts + 1 }))}
                >
                  <Heart className="h-4 w-4 mr-1" /> {reactions.hearts}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-full lg:w-96 bg-white/80 backdrop-blur-sm border-l border-blue-200 flex flex-col">
          <div className="p-4 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                Q&A Chat
              </h3>
              <span className="text-blue-600 text-sm flex items-center gap-1">
                <Users className="h-4 w-4" /> 1,234
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {mockChat.map((chat) => (
                <div key={chat.id} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 bg-blue-50 rounded-lg p-2 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-blue-700">{chat.user}</span>
                      <span className="text-slate-400 text-xs">{chat.time}</span>
                    </div>
                    <p className="text-slate-700 text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-blue-200">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 bg-white border-blue-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500"
              />
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
