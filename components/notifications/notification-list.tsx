"use client"
import { formatDistanceToNow } from "date-fns"
import { Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Notification } from "@/lib/types"

interface NotificationListProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
}

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
}

const typeColors = {
  info: "text-blue-500 bg-blue-500/10",
  success: "text-green-500 bg-green-500/10",
  warning: "text-yellow-500 bg-yellow-500/10",
  error: "text-red-500 bg-red-500/10",
}

export function NotificationList({ notifications, onMarkAsRead, onMarkAllAsRead, onDelete }: NotificationListProps) {
  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-1">No notifications</h3>
          <p className="text-sm text-muted-foreground">You're all caught up!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
          <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((notification) => {
          const Icon = typeIcons[notification.type]
          return (
            <Card
              key={notification.id}
              className={cn("transition-colors", !notification.isRead && "border-primary/50 bg-primary/5")}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className={cn("rounded-full p-2", typeColors[notification.type])}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                    </span>
                  </div>

                  {notification.link && (
                    <a href={notification.link} className="text-sm text-primary hover:underline mt-2 inline-block">
                      View details
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(notification.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
