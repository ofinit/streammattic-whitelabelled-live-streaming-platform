"use client"

import type React from "react"
import { Fragment, useEffect } from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import useSWR from "swr"
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
  Plug,
  Receipt,
  PanelLeftClose,
  PanelLeft,
  Menu,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: number
}

const adminNav: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Studios", href: "/admin/studios", icon: Building2 },
  { title: "Streamers", href: "/admin/streamers", icon: Users },
  { title: "Pricing", href: "/admin/packages", icon: Package },
  { title: "Control Center", href: "/admin/events", icon: Radio },
  { title: "Create Events", href: "/admin/calendar", icon: Calendar },
  { title: "Streaming", href: "/admin/streaming", icon: Server },
  { title: "Wallets", href: "/admin/wallets", icon: Wallet },
  { title: "GST invoices", href: "/admin/invoices", icon: Receipt },
  { title: "Orders", href: "/admin/orders", icon: ShoppingCart, badge: 8 },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Payment Gateways", href: "/admin/payments", icon: CreditCard },
  { title: "Email Templates", href: "/admin/settings/email-templates", icon: Mail },
  { title: "Integrations", href: "/admin/settings/integrations", icon: Plug },
  { title: "GST", href: "/admin/settings/gst", icon: Receipt },
  { title: "Settings", href: "/admin/settings", icon: Settings },
]

const studioNav: NavItem[] = [
  { title: "Dashboard", href: "/studio", icon: LayoutDashboard },
  { title: "Control Center", href: "/studio/events", icon: Radio },
  { title: "Create Events", href: "/studio/calendar", icon: Calendar },
  { title: "Wallet", href: "/studio/wallet", icon: Wallet },
  { title: "GST invoices", href: "/studio/invoices", icon: Receipt },
  { title: "Packages", href: "/studio/packages", icon: Package },
  { title: "Analytics", href: "/studio/analytics", icon: BarChart3 },
  { title: "Branding", href: "/studio/branding", icon: Paintbrush },
  { title: "Notifications", href: "/studio/notifications", icon: Bell },
  { title: "Integrations", href: "/studio/settings/integrations", icon: Plug },
  { title: "Settings", href: "/studio/settings", icon: Settings },
]

const streamerNav: NavItem[] = [
  { title: "Dashboard", href: "/streamer", icon: LayoutDashboard },
  { title: "Control Center", href: "/streamer/events", icon: Radio },
  { title: "Create Events", href: "/streamer/calendar", icon: Calendar },
  { title: "Wallet & transactions", href: "/streamer/wallet", icon: Wallet },
  { title: "GST invoices", href: "/streamer/invoices", icon: Receipt },
  { title: "Packages", href: "/streamer/packages", icon: Package },
  { title: "Analytics", href: "/streamer/analytics", icon: BarChart3 },
  { title: "Notifications", href: "/streamer/notifications", icon: Bell },
  { title: "YouTube Channels", href: "/streamer/settings/youtube", icon: Youtube },
  { title: "Settings", href: "/streamer/settings", icon: Settings },
]

const settingsFetcher = (url: string) => fetch(url).then((r) => r.json())

function NavLinks({
  navItems,
  pathname,
  isCollapsed,
  isMobileSheet,
  onNavigate,
}: {
  navItems: NavItem[]
  pathname: string | null
  isCollapsed: boolean
  isMobileSheet: boolean
  onNavigate?: () => void
}) {
  const effectiveCollapsed = isCollapsed && !isMobileSheet

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const linkContent = (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-11",
              isActive
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              effectiveCollapsed && "justify-center px-2",
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!effectiveCollapsed && (
              <>
                <span className="flex-1">{item.title}</span>
                {item.badge ? (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 justify-center bg-primary text-primary-foreground"
                  >
                    {item.badge}
                  </Badge>
                ) : null}
              </>
            )}
            {effectiveCollapsed && item.badge ? (
              <Badge
                variant="secondary"
                className="absolute -right-1 -top-1 h-4 min-w-4 justify-center bg-primary text-primary-foreground text-xs"
              >
                {item.badge}
              </Badge>
            ) : null}
          </Link>
        )

        if (effectiveCollapsed) {
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <div className="relative">{linkContent}</div>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-2">
                {item.title}
                {item.badge ? (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 justify-center bg-primary text-primary-foreground"
                  >
                    {item.badge}
                  </Badge>
                ) : null}
              </TooltipContent>
            </Tooltip>
          )
        }

        return (
          <Fragment key={item.href}>
            {linkContent}
          </Fragment>
        )
      })}
    </nav>
  )
}

