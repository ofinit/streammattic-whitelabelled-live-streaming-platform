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
  Flame,
  Send,
  ArrowLeft,
  Eye,
  Radio,
  Music,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
}

const mockChatMessages = [
  { id: 1, user: "RockFan99", message: "THIS IS FIRE!", time: "9:45 PM", color: "bg-purple-500" },
  { id: 2, user: "MusicLover", message: "Best concert ever!", time: "9:45 PM", color: "bg-pink-500" },
  { id: 3, user: "BeatDropper", message: "Drop the bass!", time: "9:46 PM", color: "bg-cyan-500" },
  { id: 4, user: "NightOwl", message: "Vibes are immaculate", time: "9:46 PM", color: "bg-violet-500" },
  { id: 5, user: "PartyStarter", message: "Lets gooooo!", time: "9:47 PM", color: "bg-fuchsia-500" },
]

export function ConcertTemplate({ eventTitle = "Live Concert", eventDescription = "Feel the music" }: TemplateProps) {
  const [chatMessage, setChatMessage] = useState("")
  const [viewerCount] = useState(12847)
  const [showMobileChat, setShowMobileChat] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/50 via-black to-pink-900/50 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <header className="relative flex items-center justify-between px-3 py-2 md:px-4 md:py-3 bg-black/50 backdrop-blur-md border-b border-white/10 z-10">
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/admin/control-center">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 p-2 md:px-3">
              <ArrowLeft className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
          </Link>
          <span className="hidden sm:inline text-xs md:text-sm px-2 md:px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-bold">
            Template Preview
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Music className="h-5 w-5 text-pink-400" />
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-sm md:text-base">
            CONCERT
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden text-white/70 hover:text-white p-2"
          onClick={() => setShowMobileChat(!showMobileChat)}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </header>

      <div className="relative flex flex-col lg:flex-row h-[calc(100vh-49px)] md:h-[calc(100vh-57px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Player with neon effects */}
          <div className="relative aspect-video m-4 rounded-2xl overflow-hidden">
            {/* Neon border effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-2xl blur-sm opacity-75" />
            <div className="relative bg-black rounded-xl overflow-hidden h-full">
              {/* Live Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
                <span className="flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-black px-3 py-1.5 rounded-full animate-pulse">
                  <Radio className="h-3 w-3" />
                  LIVE
                </span>
                <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-white/20">
                  <Eye className="h-3 w-3" />
                  {viewerCount.toLocaleString()}
                </span>
              </div>

              {/* Video Placeholder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-black to-pink-900">
                {/* Animated rings */}
                <div className="relative">
                  <div className="absolute inset-0 w-40 h-40 rounded-full border-2 border-purple-500/30 animate-ping" />
                  <div className="absolute inset-2 w-36 h-36 rounded-full border-2 border-pink-500/40 animate-pulse" />
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/50">
                    <Music className="h-16 w-16 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mt-6 uppercase tracking-wider">
                  {eventTitle}
                </h2>
                <p className="text-purple-300 text-sm mt-2 tracking-widest uppercase">{eventDescription}</p>
              </div>

              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
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
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-black text-white uppercase">{eventTitle}</h1>
                  <p className="text-purple-300 mt-1">{eventDescription}</p>
                </div>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-full px-6">
                  Share
                </Button>
              </div>

              {/* Reactions */}
              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/10">
                <span className="text-purple-400 text-sm">Vibe check:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full"
                >
                  <Heart className="h-5 w-5 fill-current" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 rounded-full"
                >
                  <Flame className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-400 hover:text-purple-300 hover:bg-purple-400/10 rounded-full"
                >
                  <span className="text-xl">&#127928;</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-full"
                >
                  <span className="text-xl">&#127911;</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div
          className={`
          ${showMobileChat ? "fixed inset-0 z-50 bg-black/90 backdrop-blur-md" : "hidden"} 
          lg:relative lg:block lg:w-80 lg:bg-black/50 lg:backdrop-blur-md lg:border-l lg:border-white/10 
          flex flex-col
        `}
        >
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Live Chat
              </h3>
              <span className="text-xs text-purple-300 flex items-center gap-1 bg-purple-500/20 px-2 py-1 rounded-full">
                <Eye className="h-3 w-3" />
                {viewerCount.toLocaleString()}
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {mockChatMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full ${msg.color} flex items-center justify-center text-white text-xs font-bold shadow-lg`}
                  >
                    {msg.user.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-300 text-sm">{msg.user}</span>
                      <span className="text-xs text-white/40">{msg.time}</span>
                    </div>
                    <p className="text-white/80 text-sm">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full focus:border-purple-500"
              />
              <Button size="icon" className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
