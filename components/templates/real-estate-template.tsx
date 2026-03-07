"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Home,
  Users,
  Send,
  Heart,
  MessageCircle,
  MapPin,
  Volume2,
  Settings,
  Maximize,
  Bed,
  Bath,
  Square,
  Phone,
} from "lucide-react"

interface RealEstateTemplateProps {
  title: string
  description: string
}

export function RealEstateTemplate({ title, description }: RealEstateTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ hearts: 234, likes: 189 })

  const mockChat = [
    { id: 1, user: "HomeBuyer", message: "What's the asking price?", time: "11:01 AM" },
    { id: 2, user: "Investor123", message: "Great location!", time: "11:02 AM" },
    { id: 3, user: "FamilySearch", message: "Is there a backyard?", time: "11:03 AM" },
    { id: 4, user: "RealtyPro", message: "Beautiful property!", time: "11:04 AM" },
    { id: 5, user: "FirstTimeBuyer", message: "Schools nearby?", time: "11:05 AM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-teal-50 to-slate-100 text-slate-900">
      {/* Modern real estate background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.1),transparent_50%)]" />
      </div>

      {/* Teal accent line */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-sm border-b border-teal-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                  <p className="text-teal-600 text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> VIRTUAL TOUR
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-red-100 border border-red-200 rounded-full px-4 py-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-600 text-sm font-medium">LIVE</span>
                </div>
                <div className="flex items-center gap-2 bg-teal-100 border border-teal-200 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-teal-600" />
                  <span className="text-teal-600 text-sm font-medium">456</span>
                </div>
              </div>
            </div>
          </header>

          {/* Video Player */}
          <div className="relative flex-1 bg-white m-4 rounded-2xl overflow-hidden border border-teal-200 shadow-xl">
            <div className="aspect-video bg-gradient-to-br from-slate-700 via-slate-800 to-slate-700 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
                  <Home className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                <p className="text-teal-400">Template: Real Estate Tour</p>
              </div>
            </div>

            {/* Property details overlay */}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-teal-200 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-slate-700">
                  <Bed className="h-4 w-4 text-teal-500" />
                  <span>4 Beds</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700">
                  <Bath className="h-4 w-4 text-teal-500" />
                  <span>3 Baths</span>
                </div>
                <div className="flex items-center gap-1 text-slate-700">
                  <Square className="h-4 w-4 text-teal-500" />
                  <span>2,450 sqft</span>
                </div>
              </div>
            </div>

            {/* Price tag */}
            <div className="absolute top-4 right-4 bg-teal-600 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
              $749,000
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="text-white hover:text-teal-400 hover:bg-teal-500/20">
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-white hover:text-teal-400 hover:bg-teal-500/20">
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white hover:text-teal-400 hover:bg-teal-500/20">
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Actions */}
          <div className="p-4 bg-white/80 border-t border-teal-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <p className="text-slate-600 mt-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-teal-500" />
                  {description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="border-teal-400 text-teal-600 hover:bg-teal-50 bg-transparent">
                  <Phone className="h-4 w-4 mr-1" /> Contact Agent
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
        <div className="w-full lg:w-96 bg-white/80 backdrop-blur-sm border-l border-teal-200 flex flex-col">
          <div className="p-4 border-b border-teal-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-teal-500" />
                Questions
              </h3>
              <span className="text-teal-600 text-sm flex items-center gap-1">
                <Users className="h-4 w-4" /> 456
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {mockChat.map((chat) => (
                <div key={chat.id} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                    {chat.user[0]}
                  </div>
                  <div className="flex-1 bg-teal-50 rounded-lg p-2 border border-teal-100">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-teal-700">{chat.user}</span>
                      <span className="text-slate-400 text-xs">{chat.time}</span>
                    </div>
                    <p className="text-slate-700 text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-teal-200">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about this property..."
                className="flex-1 bg-white border-teal-200 text-slate-800 placeholder:text-slate-400 focus:border-teal-500"
              />
              <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
