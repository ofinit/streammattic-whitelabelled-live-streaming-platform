"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dumbbell,
  Users,
  Send,
  Heart,
  MessageCircle,
  Flame,
  Volume2,
  Settings,
  Maximize,
  Zap,
  Timer,
} from "lucide-react"

interface FitnessTemplateProps {
  title: string
  description: string
}

export function FitnessTemplate({ title, description }: FitnessTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ hearts: 234, flames: 567 })

  const mockChat = [
    { id: 1, user: "FitLife", message: "Let's go! Great energy!", time: "6:01 AM" },
    { id: 2, user: "GymRat", message: "Feeling the burn!", time: "6:02 AM" },
    { id: 3, user: "HealthyMe", message: "Best workout class!", time: "6:03 AM" },
    { id: 4, user: "Cardio_Queen", message: "Keep pushing!", time: "6:04 AM" },
    { id: 5, user: "StrongTogether", message: "You got this!", time: "6:05 AM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-orange-950 to-gray-950 text-white">
      {/* Energetic fitness background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(20,184,166,0.15),transparent_50%)]" />
      </div>

      {/* Orange/teal accent line */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-teal-500 to-orange-500" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-gray-900/50 backdrop-blur-sm border-b border-orange-500/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{title}</h1>
                  <p className="text-orange-400 text-sm flex items-center gap-1">
                    <Flame className="h-3 w-3" /> LIVE WORKOUT
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-red-900/50 border border-red-500/30 rounded-full px-4 py-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-200 text-sm font-medium">LIVE</span>
                </div>
                <div className="flex items-center gap-2 bg-orange-900/50 border border-orange-500/30 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-orange-400" />
                  <span className="text-orange-200 text-sm font-medium">1,234</span>
                </div>
              </div>
            </div>
          </header>

          {/* Video Player */}
          <div className="relative flex-1 bg-gray-900/50 m-4 rounded-xl overflow-hidden border border-orange-500/30">
            <div className="aspect-video bg-gradient-to-br from-gray-900 via-orange-950 to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-28 h-28 bg-gradient-to-br from-orange-500 to-teal-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                    <Dumbbell className="h-14 w-14 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <Flame className="h-5 w-5 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                <p className="text-orange-400">Template: Fitness/Workout</p>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="bg-gray-800/50 border border-orange-500/30 rounded-lg px-4 py-2">
                    <p className="text-orange-400 text-xs">CALORIES</p>
                    <p className="text-white font-bold text-lg">450</p>
                  </div>
                  <div className="bg-gray-800/50 border border-teal-500/30 rounded-lg px-4 py-2">
                    <p className="text-teal-400 text-xs">DURATION</p>
                    <p className="text-white font-bold text-lg">45:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Workout info */}
            <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-teal-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
              <Zap className="h-4 w-4" /> HIIT Session
            </div>

            {/* Timer */}
            <div className="absolute top-4 right-4 bg-gray-900/80 border border-orange-500/30 rounded-xl px-4 py-2">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-orange-400" />
                <span className="text-white font-mono font-bold">32:15</span>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent p-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="text-white hover:text-orange-400 hover:bg-orange-500/20">
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-orange-400 hover:bg-orange-500/20"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-orange-400 hover:bg-orange-500/20"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Reactions */}
          <div className="p-4 bg-gray-900/50 border-t border-orange-500/20">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <p className="text-gray-400 mt-1">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-pink-500/50 text-pink-400 hover:bg-pink-500/20 bg-transparent"
                  onClick={() => setReactions((r) => ({ ...r, hearts: r.hearts + 1 }))}
                >
                  <Heart className="h-4 w-4 mr-1" /> {reactions.hearts}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20 bg-transparent"
                  onClick={() => setReactions((r) => ({ ...r, flames: r.flames + 1 }))}
                >
                  <Flame className="h-4 w-4 mr-1" /> {reactions.flames}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-full lg:w-96 bg-gray-900/50 backdrop-blur-sm border-l border-orange-500/20 flex flex-col">
          <div className="p-4 border-b border-orange-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-orange-400" />
                Workout Chat
              </h3>
              <span className="text-teal-400 text-sm flex items-center gap-1">
                <Users className="h-4 w-4" /> 1,234
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {mockChat.map((chat) => (
                <div key={chat.id} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 bg-orange-900/30 rounded-lg p-2 border border-orange-500/20">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-orange-300">{chat.user}</span>
                      <span className="text-gray-500 text-xs">{chat.time}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-orange-500/20">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Motivate the team..."
                className="flex-1 bg-gray-800/50 border-orange-500/30 text-white placeholder:text-gray-500 focus:border-orange-500"
              />
              <Button className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
