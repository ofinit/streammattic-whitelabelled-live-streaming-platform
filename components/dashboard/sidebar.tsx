"use client"

import type React from "react"
import { Fragment, useEffect, useMemo } from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
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
  LogOut,
  ChevronDown,
  Building2,
  Mail,
  Server,
  Youtube,
  Plug,
  Receipt,
  Menu,
  Zap,
  ClipboardList,
  Database,
  Images,
  ExternalLink,
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
import { resolveGalleryHref, type PhotoGalleryAddonSettings } from "@/lib/photo-gallery-addon"
import { ThemePreferenceMenu } from "@/components/settings/theme-toggle"

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
  { title: "Packages", href: "/admin/packages", icon: Package },
  { title: "Control Center", href: "/admin/control-center", icon: Radio },
  { title: "Create Event", href: "/admin/create-events", icon: Calendar },
  { title: "Streaming", href: "/admin/streaming", icon: Server },
  { title: "Wallets", href: "/admin/wallets", icon: Wallet },
  { title: "GST invoices", href: "/admin/invoices", icon: Receipt },
  { title: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Visitor leads", href: "/admin/visitor-registrations", icon: ClipboardList },
  { title: "Payment Gateways", href: "/admin/payments", icon: CreditCard },
  { title: "Email Templates", href: "/admin/settings/email-templates", icon: Mail },
  { title: "Integrations", href: "/admin/settings/integrations", icon: Plug },
  { title: "GST", href: "/admin/settings/gst", icon: Receipt },
  { title: "System Tasks", href: "/admin/system-tasks", icon: Radio },
  { title: "Database", href: "/admin/database", icon: Database },
  { title: "Settings", href: "/admin/settings", icon: Settings },
]

/** Studio nav without Setup Wizard — wizard row is injected when onboarding is incomplete or draft exists */
const studioNavBeforeSetup: NavItem[] = [
  { title: "Dashboard", href: "/studio", icon: LayoutDashboard },
  { title: "Control Center", href: "/studio/control-center", icon: Radio },
  { title: "Create Event", href: "/studio/create-events", icon: Calendar },
  { title: "Packages", href: "/studio/packages", icon: Package },
  { title: "Billing & Wallet", href: "/studio/wallet", icon: Wallet },
]

const studioNavAfterSetup: NavItem[] = [
  { title: "Branding", href: "/studio/branding", icon: Paintbrush },
  { title: "YouTube Channels", href: "/studio/settings/youtube", icon: Youtube },
  { title: "Settings", href: "/studio/settings", icon: Settings },
]

const streamerNav: NavItem[] = [
  { title: "Dashboard", href: "/streamer", icon: LayoutDashboard },
  { title: "Control Center", href: "/streamer/control-center", icon: Radio },
  { title: "Create Event", href: "/streamer/create-events", icon: Calendar },
  { title: "Packages", href: "/streamer/packages", icon: Package },
  { title: "Billing & Wallet", href: "/streamer/wallet", icon: Wallet },
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
  trailing,
}: {
  navItems: NavItem[]
  pathname: string | null
  isCollapsed: boolean
  isMobileSheet: boolean
  onNavigate?: () => void
  trailing?: React.ReactNode
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
      {trailing}
    </nav>
  )
}

type PhotoGalleryStatusResponse = {
  catalog: PhotoGalleryAddonSettings
  entitled: boolean
  eligible: boolean
}

type StudioSetupInfoResponse = {
  draft?: Record<string, unknown> | null
  setupCompletedAt?: string | null
}

/** Short sidebar label; full product name from catalog in tooltip / aria. */
const PHOTO_GALLERY_MENU_SHORT = "AI photo gallery"

function PhotoGalleryMenuBadge({ collapsed }: { collapsed: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 border-emerald-500/45 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400",
        collapsed &&
          "absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center border-emerald-500/50 px-0.5 text-[9px] leading-none",
      )}
    >
      {collapsed ? "AI" : "Add-on"}
    </Badge>
  )
}

/** Add-on nav: same-origin or external URL; always opens in a new tab so the main dashboard stays open. */
function PhotoGallerySidebarNavLink({
  pathname,
  isCollapsed,
  isMobileSheet,
  onNavigate,
}: {
  pathname: string | null
  isCollapsed: boolean
  isMobileSheet: boolean
  onNavigate?: () => void
}) {
  const { data } = useSWR<PhotoGalleryStatusResponse>("/api/photo-gallery-addon/status", settingsFetcher, {
    revalidateOnFocus: true,
  })
  const effectiveCollapsed = isCollapsed && !isMobileSheet

  if (!data?.eligible) return null

  const href = resolveGalleryHref(data.catalog)
  const titleFull = data.catalog.productName?.trim() || "AI Client Photo Gallery"
  const isExternal = /^https?:\/\//i.test(href)
  const pathForActive = href.startsWith("/") ? href.replace(/\/$/, "") || "/" : ""
  const isActive =
    Boolean(pathForActive && pathname && (pathname === pathForActive || pathname.startsWith(`${pathForActive}/`)))

  const linkClassName = cn(
    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-11",
    isActive
      ? "bg-sidebar-accent text-sidebar-primary"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
    effectiveCollapsed && "justify-center px-2",
  )

  const linkBody = isExternal ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${titleFull} (opens in new tab)`}
      onClick={() => onNavigate?.()}
      className={linkClassName}
    >
      <Images className="h-5 w-5 shrink-0" aria-hidden />
      {effectiveCollapsed ? <PhotoGalleryMenuBadge collapsed /> : null}
      {!effectiveCollapsed && (
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="min-w-0 truncate">{PHOTO_GALLERY_MENU_SHORT}</span>
          <PhotoGalleryMenuBadge collapsed={false} />
          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        </span>
      )}
    </a>
  ) : (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${titleFull} (opens in new tab)`}
      title={titleFull}
      onClick={() => onNavigate?.()}
      className={linkClassName}
    >
      <Images className="h-5 w-5 shrink-0" aria-hidden />
      {effectiveCollapsed ? <PhotoGalleryMenuBadge collapsed /> : null}
      {!effectiveCollapsed && (
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="min-w-0 truncate">{PHOTO_GALLERY_MENU_SHORT}</span>
          <PhotoGalleryMenuBadge collapsed={false} />
          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        </span>
      )}
    </Link>
  )

  if (effectiveCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">{linkBody}</div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[16rem]">
          <span className="flex flex-wrap items-center gap-2">
            <span>
              {titleFull}
              {" "}
              (opens in new tab)
            </span>
            <PhotoGalleryMenuBadge collapsed={false} />
          </span>
        </TooltipContent>
      </Tooltip>
    )
  }

  return <Fragment key="photo-gallery-addon-nav">{linkBody}</Fragment>
}

