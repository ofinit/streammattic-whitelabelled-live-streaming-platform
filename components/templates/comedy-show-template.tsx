"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Laugh,
  Users,
  Send,
  Heart,
  MessageCircle,
  Mic,
  Sparkles,
  Volume2,
  Settings,
  Maximize,
  SmilePlus,
} from "lucide-react"

interface ComedyShowTemplateProps {
  title: string
  description: string
}

export function ComedyShowTemplate({ title, description }: ComedyShowTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ laughs: 892, hearts: 456 })

  const mockChat = [
    { id: 1, user: "LOLFan", message: "HAHAHA!", time: "10:15 PM" },
    { id: 2, user: "ComedyKing", message: "This is gold!", time: "10:16 PM" },
    { id: 3, user: "Jokester", message: "I can't breathe!", time: "10:17 PM" },
    { id: 4, user: "StandUpFan", message: "Best show ever!", time: "10:18 PM" },
    { id: 5, user: "LaughTrack", message: "My stomach hurts!", time: "10:19 PM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white">
      {/* Stage spotlight effect */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,rgba(168,85,247,0.3),transparent_50%)]" />
        <div className="absolute bottom-0 left-1/4 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(251,146,60,0.15),transparent_70%)]" />
      </div>

      {/* Brick wall texture overlay */}
      <div className="fixed inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 20px,
            rgba(255,255,255,0.1) 20px,
            rgba(255,255,255,0.1) 22px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 40px,
            rgba(255,255,255,0.1) 40px,
            rgba(255,255,255,0.1) 42px
          )`,
          }}
        />
      </div>

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-gray-900/50 backdrop-blur-sm border-b border-purple-500/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Laugh className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{title}</h1>
                  <p className="text-purple-400 text-sm flex items-center gap-1">
                    <Mic className="h-3 w-3" /> LIVE COMEDY
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-purple-900/50 border border-purple-500/30 rounded-full px-4 py-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-purple-200 text-sm font-medium">LIVE</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800/50 border border-orange-500/30 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-orange-400" />
                  <span className="text-orange-200 text-sm font-medium">5,672</span>
                </div>
              </div>
            </div>
          </header>

          {/* Video Player - Stage */}
          <div className="relative flex-1 bg-gray-900 m-4 rounded-lg overflow-hidden border border-purple-500/30">
            {/* Stage lighting effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-orange-500/10" />

            <div className="aspect-video bg-gradient-to-b from-gray-800 via-gray-900 to-black flex items-center justify-center">
              <div className="text-center">
                {/* Spotlight circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-80 h-80 rounded-full bg-gradient-to-b from-yellow-500/20 to-transparent blur-3xl" />
                </div>

                <div className="relative z-10">
                  <div className="relative mb-4">
                    <Mic className="h-20 w-20 text-purple-400 mx-auto" />
                    <Sparkles className="absolute -top-2 right-0 h-8 w-8 text-yellow-400 animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
                  <p className="text-purple-400">Template: Comedy Show</p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <SmilePlus className="h-6 w-6 text-yellow-400" />
                    <span className="text-yellow-300">Get Ready to Laugh!</span>
                    <SmilePlus className="h-6 w-6 text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Comedy club badge */}
            <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold">
              COMEDY NIGHT
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="text-white hover:text-purple-400 hover:bg-purple-500/20">
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-purple-400 hover:bg-purple-500/20"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-purple-400 hover:bg-purple-500/20"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Reactions */}
          <div className="p-4 bg-gray-900/50 border-t border-purple-500/20">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <p className="text-gray-400 mt-1">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 bg-transparent"
                  onClick={() => setReactions((r) => ({ ...r, laughs: r.laughs + 1 }))}
                >
                  <Laugh className="h-4 w-4 mr-1" /> {reactions.laughs}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-pink-500/50 text-pink-400 hover:bg-pink-500/20 bg-transparent"
                  onClick={() => setReactions((r) => ({ ...r, hearts: r.hearts + 1 }))}
                >
                  <Heart className="h-4 w-4 mr-1" /> {reactions.hearts}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-full lg:w-96 bg-gray-900/50 backdrop-blur-sm border-l border-purple-500/20 flex flex-col">
          <div className="p-4 border-b border-purple-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-purple-400" />
                Audience Chat
              </h3>
              <span className="text-orange-400 text-sm flex items-center gap-1">
                <Users className="h-4 w-4" /> 5,672
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {mockChat.map((chat) => (
                <div key={chat.id} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 bg-gray-800/50 rounded-lg p-2 border border-purple-500/10">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-purple-300">{chat.user}</span>
                      <span className="text-gray-500 text-xs">{chat.time}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-purple-500/20">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share a laugh..."
                className="flex-1 bg-gray-800/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500"
              />
              <Button className="bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
