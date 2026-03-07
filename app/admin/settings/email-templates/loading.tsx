import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
        <Skeleton className="h-6 w-40" />
      </div>
      <main className="flex-1 p-6">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96 w-full rounded-lg" />
          ))}
        </div>
      </main>
    </div>
  )
}
