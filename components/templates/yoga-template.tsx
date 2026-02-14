"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Flower2, Users, Send, Heart, MessageCircle, Volume2, Settings, Maximize, Sun, Wind } from "lucide-react"

interface YogaTemplateProps {
  title: string
  description: string
}

export function YogaTemplate({ title, description }: YogaTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ hearts: 189, lotus: 345 })

  const mockChat = [
    { id: 1, user: "Peaceful_Soul", message: "Namaste everyone!", time: "7:01 AM" },
    { id: 2, user: "ZenMaster", message: "So calming...", time: "7:02 AM" },
    { id: 3, user: "MindfulLiving", message: "Beautiful practice!", time: "7:03 AM" },
    { id: 4, user: "InnerPeace", message: "Feeling centered", time: "7:04 AM" },
    { id: 5, user: "BreathDeep", message: "Thank you for this", time: "7:05 AM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-green-50 to-purple-50 text-slate-800">
      {/* Calm peaceful background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(134,239,172,0.2),transparent_50%)]" />
      </div>

      {/* Lavender accent line */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-green-400 to-purple-400" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white/70 backdrop-blur-sm border-b border-purple-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-green-400 rounded-full flex items-center justify-center shadow-lg shadow-purple-300/30">
                  <Flower2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                  <p className="text-purple-600 text-sm flex items-center gap-1">
                    <Wind className="h-3 w-3" /> MINDFULNESS SESSION
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-purple-100 border border-purple-200 rounded-full px-4 py-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-purple-600 text-sm font-medium">LIVE</span>
                </div>
                <div className="flex items-center gap-2 bg-green-100 border border-green-200 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 text-sm font-medium">456</span>
                </div>
              </div>
            </div>
          </header>

          {/* Video Player */}
          <div className="relative flex-1 bg-white/70 m-4 rounded-3xl overflow-hidden border border-purple-200 shadow-xl">
            <div className="aspect-video bg-gradient-to-br from-purple-100 via-white to-green-100 flex items-center justify-center">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-28 h-28 bg-gradient-to-br from-purple-400 to-green-400 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                    <Flower2 className="h-14 w-14 text-white" />
                  </div>
                  <Sun className="absolute -top-4 -right-4 h-10 w-10 text-yellow-400 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-slate-700 mb-2">{title}</h2>
                <p className="text-purple-600">Template: Yoga/Meditation</p>
                <p className="text-green-600 text-sm mt-2">Breathe • Relax • Be Present</p>
              </div>
            </div>

            {/* Session type */}
            <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-400 to-green-400 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              Morning Flow
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-100 to-transparent p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-200"
                >
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-200"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-200"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Reactions */}
          <div className="p-4 bg-white/70 border-t border-purple-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <p className="text-slate-600 mt-1">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-pink-300 text-pink-500 hover:bg-pink-100 bg-transparent"
                  onClick={() => setReactions((r) => ({ ...r, hearts: r.hearts + 1 }))}
                >
                  <Heart className="h-4 w-4 mr-1" /> {reactions.hearts}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-500 hover:bg-purple-100 bg-transparent"
                  onClick={() => setReactions((r) => ({ ...r, lotus: r.lotus + 1 }))}
                >
                  <Flower2 className="h-4 w-4 mr-1" /> {reactions.lotus}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-full lg:w-96 bg-white/70 backdrop-blur-sm border-l border-purple-200 flex flex-col">
          <div className="p-4 border-b border-purple-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-purple-500" />
                Mindful Space
              </h3>
              <span className="text-green-600 text-sm flex items-center gap-1">
                <Users className="h-4 w-4" /> 456
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {mockChat.map((chat) => (
                <div key={chat.id} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-green-400 flex items-center justify-center text-white text-xs font-bold">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 bg-purple-50 rounded-2xl p-2 border border-purple-100">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-purple-600">{chat.user}</span>
                      <span className="text-slate-400 text-xs">{chat.time}</span>
                    </div>
                    <p className="text-slate-700 text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-purple-200">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your peace..."
                className="flex-1 bg-white border-purple-200 text-slate-800 placeholder:text-slate-400 focus:border-purple-400 rounded-full"
              />
              <Button className="bg-gradient-to-r from-purple-400 to-green-400 hover:from-purple-500 hover:to-green-500 text-white rounded-full">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
