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

const TEMPLATES_PER_ROW = 4

function chunkTemplates<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

export function GalleryTemplatePicker({ value, onChange, disabled, compact }: GalleryTemplatePickerProps) {
  const rows = chunkTemplates(CLIENT_GALLERY_TEMPLATES, TEMPLATES_PER_ROW)
  const gridClass = cn("grid grid-cols-2 gap-3 md:grid-cols-4", !compact && "md:gap-4")

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {rows.map((row, rowIdx) => (
        <ul key={rowIdx} className={gridClass}>
          {row.map((t) => {
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
      ))}
    </div>
  )
}
