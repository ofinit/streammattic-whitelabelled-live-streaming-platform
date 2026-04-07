"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { Header } from "@/components/dashboard/header"
import { NotificationList } from "@/components/notifications/notification-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Notification } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function StudioNotificationsPage() {
  const { data, error, mutate, isLoading } = useSWR("/api/notifications", fetcher)

  const notifications = useMemo(() => data?.data?.notifications || [], [data])
  const unreadCount = data?.data?.unreadCount || 0

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      mutate()
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      })
      mutate()
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      })
      mutate()
    } catch (err) {
      console.error("Failed to delete notification:", err)
    }
  }

  const unreadNotifications = notifications.filter((n: Notification) => !n.isRead)
  const readNotifications = notifications.filter((n: Notification) => n.isRead)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-muted-foreground">Failed to load notifications</p>
        <Button onClick={() => mutate()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title="Notifications" subtitle="Stay updated with your activity" />
      <main className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
              <TabsTrigger value="read">Read ({readNotifications.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <NotificationList
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="unread" className="mt-6">
              <NotificationList
                notifications={unreadNotifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="read" className="mt-6">
              <NotificationList
                notifications={readNotifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onDelete={handleDelete}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
