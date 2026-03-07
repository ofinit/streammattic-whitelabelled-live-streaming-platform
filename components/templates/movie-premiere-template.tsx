"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Film,
  Users,
  Send,
  Heart,
  Star,
  MessageCircle,
  Clapperboard,
  Volume2,
  Settings,
  Maximize,
  Sparkles,
} from "lucide-react"

interface MoviePremiereTemplateProps {
  title: string
  description: string
}

export function MoviePremiereTemplate({ title, description }: MoviePremiereTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ hearts: 567, stars: 892 })

  const mockChat = [
    { id: 1, user: "CinemaLover", message: "So excited for this!", time: "8:01 PM" },
    { id: 2, user: "FilmBuff", message: "Red carpet looks amazing", time: "8:02 PM" },
    { id: 3, user: "MovieFan2024", message: "Can't wait to see the cast!", time: "8:03 PM" },
    { id: 4, user: "HollywoodNews", message: "Historic premiere!", time: "8:04 PM" },
    { id: 5, user: "StarGazer", message: "The director is here!", time: "8:05 PM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-red-950 to-gray-950 text-white">
      {/* Cinematic background with spotlight effect */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(234,179,8,0.15),transparent_50%)]" />
      </div>

      {/* Gold decorative lines */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-gray-900/50 backdrop-blur-sm border-b border-yellow-500/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/30">
                  <Clapperboard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-wide">{title}</h1>
                  <p className="text-yellow-400 text-sm flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> WORLD PREMIERE
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-red-900/50 border border-red-500/30 rounded-full px-4 py-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-200 text-sm font-medium">LIVE</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800/50 border border-yellow-500/30 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-200 text-sm font-medium">45.2K</span>
                </div>
              </div>
            </div>
          </header>

          {/* Video Player */}
          <div className="relative flex-1 bg-black m-4 rounded-lg overflow-hidden border-2 border-yellow-500/30 shadow-2xl shadow-red-500/20">
            {/* Film strip decoration */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gray-900 flex items-center gap-2 px-2">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-4 h-4 bg-gray-800 rounded-sm" />
              ))}
            </div>
            <div className="absolute bottom-12 left-0 right-0 h-8 bg-gray-900 flex items-center gap-2 px-2">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-4 h-4 bg-gray-800 rounded-sm" />
              ))}
            </div>

            <div className="aspect-video bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 flex items-center justify-center pt-8 pb-20">
              <div className="text-center">
                <div className="relative mb-4">
                  <Film className="h-20 w-20 text-yellow-500 mx-auto" />
                  <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-pulse" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 tracking-wider">{title}</h2>
                <p className="text-yellow-400">Template: Movie Premiere</p>
                <div className="flex items-center justify-center gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
              </div>
            </div>

            {/* Red carpet badge */}
            <div className="absolute top-12 right-4 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              RED CARPET
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="text-white hover:text-yellow-400 hover:bg-yellow-500/20">
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-yellow-400 hover:bg-yellow-500/20"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-yellow-400 hover:bg-yellow-500/20"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Reactions */}
          <div className="p-4 bg-gray-900/50 border-t border-yellow-500/20">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
                <p className="text-gray-400 mt-1">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/20 bg-transparent"
                  onClick={() => setReactions((r) => ({ ...r, hearts: r.hearts + 1 }))}
                >
                  <Heart className="h-4 w-4 mr-1" /> {reactions.hearts}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 bg-transparent"
                  onClick={() => setReactions((r) => ({ ...r, stars: r.stars + 1 }))}
                >
                  <Star className="h-4 w-4 mr-1" /> {reactions.stars}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-full lg:w-96 bg-gray-900/50 backdrop-blur-sm border-l border-yellow-500/20 flex flex-col">
          <div className="p-4 border-b border-yellow-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-yellow-400" />
                Premiere Chat
              </h3>
              <span className="text-yellow-400 text-sm flex items-center gap-1">
                <Users className="h-4 w-4" /> 45,234
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {mockChat.map((chat) => (
                <div key={chat.id} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-yellow-500 flex items-center justify-center text-white text-xs font-bold">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 bg-gray-800/50 rounded-lg p-2 border border-yellow-500/10">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-yellow-300">{chat.user}</span>
                      <span className="text-gray-500 text-xs">{chat.time}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-yellow-500/20">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your excitement..."
                className="flex-1 bg-gray-800/50 border-yellow-500/30 text-white placeholder:text-gray-500 focus:border-yellow-500"
              />
              <Button className="bg-gradient-to-r from-red-600 to-yellow-500 hover:from-red-700 hover:to-yellow-600 text-white">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
