"use client"

import { useCallback, useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ThemePreference = "system" | "dark" | "light"

function iconForTheme(value: ThemePreference) {
  if (value === "dark") return Moon
  if (value === "light") return Sun
  return Monitor
}

function useThemePreference() {
  const { user } = useAuth()
  const { setTheme } = useTheme()
  const [value, setValue] = useState<ThemePreference>("system")

  useEffect(() => {
    const pref = user?.themePreference
    if (pref === "dark" || pref === "light" || pref === "system") {
      setValue(pref)
      return
    }
    setValue("system")
  }, [user?.themePreference])

  const handleChange = useCallback(
    async (next: string) => {
      if (next !== "system" && next !== "dark" && next !== "light") return
      const prev = value
      if (prev === next) return

      setValue(next)
      setTheme(next)

      try {
        const res = await fetch("/api/auth/theme", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ themePreference: next }),
        })
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(data.error || "Failed to save theme preference")
        }
      } catch (error) {
        setValue(prev)
        setTheme(prev)
        toast.error(error instanceof Error ? error.message : "Failed to save theme preference")
      }
    },
    [setTheme, value],
  )

  return { value, handleChange }
}

function ThemePreferenceOptions({
  value,
  onValueChange,
}: {
  value: ThemePreference
  onValueChange: (next: string) => void
}) {
  return (
    <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
      {(["system", "dark", "light"] as const).map((option) => {
        const Icon = iconForTheme(option)
        return (
          <DropdownMenuRadioItem key={option} value={option}>
            <Icon className="mr-1 h-4 w-4" />
            {option === "system" ? "System" : option === "dark" ? "Dark" : "Light"}
          </DropdownMenuRadioItem>
        )
      })}
    </DropdownMenuRadioGroup>
  )
}

/** Account menu fragment: separator + label + theme radios (parent must be DropdownMenu). */
export function ThemePreferenceMenu() {
  const { value, handleChange } = useThemePreference()

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Theme</DropdownMenuLabel>
      <ThemePreferenceOptions value={value} onValueChange={handleChange} />
    </>
  )
}

/** Compact theme control for dashboard page headers (md+). */
export function DashboardThemeDropdown() {
  const { value, handleChange } = useThemePreference()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const TriggerIcon = iconForTheme(value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="hidden shrink-0 md:inline-flex"
          aria-label="Theme"
        >
          {!mounted ? <Monitor className="h-4 w-4" /> : <TriggerIcon className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <ThemePreferenceOptions value={value} onValueChange={handleChange} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
