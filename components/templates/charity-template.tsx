"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Heart,
  Users,
  Send,
  MessageCircle,
  HandHeart,
  Volume2,
  Settings,
  Maximize,
  DollarSign,
  Target,
} from "lucide-react"

interface CharityTemplateProps {
  title: string
  description: string
}

export function CharityTemplate({ title, description }: CharityTemplateProps) {
  const [message, setMessage] = useState("")
  const [reactions, setReactions] = useState({ hearts: 567, donations: 234 })
  const [raised, setRaised] = useState(45750)
  const goal = 100000

  const mockChat = [
    { id: 1, user: "GenerousHeart", message: "Happy to help!", time: "4:01 PM", donation: "$100" },
    { id: 2, user: "KindSoul", message: "Great cause!", time: "4:02 PM" },
    { id: 3, user: "Helper123", message: "Donated!", time: "4:03 PM", donation: "$50" },
    { id: 4, user: "CommunityFirst", message: "Every bit helps!", time: "4:04 PM" },
    { id: 5, user: "GivingBack", message: "Thank you for organizing this!", time: "4:05 PM" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-rose-50 text-slate-800">
      {/* Warm hopeful background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,113,133,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(251,146,60,0.15),transparent_50%)]" />
      </div>

      {/* Rose accent line */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 via-orange-400 to-rose-400" />

      <div className="relative flex flex-col lg:flex-row min-h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-sm border-b border-rose-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-300/30">
                  <HandHeart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                  <p className="text-rose-600 text-sm flex items-center gap-1">
                    <Heart className="h-3 w-3" /> CHARITY FUNDRAISER
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-rose-100 border border-rose-200 rounded-full px-4 py-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-rose-600 text-sm font-medium">LIVE</span>
                </div>
                <div className="flex items-center gap-2 bg-orange-100 border border-orange-200 rounded-full px-4 py-1.5">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-600 text-sm font-medium">2,345</span>
                </div>
              </div>
            </div>
          </header>

          {/* Video Player */}
          <div className="relative flex-1 bg-white/80 m-4 rounded-2xl overflow-hidden border border-rose-200 shadow-xl">
            <div className="aspect-video bg-gradient-to-br from-rose-100 via-white to-orange-100 flex items-center justify-center">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-28 h-28 bg-gradient-to-br from-rose-500 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                    <HandHeart className="h-14 w-14 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-700 mb-2">{title}</h2>
                <p className="text-rose-600">Template: Charity/Fundraiser</p>

                {/* Progress bar */}
                <div className="max-w-md mx-auto mt-6 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-rose-600 font-bold text-lg">${raised.toLocaleString()}</span>
                    <span className="text-slate-500 text-sm">of ${goal.toLocaleString()} goal</span>
                  </div>
                  <div className="h-4 bg-rose-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${(raised / goal) * 100}%` }}
                    />
                  </div>
                  <p className="text-slate-500 text-sm mt-2">{Math.round((raised / goal) * 100)}% funded</p>
                </div>
              </div>
            </div>

            {/* Donation counter */}
            <div className="absolute top-4 left-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2">
              <Target className="h-4 w-4" /> Fundraiser Live
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-rose-100 to-transparent p-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="text-rose-600 hover:text-rose-700 hover:bg-rose-200">
                  <Volume2 className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-rose-600 hover:text-rose-700 hover:bg-rose-200">
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-rose-600 hover:text-rose-700 hover:bg-rose-200">
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info & Donate */}
          <div className="p-4 bg-white/80 border-t border-rose-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <p className="text-slate-600 mt-1">{description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-bold"
                  onClick={() => setRaised((r) => r + 25)}
                >
                  <DollarSign className="h-4 w-4 mr-1" /> Donate Now
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-rose-300 text-rose-500 hover:bg-rose-100 bg-transparent"
                  onClick={() => setReactions((r) => ({ ...r, hearts: r.hearts + 1 }))}
                >
                  <Heart className="h-4 w-4 mr-1" /> {reactions.hearts}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-full lg:w-96 bg-white/80 backdrop-blur-sm border-l border-rose-200 flex flex-col">
          <div className="p-4 border-b border-rose-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-rose-500" />
                Donor Messages
              </h3>
              <span className="text-orange-600 text-sm flex items-center gap-1">
                <Users className="h-4 w-4" /> 2,345
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {mockChat.map((chat) => (
                <div key={chat.id} className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    {chat.user[0]}
                  </div>
                  <div
                    className={`flex-1 rounded-xl p-2 border ${chat.donation ? "bg-rose-50 border-rose-200" : "bg-orange-50 border-orange-100"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-rose-600">{chat.user}</span>
                      {chat.donation && (
                        <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full">{chat.donation}</span>
                      )}
                    </div>
                    <p className="text-slate-700 text-sm">{chat.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-rose-200">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Send encouragement..."
                className="flex-1 bg-white border-rose-200 text-slate-800 placeholder:text-slate-400 focus:border-rose-400"
              />
              <Button className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
