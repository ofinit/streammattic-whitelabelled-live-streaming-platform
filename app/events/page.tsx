"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Radio, Eye, Calendar, Search, Lock, Play, Loader2 } from "lucide-react"

export default function PublicEventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/events?public=true")
      .then(res => res.json())
      .then(data => {
        if (data.events) setEvents(data.events)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.userName?.toLowerCase().includes(search.toLowerCase())
  )

  const liveEvents = filteredEvents.filter((e) => e.status === "live")
  const upcomingEvents = filteredEvents.filter((e) => e.status === "scheduled")

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-muted-foreground gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p>Fetching live streams...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Radio className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">StreamLivee</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search events..." 
                className="w-64 bg-secondary border-0 pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button asChild>
              <Link href="/">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Live Now Section */}
        {liveEvents.length > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex items-center gap-2">
              <Badge className="bg-red-600 text-white">
                <span className="mr-1 h-2 w-2 animate-pulse rounded-full bg-white" />
                LIVE NOW
              </Badge>
              <span className="text-muted-foreground">{liveEvents.length} streams</span>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {liveEvents.map((event) => (
                <Link key={event.id} href={`/${event.slug || event.id}`}>
                  <Card className="group overflow-hidden border-border bg-card transition-all hover:border-primary/50">
                    <div className="relative aspect-video bg-secondary">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Radio className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/40">
                        <Play className="h-12 w-12 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <Badge className="absolute left-2 top-2 bg-red-600 text-white">LIVE</Badge>
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs text-white">
                        <Eye className="h-3 w-3" />
                        {event.currentViewers || 0}
                      </div>
                      {event.isPasswordProtected && <Lock className="absolute right-2 top-2 h-4 w-4 text-white" />}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground line-clamp-1">{event.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">by {event.userName}</p>
                      {event.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Section */}
        {upcomingEvents.length > 0 && (
          <section>
            <div className="mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Upcoming Events</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <Link key={event.id} href={`/${event.slug || event.id}`}>
                  <Card className="group overflow-hidden border-border bg-card transition-all hover:border-primary/50">
                    <div className="relative aspect-video bg-secondary">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <Badge className="absolute left-2 top-2 bg-blue-500/20 text-blue-500">Scheduled</Badge>
                      {event.isPasswordProtected && (
                        <Lock className="absolute right-2 top-2 h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground line-clamp-1">{event.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">by {event.userName}</p>
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(event.scheduledAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && liveEvents.length === 0 && upcomingEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Radio className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground">No Events Available</h2>
            <p className="text-muted-foreground">Check back later for live streams and upcoming events.</p>
          </div>
        )}
      </main>
    </div>
  )
}
