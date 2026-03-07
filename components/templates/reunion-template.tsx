"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Users,
  Send,
  Heart,
  MessageCircle,
  Camera,
  Volume2,
  Settings,
  Maximize,
  PartyPopper,
  ImageIcon,
  ArrowLeft,
} from "lucide-react"

interface ReunionTemplateProps {
  title: string
  description: string
}

export function ReunionTemplate({ title, description }: ReunionTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ hearts: 234, cameras: 156 })
  const [showChat, setShowChat] = useState(false)

  const mockChat = [
    { id: 1, user: "Class_of_94", message: "Can't believe it's been 30 years!", time: "3:01 PM" },
    { id: 2, user: "JohnnyB", message: "Everyone looks great!", time: "3:02 PM" },
    { id: 3, user: "SarahM", message: "Remember Mr. Peterson's class?", time: "3:03 PM" },
    { id: 4, user: "BigMike", message: "Good times!", time: "3:04 PM" },
    { id: 5, user: "LisaK", message: "Miss you all!", time: "3:05 PM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-orange-950 to-slate-800 text-white">
      {/* Warm nostalgic background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,146,60,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(234,88,12,0.15),transparent_50%)]" />
      </div>

      {/* Warm accent line */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${showChat ? "hidden lg:flex" : "flex"}`}>
          {/* Header - responsive */}
          <header className="bg-slate-900/50 backdrop-blur-sm border-b border-orange-500/20 p-2 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base md:text-xl font-bold text-white truncate">{title}</h1>
                  <p className="text-orange-400 text-xs md:text-sm flex items-center gap-1">
                    <PartyPopper className="h-3 w-3" /> REUNION
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-1 md:gap-2 bg-red-900/50 border border-red-500/30 rounded-full px-2 md:px-4 py-1 md:py-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-200 text-xs md:text-sm font-medium">LIVE</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-orange-900/50 border border-orange-500/30 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-orange-400" />
                  <span className="text-orange-200 text-sm font-medium">145</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-orange-400 hover:bg-orange-500/20"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Video Player - responsive */}
          <div className="relative flex-1 bg-slate-900/50 m-2 md:m-4 rounded-lg overflow-hidden border border-orange-500/30">
            <div className="aspect-video bg-gradient-to-br from-slate-800 via-orange-950 to-slate-800 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="relative mb-3 md:mb-4">
                  <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mx-auto shadow-2xl rotate-3">
                    <Users className="h-10 w-10 md:h-14 md:w-14 text-white -rotate-3" />
                  </div>
                  <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-8 h-8 md:w-10 md:h-10 bg-amber-500 rounded-full flex items-center justify-center -rotate-12">
                    <Camera className="h-4 w-4 md:h-5 md:w-5 text-white rotate-12" />
                  </div>
                </div>
                <h2 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2">{title}</h2>
                <p className="text-orange-400 text-sm">Template: Reunion</p>
                <p className="text-amber-300 text-xs md:text-sm mt-1 md:mt-2">Class of 1994 - 30 Years</p>
              </div>
            </div>

            {/* Reunion banner - hidden on mobile */}
            <div className="hidden md:block absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              30 Year Reunion
            </div>

            {/* Controls - touch friendly */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-2 md:p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-orange-400 hover:bg-orange-500/20 h-10 w-10"
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-orange-400 hover:bg-orange-500/20 h-10 w-10"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-orange-400 hover:bg-orange-500/20 h-10 w-10"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Reactions - responsive */}
          <div className="p-2 md:p-4 bg-slate-900/50 border-t border-orange-500/20">
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
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20 bg-transparent h-10 min-w-[44px]"
                  onClick={() => setReactions((r) => ({ ...r, cameras: r.cameras + 1 }))}
                >
                  <ImageIcon className="h-4 w-4 mr-1" /> {reactions.cameras}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel - responsive with toggle */}
        <div
          className={`${showChat ? "flex" : "hidden"} lg:flex w-full lg:w-96 bg-slate-900/50 backdrop-blur-sm border-l border-orange-500/20 flex-col absolute lg:relative inset-0 lg:inset-auto top-0 z-20`}
        >
          <div className="p-3 md:p-4 border-b border-orange-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-orange-400" />
                Memory Lane
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-orange-400 text-xs md:text-sm flex items-center gap-1">
                  <Users className="h-4 w-4" /> 145
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden h-10 min-w-[44px] text-orange-400"
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
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 min-w-0 bg-orange-900/30 rounded-lg p-2 border border-orange-500/20">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs md:text-sm text-orange-300 truncate">{chat.user}</span>
                      <span className="text-slate-500 text-xs shrink-0">{chat.time}</span>
                    </div>
                    <p className="text-slate-300 text-xs md:text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-orange-500/20">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share a memory..."
                className="flex-1 bg-slate-800/50 border-orange-500/30 text-white placeholder:text-slate-500 focus:border-orange-500 h-10 text-sm"
              />
              <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white h-10 w-10 min-w-[44px]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
