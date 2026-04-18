"use client"

import { CLIENT_GALLERY_TEMPLATES } from "@/lib/client-gallery-templates"
import { cn } from "@/lib/utils"
import { GalleryTemplatePreview } from "@/components/client-gallery/gallery-template-preview"

export type GalleryTemplatePickerProps = {
  value: string
  onChange: (templateId: string) => void
  disabled?: boolean
  /** Denser layout for manage / inline panels */
  compact?: boolean
}

export function GalleryTemplatePicker({ value, onChange, disabled, compact }: GalleryTemplatePickerProps) {
  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <ul className={cn("grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3")}>
        {CLIENT_GALLERY_TEMPLATES.map((t) => {
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
