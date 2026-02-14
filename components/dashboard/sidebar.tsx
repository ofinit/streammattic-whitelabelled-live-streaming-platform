"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useBranding } from "@/lib/branding-context"
import { useSidebar } from "@/lib/sidebar-context"
import { BrandedLogo } from "@/components/branding/branded-logo"
import {
  LayoutDashboard,
  Users,
  Package,
  Calendar,
  Wallet,
  ShoppingCart,
  Settings,
  Paintbrush,
  Globe,
  CreditCard,
  BarChart3,
  Radio,
  Bell,
  LogOut,
  ChevronDown,
  Building2,
  Mail,
  Server,
  Youtube,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: number
}

const adminNav: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Resellers", href: "/admin/resellers", icon: Building2 },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Packages", href: "/admin/packages", icon: Package },
  { title: "Events", href: "/admin/events", icon: Radio },
  { title: "Event Calendar", href: "/admin/calendar", icon: Calendar },
  { title: "Streaming", href: "/admin/streaming", icon: Server }, // Added streaming server page
  { title: "Wallets", href: "/admin/wallets", icon: Wallet },
  { title: "Orders", href: "/admin/orders", icon: ShoppingCart, badge: 8 },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Payment Gateways", href: "/admin/payments", icon: CreditCard },
  { title: "Email Templates", href: "/admin/settings/email-templates", icon: Mail },
  { title: "Settings", href: "/admin/settings", icon: Settings },
]

const resellerNav: NavItem[] = [
  { title: "Dashboard", href: "/reseller", icon: LayoutDashboard },
  { title: "Resellers", href: "/reseller/resellers", icon: Building2 }, // Moved Resellers menu right below Dashboard
  { title: "Users", href: "/reseller/users", icon: Users },
  { title: "Packages", href: "/reseller/packages", icon: Package },
  { title: "Events", href: "/reseller/events", icon: Radio },
  { title: "Event Calendar", href: "/reseller/calendar", icon: Calendar },
  { title: "Wallet", href: "/reseller/wallet", icon: Wallet },
  { title: "Orders", href: "/reseller/orders", icon: ShoppingCart, badge: 3 },
  { title: "Analytics", href: "/reseller/analytics", icon: BarChart3 },
  { title: "Branding", href: "/reseller/branding", icon: Paintbrush },
  { title: "Domains", href: "/reseller/domains", icon: Globe },
  { title: "Payment Gateways", href: "/reseller/payments", icon: CreditCard },
  { title: "Notifications", href: "/reseller/notifications", icon: Bell },
  { title: "Settings", href: "/reseller/settings", icon: Settings },
]

const userNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "My Events", href: "/dashboard/events", icon: Radio },
  { title: "Schedule Event", href: "/dashboard/events/new", icon: Calendar },
  { title: "Event Calendar", href: "/dashboard/calendar", icon: Calendar },
  { title: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { title: "Packages", href: "/dashboard/packages", icon: Package },
  { title: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { title: "YouTube Channels", href: "/dashboard/settings/youtube", icon: Youtube },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout, switchRole } = useAuth()
  const { isWhiteLabel } = useBranding()
  const { isCollapsed, toggleSidebar } = useSidebar()

  const getNavItems = (): NavItem[] => {
    switch (user?.role) {
      case "admin":
        return adminNav
      case "reseller":
        return resellerNav
      case "user":
        return userNav
      default:
        return []
    }
  }

  const navItems = getNavItems()
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar-background transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-3">
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-1">
                <BrandedLogo size="sm" />
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className={cn(
                    "h-9 w-9 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    isCollapsed && "mx-auto",
                  )}
                >
                  {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{isCollapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
            </Tooltip>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    isCollapsed && "justify-center px-2",
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="h-5 min-w-5 justify-center bg-primary text-primary-foreground"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                  {isCollapsed && item.badge && (
                    <Badge
                      variant="secondary"
                      className="absolute -right-1 -top-1 h-4 min-w-4 justify-center bg-primary text-primary-foreground text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )

              if (isCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <div className="relative">{linkContent}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-2">
                      {item.title}
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="h-5 min-w-5 justify-center bg-primary text-primary-foreground"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return linkContent
            })}
          </nav>

          <div className="border-t border-sidebar-border p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn("w-full gap-3 px-3", isCollapsed ? "justify-center" : "justify-start")}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <>
                      <div className="flex flex-1 flex-col items-start text-left">
                        <span className="text-sm font-medium text-sidebar-foreground">{user?.name}</span>
                        <span className="text-xs capitalize text-muted-foreground">{user?.role}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isCollapsed ? "center" : "end"}
                side={isCollapsed ? "right" : "top"}
                className="w-56"
              >
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {!isWhiteLabel && (
                  <>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Role (Demo)</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => switchRole("admin")}>
                      <Users className="mr-2 h-4 w-4" />
                      Admin View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => switchRole("reseller")}>
                      <Building2 className="mr-2 h-4 w-4" />
                      Reseller View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => switchRole("user")}>
                      <Users className="mr-2 h-4 w-4" />
                      User View
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
