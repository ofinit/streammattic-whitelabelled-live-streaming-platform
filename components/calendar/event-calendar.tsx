"use client"

import type React from "react"

import { useMemo, useRef, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { type DayButton, getDefaultClassNames } from "react-day-picker"
import { cn } from "@/lib/utils"

interface Event {
  id: string
  status: string
  scheduledAt: string
  createdAt: string
}

interface EventCalendarProps {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  events: Event[]
  className?: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "live":
    case "on_break":
      return "bg-red-500"
    case "scheduled":
      return "bg-yellow-500"
    case "completed":
    case "ended":
      return "bg-green-500"
    case "cancelled":
      return "bg-gray-500"
    default:
      return "bg-gray-400"
  }
}

export function EventCalendar({ mode = "single", selected, onSelect, events, className }: EventCalendarProps) {
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Set<string>> = {}

    events.forEach((event) => {
      const eventDate = new Date(event.scheduledAt || event.createdAt)
      const dateKey = format(eventDate, "yyyy-MM-dd")

      if (!grouped[dateKey]) {
        grouped[dateKey] = new Set()
      }
      grouped[dateKey].add(event.status)
    })

    return grouped
  }, [events])

  const CustomDayButton = (props: React.ComponentProps<typeof DayButton>) => {
    const { day, modifiers, className, ...rest } = props
    const defaultClassNames = getDefaultClassNames()
    const dateKey = format(day.date, "yyyy-MM-dd")
    const statuses = eventsByDate[dateKey]

    const ref = useRef<HTMLButtonElement>(null)
    useEffect(() => {
      if (modifiers.focused) ref.current?.focus()
    }, [modifiers.focused])

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        data-day={day.date.toLocaleDateString()}
        data-selected-single={
          modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
        }
        data-range-start={modifiers.range_start}
        data-range-end={modifiers.range_end}
        data-range-middle={modifiers.range_middle}
        className={cn(
          "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70",
          defaultClassNames.day,
          className,
        )}
        {...rest}
      >
        <span>{day.date.getDate()}</span>
        {statuses && statuses.size > 0 && (
          <div className="flex gap-1 justify-center">
            {Array.from(statuses).map((status, index) => (
              <div key={index} className={cn("h-2.5 w-2.5 rounded-full", getStatusColor(status))} title={status} />
            ))}
          </div>
        )}
      </Button>
    )
  }

  return (
    <Calendar
      mode={mode}
      selected={selected}
      onSelect={onSelect}
      className={cn("rounded-md border p-3 w-full", className)}
      components={{
        DayButton: CustomDayButton,
      }}
    />
  )
}
