import { cn } from "@/lib/utils"

type Props = { templateId: string; className?: string }

/** Enhanced mini layout chrome showing new designs with hero sections and lightbox support. */
export function GalleryTemplatePreview({ templateId, className }: Props) {
  return (
    <div
      className={cn(
        "relative mb-3 aspect-video overflow-hidden rounded-lg border border-border/80 bg-muted/40",
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0 p-2 sm:p-2.5">{mockupFor(templateId)}</div>
    </div>
  )
}

function cell() {
  return "rounded-sm bg-foreground/20 ring-1 ring-foreground/10 dark:bg-white/15 dark:ring-white/20"
}

function mockupFor(id: string) {
  switch (id) {
    case "midnight-elegance":
      return (
        <div className="flex h-full flex-col gap-1.5">
          <div className="mb-1 h-4 w-1/2 rounded bg-foreground/20" />
          <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn(cell(), "min-h-0")} />
            ))}
          </div>
        </div>
      )
    case "cinematic-hero":
      return (
        <div className="flex h-full flex-col gap-1.5">
          <div className="relative h-[32%] shrink-0 overflow-hidden rounded-md bg-primary/45 ring-1 ring-primary/30">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-1 left-2 right-2">
              <div className="h-2 w-20 rounded bg-white/80" />
              <div className="mt-1 h-1.5 w-12 rounded bg-white/50" />
            </div>
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn(cell(), "min-h-0")} />
            ))}
          </div>
        </div>
      )
    case "storyflow":
      return (
        <div className="flex h-full gap-1.5">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className={cn(cell(), "h-[42%]")} />
            <div className={cn(cell(), "min-h-0 flex-1")} />
            <div className={cn(cell(), "h-[28%]")} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className={cn(cell(), "h-[58%]")} />
            <div className={cn(cell(), "min-h-0 flex-1")} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className={cn(cell(), "h-[35%]")} />
            <div className={cn(cell(), "h-[32%]")} />
            <div className={cn(cell(), "min-h-0 flex-1")} />
          </div>
        </div>
      )
    case "artisan-bento":
      return (
        <div className="flex h-full flex-col gap-1.5">
          <div className="mb-1 h-3 w-1/3 rounded bg-foreground/20" />
          <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5">
            <div className={cn(cell(), "col-span-2 row-span-2")} />
            <div className={cn(cell(), "row-span-2")} />
            <div className={cn(cell(), "col-span-2")} />
          </div>
        </div>
      )
    case "blush-serenity":
      return (
        <div className="flex h-full flex-col gap-1.5 rounded-md bg-gradient-to-br from-rose-100/80 via-background to-violet-100/60 p-2 dark:from-rose-950/60 dark:via-background dark:to-violet-950/40">
          <div className="mx-auto h-2 w-16 rounded-full bg-rose-400/50 dark:bg-rose-500/40" />
          <div className="mx-auto h-3 w-24 rounded bg-foreground/20" />
          <div className="mx-auto h-2 w-12 rounded bg-foreground/10" />
          <div className="mt-1 grid min-h-0 flex-1 grid-cols-4 gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn(cell(), "min-h-0")} />
            ))}
          </div>
        </div>
      )
    case "amethyst-garden":
      return (
        <div className="flex h-full flex-col gap-1.5 rounded-md bg-gradient-to-br from-violet-100/70 via-background to-fuchsia-100/50 p-2 dark:from-violet-950/50 dark:via-background dark:to-fuchsia-950/30">
          <div className="mx-auto h-3 w-20 rounded bg-foreground/20" />
          <div className="mx-auto h-2 w-14 rounded-full bg-violet-400/40 dark:bg-violet-500/30" />
          <div className="mt-1 grid min-h-0 flex-1 grid-cols-3 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn(cell(), "min-h-0")} />
            ))}
          </div>
        </div>
      )
    case "velocity-edge":
      return (
        <div className="flex h-full flex-col gap-1">
          <div className="relative h-[26%] shrink-0 overflow-hidden rounded-sm bg-gradient-to-r from-primary to-orange-500 shadow-sm">
            <div className="absolute bottom-1.5 left-2 h-2.5 w-24 rounded bg-white/90" />
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-2 gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={cn(cell(), "min-h-0 bg-foreground/25 dark:bg-white/20")} />
            ))}
          </div>
        </div>
      )
    case "obsidian-frame":
      return (
        <div className="flex h-full flex-col rounded-md bg-zinc-900 p-2 ring-2 ring-zinc-700 dark:bg-black">
          <div className="mb-1.5 h-2 w-16 rounded bg-zinc-500/50" />
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-sm bg-zinc-700/60 ring-1 ring-zinc-600/40 dark:bg-zinc-800 dark:ring-zinc-600/60"
              />
            ))}
          </div>
        </div>
      )
    default:
      return (
        <div className="grid h-full grid-cols-3 grid-rows-2 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn(cell(), "min-h-0")} />
          ))}
        </div>
      )
  }
}
