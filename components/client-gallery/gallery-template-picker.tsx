"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CLIENT_GALLERY_TEMPLATES,
  DEFAULT_GALLERY_TEMPLATE_ID,
  getGalleryTemplateById,
  type GalleryTemplateCategory,
} from "@/lib/client-gallery-templates"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { GalleryTemplatePreview } from "@/components/client-gallery/gallery-template-preview"

const CATEGORY_LABEL: Record<GalleryTemplateCategory, string> = {
  wedding: "Wedding",
  events: "Events",
  sports: "Sports",
  custom: "Custom",
}

const CATEGORY_ORDER: GalleryTemplateCategory[] = ["wedding", "events", "sports", "custom"]

export type GalleryTemplatePickerProps = {
  value: string
  onChange: (templateId: string) => void
  disabled?: boolean
  /** Denser layout for manage / inline panels */
  compact?: boolean
}

export function GalleryTemplatePicker({ value, onChange, disabled, compact }: GalleryTemplatePickerProps) {
  const resolved = getGalleryTemplateById(value) ?? getGalleryTemplateById(DEFAULT_GALLERY_TEMPLATE_ID)
  const [category, setCategory] = useState<GalleryTemplateCategory>(resolved?.category ?? "events")

  useEffect(() => {
    const t = getGalleryTemplateById(value)
    if (t) setCategory(t.category)
  }, [value])

  const filteredTemplates = useMemo(
    () => CLIENT_GALLERY_TEMPLATES.filter((t) => t.category === category),
    [category],
  )

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {CATEGORY_ORDER.map((cat) => (
          <Button
            key={cat}
            type="button"
            variant={category === cat ? "default" : "ghost"}
            size="sm"
            disabled={disabled}
            onClick={() => {
              setCategory(cat)
              const first = CLIENT_GALLERY_TEMPLATES.find((t) => t.category === cat)
              if (first) onChange(first.id)
            }}
          >
            {CATEGORY_LABEL[cat]}
          </Button>
        ))}
      </div>
      <ul className={cn("grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3")}>
        {filteredTemplates.map((t) => {
          const selected = value === t.id
          return (
            <li key={t.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(t.id)}
                className={cn(
                  "w-full rounded-xl border-2 p-3 text-left transition-colors sm:p-4",
                  selected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/40",
                  disabled && "pointer-events-none opacity-60",
                )}
              >
                <GalleryTemplatePreview templateId={t.id} />
                <p className="font-medium text-foreground">{t.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
