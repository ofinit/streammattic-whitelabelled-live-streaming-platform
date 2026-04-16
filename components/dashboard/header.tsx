"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardThemeDropdown } from "@/components/settings/theme-toggle"

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {

  return (
    <header className="sticky z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6 max-md:top-[calc(3.5rem+env(safe-area-inset-top,0px))] max-md:z-20 md:top-0 md:z-30">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DashboardThemeDropdown />
      </div>
    </header>
  )
}