function AccountBlock({
  isCollapsed,
  isMobileSheet,
  userName,
  userRole,
  initials,
  isWhiteLabel,
  logout,
  switchRole,
}: {
  isCollapsed: boolean
  isMobileSheet: boolean
  userName?: string
  userRole?: string
  initials?: string
  isWhiteLabel: boolean
  logout: () => void
  switchRole: (role: "admin" | "studio" | "streamer") => void
}) {
  const effectiveCollapsed = isCollapsed && !isMobileSheet

  return (
    <div className="border-t border-sidebar-border p-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full gap-3 px-3 min-h-11",
              effectiveCollapsed ? "justify-center" : "justify-start",
            )}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
            </Avatar>
            {!effectiveCollapsed && (
              <>
                <div className="flex flex-1 flex-col items-start text-left">
                  <span className="text-sm font-medium text-sidebar-foreground">{userName}</span>
                  <span className="text-xs capitalize text-muted-foreground">{userRole}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={effectiveCollapsed ? "center" : "end"}
          side={effectiveCollapsed ? "right" : "top"}
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
              <DropdownMenuItem onClick={() => switchRole("studio")}>
                <Building2 className="mr-2 h-4 w-4" />
                Studio View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchRole("streamer")}>
                <Users className="mr-2 h-4 w-4" />
                Streamer View
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
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout, switchRole, isImpersonating } = useAuth()
  const { isWhiteLabel } = useBranding()
  const { isCollapsed, toggleSidebar, mobileNavOpen, setMobileNavOpen } = useSidebar()
  const { data: settingsData } = useSWR<{ settings?: { key: string; value: unknown }[] }>(
    user?.role === "streamer" || user?.role === "studio" ? "/api/settings" : null,
    settingsFetcher,
  )
  const platformYoutubeEnabled =
    settingsData?.settings?.find((s) => s.key === "youtube_config_enabled")?.value === true ||
    settingsData?.settings?.find((s) => s.key === "youtube_config_enabled")?.value === "true"
  const override = settingsData?.settings?.find((s) => s.key === "youtube_config_override")?.value
  const youtubeConfigEnabled =
    override === true || override === "true"
      ? true
      : override === false || override === "false"
        ? false
        : Boolean(platformYoutubeEnabled)

  const getNavItems = (): NavItem[] => {
    switch (user?.role) {
      case "admin":
        return adminNav
      case "studio": {
        if (!youtubeConfigEnabled) return studioNav.filter((item) => item.href !== "/studio/settings/integrations")
        return studioNav
      }
      case "streamer": {
        if (!youtubeConfigEnabled) return streamerNav.filter((item) => item.href !== "/streamer/settings/youtube")
        return streamerNav
      }
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

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname, setMobileNavOpen])

  const closeMobileNav = () => setMobileNavOpen(false)

  return (
    <TooltipProvider delayDuration={0}>
      <header
        className={cn(
          "fixed left-0 right-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar-background px-3 md:hidden",
          isImpersonating ? "top-11" : "top-0",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <BrandedLogo size="sm" />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </header>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[min(100vw-1rem,20rem)] border-sidebar-border bg-sidebar-background p-0 sm:max-w-xs [&>button]:text-sidebar-foreground"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col pt-12">
            <div className="flex items-center border-b border-sidebar-border px-4 pb-3">
              <BrandedLogo size="sm" />
            </div>
            <NavLinks
              navItems={navItems}
              pathname={pathname}
              isCollapsed={false}
              isMobileSheet
              onNavigate={closeMobileNav}
            />
            <AccountBlock
              isCollapsed={false}
              isMobileSheet
              userName={user?.name}
              userRole={user?.role}
              initials={initials}
              isWhiteLabel={isWhiteLabel}
              logout={logout}
              switchRole={switchRole}
            />
          </div>
        </SheetContent>
      </Sheet>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen border-r border-sidebar-border bg-sidebar-background transition-all duration-300 md:flex md:flex-col",
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

          <NavLinks
            navItems={navItems}
            pathname={pathname}
            isCollapsed={isCollapsed}
            isMobileSheet={false}
          />

          <AccountBlock
            isCollapsed={isCollapsed}
            isMobileSheet={false}
            userName={user?.name}
            userRole={user?.role}
            initials={initials}
            isWhiteLabel={isWhiteLabel}
            logout={logout}
            switchRole={switchRole}
          />
        </div>
      </aside>
    </TooltipProvider>
  )
}
