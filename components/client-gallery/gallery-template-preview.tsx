import { cn } from "@/lib/utils"

type Props = { templateId: string; className?: string }

/** Mini layout chrome so previews read clearly in light and dark themes (not flat gradients). */
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
    case "classic-grid":
      return (
        <div className="grid h-full grid-cols-3 grid-rows-2 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn(cell(), "min-h-0")} />
          ))}
        </div>
      )
    case "hero-ribbon":
      return (
        <div className="flex h-full flex-col gap-1.5">
          <div className="h-[28%] shrink-0 rounded-md bg-primary/45 ring-1 ring-primary/30" />
          <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn(cell(), "min-h-0")} />
            ))}
          </div>
        </div>
      )
    case "masonry-flow":
      return (
        <div className="flex h-full gap-1.5">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className={cn(cell(), "h-[38%]")} />
            <div className={cn(cell(), "min-h-0 flex-1")} />
            <div className={cn(cell(), "h-[22%]")} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className={cn(cell(), "h-[52%]")} />
            <div className={cn(cell(), "min-h-0 flex-1")} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className={cn(cell(), "h-[30%]")} />
            <div className={cn(cell(), "h-[28%]")} />
            <div className={cn(cell(), "min-h-0 flex-1")} />
          </div>
        </div>
      )
    case "bento-modern":
      return (
        <div className="grid h-full grid-cols-3 grid-rows-3 gap-1.5">
          <div className={cn(cell(), "col-span-2 row-span-2")} />
          <div className={cn(cell(), "row-span-3")} />
          <div className={cn(cell(), "col-span-2")} />
        </div>
      )
    case "wedding-soft":
      return (
        <div className="flex h-full flex-col gap-1.5 rounded-md bg-gradient-to-br from-rose-200/50 via-background to-violet-200/40 p-1.5 dark:from-rose-900/50 dark:via-background dark:to-violet-900/40">
          <div className="h-[32%] shrink-0 rounded-md bg-foreground/15 ring-1 ring-rose-300/40 dark:bg-white/10 dark:ring-rose-500/25" />
          <div className="grid min-h-0 flex-1 grid-cols-4 gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn(cell(), "min-h-0")} />
            ))}
          </div>
        </div>
      )
    case "lavender-dream":
      return (
        <div className="flex h-full flex-col gap-1.5 rounded-md bg-gradient-to-br from-violet-200/55 via-background to-fuchsia-200/45 p-1.5 dark:from-violet-900/55 dark:via-background dark:to-fuchsia-900/45">
          <div className="mx-auto h-[26%] w-[72%] shrink-0 rounded-full bg-foreground/12 ring-1 ring-violet-400/35 dark:bg-white/10" />
          <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn(cell(), "min-h-0 rounded-md")} />
            ))}
          </div>
        </div>
      )
    case "sports-bold":
      return (
        <div className="flex h-full flex-col gap-1">
          <div className="h-[22%] shrink-0 rounded-sm bg-primary shadow-sm ring-2 ring-primary/50" />
          <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-2 gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={cn(cell(), "min-h-0 bg-foreground/25 dark:bg-white/20")} />
            ))}
          </div>
        </div>
      )
    case "minimal-dark":
      return (
        <div className="flex h-full items-stretch justify-center rounded-md bg-zinc-950 p-2 ring-2 ring-zinc-700 dark:bg-black">
          <div className="grid w-full grid-cols-2 grid-rows-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-sm bg-zinc-100/90 ring-1 ring-zinc-300/50 dark:bg-zinc-800 dark:ring-zinc-600/60"
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
