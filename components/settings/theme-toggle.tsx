"use client"

import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

type ThemePreference = "system" | "dark" | "light"

function iconForTheme(value: ThemePreference) {
  if (value === "dark") return Moon
  if (value === "light") return Sun
  return Monitor
}

export function ThemePreferenceMenu() {
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

  const handleChange = async (next: string) => {
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
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Theme</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={value} onValueChange={handleChange}>
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
    </>
  )
}

