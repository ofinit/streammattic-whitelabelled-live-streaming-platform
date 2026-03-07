"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  GraduationCap,
  Users,
  Send,
  Heart,
  MessageCircle,
  Award,
  Volume2,
  Settings,
  Maximize,
  Star,
  BookOpen,
  ArrowLeft,
} from "lucide-react"

interface GraduationTemplateProps {
  title: string
  description: string
}

export function GraduationTemplate({ title, description }: GraduationTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ hearts: 567, stars: 892 })
  const [showChat, setShowChat] = useState(false)

  const mockChat = [
    { id: 1, user: "ProudParent", message: "Congratulations, graduate!", time: "10:01 AM" },
    { id: 2, user: "Classmate2024", message: "We did it!", time: "10:02 AM" },
    { id: 3, user: "Professor_J", message: "Well deserved!", time: "10:03 AM" },
    { id: 4, user: "GrandpaJoe", message: "So proud of you!", time: "10:04 AM" },
    { id: 5, user: "BestFriendEver", message: "To new beginnings!", time: "10:05 AM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Academic formal background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(234,179,8,0.15),transparent_50%)]" />
      </div>

      {/* Gold and blue ribbon */}
      <div className="fixed top-0 left-0 w-full h-1 md:h-2 bg-gradient-to-r from-blue-600 via-yellow-500 to-blue-600" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${showChat ? "hidden lg:flex" : "flex"}`}>
          {/* Header - responsive */}
          <header className="bg-slate-900/50 backdrop-blur-sm border-b border-blue-500/20 p-2 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base md:text-xl font-bold text-white truncate">{title}</h1>
                  <p className="text-yellow-400 text-xs md:text-sm flex items-center gap-1">
                    <Award className="h-3 w-3" /> GRADUATION
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1 md:gap-2 bg-red-900/50 border border-red-500/30 rounded-full px-2 md:px-4 py-1 md:py-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-200 text-xs md:text-sm font-medium">LIVE</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-blue-900/50 border border-blue-500/30 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-200 text-sm font-medium">2,456</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-yellow-400 hover:bg-yellow-500/20"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Video Player - responsive */}
          <div className="relative flex-1 bg-slate-900/50 m-2 md:m-4 rounded-lg overflow-hidden border border-yellow-500/30">
            <div className="aspect-video bg-gradient-to-br from-slate-800 via-blue-950 to-slate-800 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="relative mb-3 md:mb-4">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-600 to-yellow-500 rounded-lg flex items-center justify-center mx-auto shadow-2xl rotate-3">
                    <GraduationCap className="h-12 w-12 md:h-16 md:w-16 text-white -rotate-3" />
                  </div>
                  <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-8 h-8 md:w-12 md:h-12 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                    <Star className="h-4 w-4 md:h-6 md:w-6 text-white" />
                  </div>
                </div>
                <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">{title}</h2>
                <p className="text-yellow-400 text-sm">Template: Graduation</p>
                <p className="text-blue-300 text-xs md:text-sm mt-1 md:mt-2 flex items-center justify-center gap-2">
                  <BookOpen className="h-4 w-4" /> Class of 2024
                </p>
              </div>
            </div>

            {/* Achievement banner - hidden on mobile */}
            <div className="hidden md:block absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              Commencement Day
            </div>

            {/* Controls - touch friendly */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-2 md:p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-yellow-400 hover:bg-yellow-500/20 h-10 w-10"
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-yellow-400 hover:bg-yellow-500/20 h-10 w-10"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-yellow-400 hover:bg-yellow-500/20 h-10 w-10"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Reactions - responsive */}
          <div className="p-2 md:p-4 bg-slate-900/50 border-t border-blue-500/20">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-white truncate">{title}</h2>
                <p className="text-slate-400 mt-1 text-sm md:text-base">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-pink-500/50 text-pink-400 hover:bg-pink-500/20 bg-transparent h-10 min-w-[44px]"
                  onClick={() => setReactions((r) => ({ ...r, hearts: r.hearts + 1 }))}
                >
                  <Heart className="h-4 w-4 mr-1" /> {reactions.hearts}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 bg-transparent h-10 min-w-[44px]"
                  onClick={() => setReactions((r) => ({ ...r, stars: r.stars + 1 }))}
                >
                  <Star className="h-4 w-4 mr-1" /> {reactions.stars}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel - responsive with toggle */}
        <div
          className={`${showChat ? "flex" : "hidden"} lg:flex w-full lg:w-96 bg-slate-900/50 backdrop-blur-sm border-l border-blue-500/20 flex-col absolute lg:relative inset-0 lg:inset-auto top-0 z-20`}
        >
          <div className="p-3 md:p-4 border-b border-blue-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
                Congratulations
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-blue-400 text-xs md:text-sm flex items-center gap-1">
                  <Users className="h-4 w-4" /> 2,456
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-yellow-400"
                  onClick={() => setShowChat(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-3 md:p-4">
            <div className="space-y-3">
              {mockChat.map((chat) => (
                <div key={chat.id} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-yellow-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 min-w-0 bg-slate-800/50 rounded-lg p-2 border border-yellow-500/10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs md:text-sm text-yellow-300 truncate">{chat.user}</span>
                      <span className="text-slate-500 text-xs shrink-0">{chat.time}</span>
                    </div>
                    <p className="text-slate-300 text-xs md:text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-blue-500/20">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Congratulations..."
                className="flex-1 bg-slate-800/50 border-blue-500/30 text-white placeholder:text-slate-500 focus:border-yellow-500 h-10 text-sm"
              />
              <Button className="bg-gradient-to-r from-blue-600 to-yellow-500 hover:from-blue-700 hover:to-yellow-600 text-white h-10 w-10 min-w-[44px]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
