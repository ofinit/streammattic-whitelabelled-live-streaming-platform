import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
        <Skeleton className="h-6 w-32" />
      </div>
      <main className="flex-1 p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-[600px] w-full rounded-lg" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[400px] w-full rounded-lg" />
          </div>
        </div>
      </main>
    </div>
  )
}
