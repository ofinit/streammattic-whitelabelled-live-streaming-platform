"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { GOOGLE_TITLE_FONTS, type GoogleFontEntry } from "@/lib/google-title-fonts"
import {
  googleFontsPreviewStylesheetHrefs,
  googleFontsStylesheetHref,
} from "@/lib/event-title-typography"

interface EventTitleFontPickerProps {
  value: string | null
  onChange: (family: string | null) => void
}

const GROUP_ORDER = ["Serif", "Sans", "Display", "Script"] as const

export function EventTitleFontPicker({ value, onChange }: EventTitleFontPickerProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!value) return
    const id = "event-form-title-google-font"
    let link = document.getElementById(id) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement("link")
      link.id = id
      link.rel = "stylesheet"
      document.head.appendChild(link)
    }
    link.href = googleFontsStylesheetHref(value)
    return () => {
      link?.remove()
    }
  }, [value])

  /** Load all picker fonts at 400 when the menu opens so each row can render in its typeface */
  useEffect(() => {
    if (!open) return
    const uniqueFamilies = [...new Set(GOOGLE_TITLE_FONTS.map((x) => x.family))]
    const hrefs = googleFontsPreviewStylesheetHrefs(uniqueFamilies)
    hrefs.forEach((href, i) => {
      const id = `event-form-title-fonts-preview-${i}`
      let link = document.getElementById(id) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement("link")
        link.id = id
        link.rel = "stylesheet"
        document.head.appendChild(link)
      }
      if (link.getAttribute("data-href") !== href) {
        link.href = href
        link.setAttribute("data-href", href)
      }
    })
  }, [open])

  const byGroup = useMemo(() => {
    const m = new Map<string, GoogleFontEntry[]>()
    for (const g of GROUP_ORDER) m.set(g, [])
    for (const f of GOOGLE_TITLE_FONTS) {
      const arr = m.get(f.group)
      if (arr) arr.push(f)
    }
    return m
  }, [])

  const label = value ?? "Template default"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-9 w-full justify-between border-input bg-secondary px-3 font-normal text-foreground shadow-none hover:bg-secondary/80",
            !value && "text-muted-foreground",
          )}
        >
          <span
            className="truncate text-left text-sm"
            style={value ? { fontFamily: `"${value}", system-ui, sans-serif` } : undefined}
          >
            {label}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2rem,320px)] p-0" align="start">
        <Command className="rounded-md border-0">
          <CommandInput placeholder="Search fonts…" className="h-9" />
          <CommandList className="max-h-[280px]">
            <CommandEmpty>No font found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="default template default stack"
                onSelect={() => {
                  onChange(null)
                  setOpen(false)
                }}
                className="text-xs"
              >
                <Check className={cn("mr-2 h-4 w-4", value ? "opacity-0" : "opacity-100")} />
                Template default
              </CommandItem>
            </CommandGroup>
            {GROUP_ORDER.map((group) => {
              const items = byGroup.get(group) ?? []
              if (items.length === 0) return null
              return (
                <CommandGroup key={group} heading={group}>
                  {items.map((f) => (
                    <CommandItem
                      key={f.family}
                      value={`${f.family} ${group}`}
                      onSelect={() => {
                        onChange(f.family)
                        setOpen(false)
                      }}
                      className="text-sm"
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4 shrink-0", value === f.family ? "opacity-100" : "opacity-0")}
                      />
                      <span
                        className="min-w-0 flex-1 truncate"
                        style={{ fontFamily: `"${f.family}", system-ui, sans-serif` }}
                      >
                        {f.family}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
