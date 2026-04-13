"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
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
import { INDIAN_STATES_AND_UT } from "@/lib/indian-states"

export function IndianStateCombobox({
  value,
  onValueChange,
  required: requiredProp,
  invalid,
  id,
}: {
  value: string
  onValueChange: (code: string) => void
  required?: boolean
  /** Show error border (e.g. after submit attempt without selection). */
  invalid?: boolean
  id?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = INDIAN_STATES_AND_UT.find((s) => s.code === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-required={requiredProp}
          aria-invalid={invalid ? true : undefined}
          className={cn(
            "w-full justify-between bg-secondary border-border font-normal",
            invalid && "border-destructive text-destructive ring-1 ring-destructive/30",
          )}
        >
          <span className="truncate">{selected ? selected.name : "Select state / UT"}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search state or UT…" className="h-9" />
          <CommandList className="max-h-[280px]">
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup>
              {INDIAN_STATES_AND_UT.map((s) => (
                <CommandItem
                  key={s.code}
                  value={`${s.name} ${s.code}`}
                  onSelect={() => {
                    onValueChange(s.code)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4 shrink-0", value === s.code ? "opacity-100" : "opacity-0")}
                  />
                  {s.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
