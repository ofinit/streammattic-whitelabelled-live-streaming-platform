"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, LogOut, Menu } from "lucide-react"
import { BrandedLogo } from "@/components/branding/branded-logo"
import { ThemePreferenceMenu } from "@/components/settings/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth-context"
import { clientGalleryNavItems, isGalleryNavActive, streamingDashboardHref } from "@/lib/client-gallery-nav-items"
import { cn } from "@/lib/utils"

export function ClientGalleryMobileChrome() {
  const pathname = usePathname() ?? ""
  const { user, logout, isImpersonating } = useAuth()
  const [open, setOpen] = useState(false)

  const role = user?.role === "studio" || user?.role === "streamer" ? user.role : "streamer"
  const backHref = streamingDashboardHref(role)

  return (
    <>
      <header
        className={cn(
          "fixed left-0 right-0 z-40 flex shrink-0 flex-col border-b border-border bg-background pt-[env(safe-area-inset-top,0px)] shadow-sm md:hidden",
          isImpersonating ? "top-11" : "top-0",
        )}
      >
        <div className="flex h-14 min-h-14 items-center justify-between px-3">
          <div className="flex min-w-0 items-center gap-2">
            <BrandedLogo size="sm" />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="gap-1 px-2">
                  <span className="max-w-[6rem] truncate text-sm">{user?.name ?? "Account"}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <ThemePreferenceMenu />
                <DropdownMenuItem onClick={() => void logout()} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={() => setOpen(true)}
              aria-label="Open gallery navigation"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-[min(100vw-1rem,20rem)] border-border bg-background p-0 shadow-2xl sm:max-w-xs [&>button]:z-50"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Gallery navigation</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col pt-12">
            <div className="flex items-center border-b border-border px-4 pb-3">
              <BrandedLogo size="sm" />
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="AI Client Photo Gallery">
              <ul className="space-y-1">
                {clientGalleryNavItems.map(({ title, href, icon: Icon }) => {
                  const active = isGalleryNavActive(pathname, href)
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium min-h-11",
                          active
                            ? "bg-sidebar-accent text-sidebar-primary"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" aria-hidden />
                        {title}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
            <div className="border-t border-border p-3">
              <Button asChild variant="outline" className="w-full">
                <Link href={backHref} onClick={() => setOpen(false)}>
                  Back to streaming dashboard
                </Link>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
