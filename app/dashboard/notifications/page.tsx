"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { NotificationList } from "@/components/notifications/notification-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockNotifications } from "@/lib/mock-data"
import type { Notification } from "@/lib/types"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(
    mockNotifications.filter((n) => n.userId === "user-1"),
  )

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date() } : n)))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true, readAt: new Date() })))
  }

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const unreadNotifications = notifications.filter((n) => !n.isRead)
  const readNotifications = notifications.filter((n) => n.isRead)

  return (
    <div className="flex flex-col">
      <Header title="Notifications" subtitle="Stay updated with your activity" />
      <main className="flex-1">
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadNotifications.length})</TabsTrigger>
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
      </main>
    </div>
  )
}