function AccountBlock({
  isCollapsed,
  isMobileSheet,
  userName,
  userRole,
  initials,
  logout,
  reRunSetupWizardHref,
}: {
  isCollapsed: boolean
  isMobileSheet: boolean
  userName?: string
  userRole?: string
  initials?: string
  logout: () => void
  /** Studio users who finished onboarding — open full wizard with ?force=1 */
  reRunSetupWizardHref?: string
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
          <DropdownMenuItem onClick={() => {
            if (userRole === "admin") window.location.href = "/admin/settings"
            else if (userRole === "studio") window.location.href = "/studio/settings"
            else if (userRole === "streamer") window.location.href = "/streamer/settings"
          }}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          {reRunSetupWizardHref ? (
            <DropdownMenuItem asChild>
              <Link href={reRunSetupWizardHref} className="cursor-pointer">
                <Zap className="mr-2 h-4 w-4" />
                Re-run setup wizard
              </Link>
            </DropdownMenuItem>
          ) : null}
          <ThemePreferenceMenu />
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
  const { user, logout, isImpersonating } = useAuth()
  const { isCollapsed, toggleSidebar, mobileNavOpen, setMobileNavOpen } = useSidebar()
  const { data: studioSetupInfo } = useSWR<StudioSetupInfoResponse>(
    user?.role === "studio" ? "/api/studio/setup" : null,
    settingsFetcher,
    { revalidateOnFocus: true },
  )

  const navItems = useMemo((): NavItem[] => {
    switch (user?.role) {
      case "admin":
        return adminNav
      case "studio": {
        const showSetup =
          studioSetupInfo == null ||
          !studioSetupInfo.setupCompletedAt ||
          studioSetupInfo.draft != null
        const hasDraft = Boolean(studioSetupInfo?.draft)
        const setupItem: NavItem | null = showSetup
          ? {
              title: hasDraft ? "Resume setup" : "Setup Wizard",
              href: "/studio/setup",
              icon: Zap,
              badge: hasDraft ? 1 : undefined,
            }
          : null
        return [...studioNavBeforeSetup, ...(setupItem ? [setupItem] : []), ...studioNavAfterSetup]
      }
      case "streamer":
        return streamerNav
      default:
        return []
    }
  }, [user?.role, studioSetupInfo])

  const reRunSetupWizardHref =
    user?.role === "studio" &&
    studioSetupInfo &&
    Boolean(studioSetupInfo.setupCompletedAt) &&
    studioSetupInfo.draft == null
      ? "/studio/setup?force=1"
      : undefined
  const closeMobileNav = () => setMobileNavOpen(false)
  const galleryNavTrailing =
    user?.role === "streamer" || user?.role === "studio" ? (
      <PhotoGallerySidebarNavLink pathname={pathname} isCollapsed={isCollapsed} isMobileSheet={false} />
    ) : null
  const galleryNavTrailingMobile =
    user?.role === "streamer" || user?.role === "studio" ? (
      <PhotoGallerySidebarNavLink
        pathname={pathname}
        isCollapsed={false}
        isMobileSheet
        onNavigate={closeMobileNav}
      />
    ) : null
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname, setMobileNavOpen])

  return (
    <TooltipProvider delayDuration={0}>
      <header
        className={cn(
          "fixed left-0 right-0 z-40 flex shrink-0 flex-col border-b border-sidebar-border bg-sidebar pt-[env(safe-area-inset-top,0px)] shadow-sm md:hidden",
          isImpersonating ? "top-11" : "top-0",
        )}
      >
        <div className="flex h-14 min-h-14 items-center justify-between px-3">
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
        </div>
      </header>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="w-[min(100vw-1rem,20rem)] border-sidebar-border bg-sidebar p-0 shadow-2xl sm:max-w-xs [&>button]:z-50 [&>button]:text-sidebar-foreground"
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
              logout={logout}
              reRunSetupWizardHref={reRunSetupWizardHref}
            />
          </div>
        </SheetContent>
      </Sheet>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300 md:flex md:flex-col",
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
                  <Menu className="h-5 w-5" />
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
            trailing={galleryNavTrailing}
          />

          <AccountBlock
            isCollapsed={isCollapsed}
            isMobileSheet={false}
            userName={user?.name}
            userRole={user?.role}
            initials={initials}
            logout={logout}
            reRunSetupWizardHref={reRunSetupWizardHref}
          />
        </div>
      </aside>
    </TooltipProvider>
  )
}
