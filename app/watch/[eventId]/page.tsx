"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { mockEvents } from "@/lib/mock-data"
import type { LiveEvent } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Radio,
  Eye,
  Users,
  MessageCircle,
  Send,
  Lock,
  Play,
  Heart,
  ThumbsUp,
  Laugh,
  Calendar,
  Share2,
  Maximize,
  Volume2,
  VolumeX,
  Settings,
} from "lucide-react"

interface ChatMessage {
  id: string
  user: string
  message: string
  timestamp: Date
}

const mockChatMessages: ChatMessage[] = [
  { id: "1", user: "John D.", message: "Great stream! 🔥", timestamp: new Date() },
  { id: "2", user: "Sarah M.", message: "Can you explain that again?", timestamp: new Date() },
  { id: "3", user: "Alex K.", message: "This is amazing content", timestamp: new Date() },
  { id: "4", user: "Mike R.", message: "First time watching, loving it!", timestamp: new Date() },
  { id: "5", user: "Emma W.", message: "Thanks for the stream!", timestamp: new Date() },
]

export default function WatchEventPage({ params }: { params: { eventId: string } }) {
  const [event, setEvent] = useState<LiveEvent | null>(null)
  const [isPasswordProtected, setIsPasswordProtected] = useState(false)
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages)
  const [newMessage, setNewMessage] = useState("")
  const [isMuted, setIsMuted] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [viewerCount, setViewerCount] = useState(0)

  useEffect(() => {
    const foundEvent = mockEvents.find((e) => e.id === params.eventId)
    if (foundEvent) {
      setEvent(foundEvent)
      setIsPasswordProtected(foundEvent.isPasswordProtected)
      setIsAuthenticated(!foundEvent.isPasswordProtected)
      setViewerCount(foundEvent.currentViewers)
    }
  }, [params.eventId])

  useEffect(() => {
    if (event?.status === "live") {
      const interval = setInterval(() => {
        setViewerCount((prev) => prev + Math.floor(Math.random() * 5) - 2)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [event?.status])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (event?.password === password) {
      setIsAuthenticated(true)
      setPasswordError("")
    } else {
      setPasswordError("Incorrect password")
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      user: "You",
      message: newMessage,
      timestamp: new Date(),
    }
    setChatMessages((prev) => [...prev, message])
    setNewMessage("")
  }

  const handleReaction = (type: string) => {
    console.log(`Reaction: ${type}`)
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Radio className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Event Not Found</h1>
          <p className="text-muted-foreground">This event may have ended or doesn't exist.</p>
        </div>
      </div>
    )
  }

  if (isPasswordProtected && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">This Event is Private</CardTitle>
            <p className="text-muted-foreground">Enter the password to watch this stream</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter event password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-0"
                />
                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              </div>
              <Button type="submit" className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Watch Stream
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (event.status === "scheduled") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg border-border bg-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{event.title}</CardTitle>
            {event.description && <p className="text-muted-foreground">{event.description}</p>}
          </CardHeader>
          <CardContent className="text-center">
            <Badge variant="outline" className="mb-4 bg-blue-500/20 text-blue-500">
              Scheduled
            </Badge>
            <p className="mb-6 text-lg text-foreground">
              Starts on{" "}
              <span className="font-semibold">
                {event.scheduledAt?.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </p>
            <Button variant="outline" className="border-border bg-transparent">
              <Share2 className="mr-2 h-4 w-4" />
              Share Event
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (event.status === "completed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg border-border bg-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Radio className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">{event.title}</CardTitle>
            {event.description && <p className="text-muted-foreground">{event.description}</p>}
          </CardHeader>
          <CardContent className="text-center">
            <Badge variant="outline" className="mb-4">
              Completed
            </Badge>
            <div className="flex items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{event.totalViews.toLocaleString()} views</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{event.endedAt?.toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <div className="flex flex-1 flex-col">
        <div className="relative aspect-video w-full bg-black">
          <div className="absolute inset-0 flex items-center justify-center">
            {event.streamType === "youtube" && event.youtubeUrl ? (
              <iframe
                className="h-full w-full"
                src={event.youtubeUrl.replace("watch?v=", "embed/")}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                  <Radio className="h-10 w-10 animate-pulse text-primary" />
                </div>
                <p className="text-lg font-medium text-white">Live Stream Active</p>
                <p className="text-sm text-white/60">RTMP: {event.rtmpUrl}</p>
              </div>
            )}
          </div>

          <div className="absolute left-4 top-4 flex items-center gap-2">
            <Badge className="bg-red-600 text-white">
              <span className="mr-1 h-2 w-2 animate-pulse rounded-full bg-white" />
              LIVE
            </Badge>
            <Badge variant="outline" className="border-white/30 bg-black/50 text-white">
              <Eye className="mr-1 h-3 w-3" />
              {viewerCount.toLocaleString()}
            </Badge>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Settings className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Maximize className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-border p-4 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground lg:text-2xl">{event.title}</h1>
              {event.description && <p className="mt-1 text-muted-foreground">{event.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-border bg-transparent">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button
                variant="outline"
                className="border-border lg:hidden bg-transparent"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat
              </Button>
            </div>
          </div>

          {event.allowReactions && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">React:</span>
              <Button variant="ghost" size="sm" className="h-8 px-3" onClick={() => handleReaction("heart")}>
                <Heart className="h-4 w-4 text-red-500" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-3" onClick={() => handleReaction("thumbsup")}>
                <ThumbsUp className="h-4 w-4 text-blue-500" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-3" onClick={() => handleReaction("laugh")}>
                <Laugh className="h-4 w-4 text-yellow-500" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {event.allowChat && showChat && (
        <div className="flex h-[400px] flex-col border-t border-border lg:h-auto lg:w-80 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Live Chat</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{viewerCount}</span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">{msg.user.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{msg.user}</span>
                      <span className="text-xs text-muted-foreground">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="border-t border-border p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Send a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-secondary border-0"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
