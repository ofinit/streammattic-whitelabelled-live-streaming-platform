"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Mic,
  Users,
  Send,
  Heart,
  ThumbsUp,
  MessageCircle,
  Headphones,
  Radio,
  Volume2,
  Settings,
  Maximize,
} from "lucide-react"

interface PodcastTemplateProps {
  title: string
  description: string
}

export function PodcastTemplate({ title, description }: PodcastTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ hearts: 145, likes: 312 })

  const mockChat = [
    { id: 1, user: "PodcastFan", message: "Great topic today!", time: "2:34 PM" },
    { id: 2, user: "AudioLover", message: "Love this show!", time: "2:35 PM" },
    { id: 3, user: "TalkShowJunkie", message: "Interesting perspective", time: "2:36 PM" },
    { id: 4, user: "RadioHead", message: "Can you discuss AI next?", time: "2:37 PM" },
    { id: 5, user: "ListenerOne", message: "First time tuning in!", time: "2:38 PM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-orange-950 to-red-950 text-white">
      {/* Warm ambient background */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,146,60,0.3),transparent_70%)]" />
      </div>

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-amber-900/30 backdrop-blur-sm border-b border-amber-500/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Mic className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{title}</h1>
                  <p className="text-amber-400 text-sm flex items-center gap-1">
                    <Radio className="h-3 w-3" /> ON AIR
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-amber-900/50 border border-amber-500/30 rounded-full px-4 py-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-amber-200 text-sm font-medium">LIVE</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-900/50 border border-amber-500/30 rounded-full px-4 py-1.5">
                  <Headphones className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-200 text-sm font-medium">8,234</span>
                </div>
              </div>
            </div>
          </header>

          {/* Video/Audio Player */}
          <div className="relative flex-1 bg-gradient-to-br from-amber-900/20 to-orange-900/20 m-4 rounded-2xl overflow-hidden border border-amber-500/20">
            <div className="aspect-video bg-gradient-to-br from-amber-900/50 via-orange-900/30 to-red-900/50 flex items-center justify-center">
              <div className="text-center">
                {/* Sound wave animation */}
                <div className="flex items-center justify-center gap-1 mb-6">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 bg-gradient-to-t from-amber-500 to-orange-400 rounded-full animate-pulse"
                      style={{
                        height: `${20 + Math.random() * 40}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: "0.8s",
                      }}
                    />
                  ))}
                </div>
                <div className="w-32 h-32 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-amber-500/30">
                  <Mic className="h-16 w-16 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                <p className="text-amber-400">Template: Podcast/Talk Show</p>
              </div>
            </div>

            {/* Episode info overlay */}
            <div className="absolute top-4 left-4 bg-amber-900/80 backdrop-blur-sm border border-amber-500/30 rounded-xl p-3">
              <p className="text-amber-200 text-sm font-medium">Episode 47</p>
              <p className="text-amber-400 text-xs">Season 3</p>
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-950 to-transparent p-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="text-white hover:text-amber-400 hover:bg-amber-500/20">
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-white hover:text-amber-400 hover:bg-amber-500/20">
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white hover:text-amber-400 hover:bg-amber-500/20">
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Reactions */}
          <div className="p-4 bg-amber-900/30 border-t border-amber-500/20">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <p className="text-amber-200/70 mt-1">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20 bg-transparent"
                  onClick={() => setReactions((r) => ({ ...r, hearts: r.hearts + 1 }))}
                >
                  <Heart className="h-4 w-4 mr-1" /> {reactions.hearts}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20 bg-transparent"
                  onClick={() => setReactions((r) => ({ ...r, likes: r.likes + 1 }))}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" /> {reactions.likes}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-full lg:w-96 bg-amber-900/30 backdrop-blur-sm border-l border-amber-500/20 flex flex-col">
          <div className="p-4 border-b border-amber-500/20">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-amber-400" />
                Live Chat
              </h3>
              <span className="text-amber-400 text-sm flex items-center gap-1">
                <Users className="h-4 w-4" /> 8,234
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {mockChat.map((chat) => (
                <div key={chat.id} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 bg-amber-900/50 rounded-xl p-2 border border-amber-500/10">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-amber-300">{chat.user}</span>
                      <span className="text-amber-500/50 text-xs">{chat.time}</span>
                    </div>
                    <p className="text-amber-100 text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-amber-500/20">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Join the conversation..."
                className="flex-1 bg-amber-900/50 border-amber-500/30 text-white placeholder:text-amber-500/50 focus:border-amber-500"
              />
              <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
