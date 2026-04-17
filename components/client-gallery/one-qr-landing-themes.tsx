"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Loader2, Pencil } from "lucide-react"
import {
  LANDING_THEME_CATEGORY_TABS,
  categoryForTheme,
  themesForCategory,
  type ThemeConfig,
} from "@/lib/landing-themes"
import type { LandingTheme, LandingThemeCategory } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type OneQrLandingThemesProps = {
  /** Active theme from saved branding */
  currentThemeId: LandingTheme | undefined
  brandingHref: string
  /** When true, streamer has no /site yet — themes still apply to future /site once branding exists */
  siteNote?: string
  applyingThemeId: string | null
  onApply: (theme: ThemeConfig) => void
}

function ThemeMiniPreview({ theme }: { theme: ThemeConfig }) {
  return (
    <div className="relative mb-4 flex h-32 flex-col gap-2 overflow-hidden rounded-lg bg-zinc-900 p-3">
      <div className="h-4 w-2/3 rounded bg-white/20" />
      <div className="flex gap-2">
        <div className="h-8 w-8 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-full rounded bg-white/10" />
          <div className="h-3 w-3/4 rounded bg-white/10" />
        </div>
      </div>
      <div className="mt-auto h-8 w-full rounded" style={{ backgroundColor: theme.accentColor }} />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
    </div>
  )
}

export function OneQrLandingThemes({
  currentThemeId,
  brandingHref,
  siteNote,
  applyingThemeId,
  onApply,
}: OneQrLandingThemesProps) {
  const resolvedCurrent: LandingTheme = currentThemeId || "modern_emerald"

  const [tab, setTab] = useState<LandingThemeCategory>(
    () => categoryForTheme(resolvedCurrent) ?? "events",
  )

  useEffect(() => {
    const c = categoryForTheme(resolvedCurrent)
    if (c) setTab(c)
  }, [resolvedCurrent])

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">Landing design</CardTitle>
        <CardDescription>
          Choose a preset for your public <code className="rounded bg-muted px-1 py-0.5 text-xs">/site</code> page.
          Same options as{" "}
          <Link href={brandingHref} className="text-primary underline-offset-4 hover:underline">
            Branding → Themes
          </Link>
          .
          {siteNote ? ` ${siteNote}` : null}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as LandingThemeCategory)}
          className="w-full"
        >
          <TabsList className="mb-6 grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-4">
            {LANDING_THEME_CATEGORY_TABS.map(({ id, label }) => (
              <TabsTrigger key={id} value={id} className="text-xs sm:text-sm">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {LANDING_THEME_CATEGORY_TABS.map(({ id }) => (
            <TabsContent key={id} value={id} className="mt-0">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {themesForCategory(id).map((theme) => {
                  const isActive = resolvedCurrent === theme.id
                  const isBusy = applyingThemeId === theme.id
                  return (
                    <div
                      key={theme.id}
                      className={cn(
                        "relative flex flex-col rounded-xl border-2 p-4 transition-all",
                        isActive ? "border-primary bg-primary/5 shadow-sm" : "border-border",
                      )}
                    >
                      {isActive && (
                        <div className="absolute right-2 top-2 z-10">
                          <CheckCircle2 className="h-5 w-5 fill-background text-primary" aria-hidden />
                        </div>
                      )}

                      <ThemeMiniPreview theme={theme} />

                      <div className="space-y-1">
                        <h4 className="font-semibold text-foreground">{theme.name}</h4>
                        <p className="text-xs leading-relaxed text-muted-foreground">{theme.description}</p>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex gap-1">
                          <div
                            className="h-4 w-4 rounded-full border border-border"
                            style={{ backgroundColor: theme.primaryColor }}
                          />
                          <div
                            className="h-4 w-4 rounded-full border border-border"
                            style={{ backgroundColor: theme.accentColor }}
                          />
                        </div>
                        <span className="text-[10px] font-medium uppercase text-muted-foreground">
                          {theme.fontFamily.split(",")[0]?.replace(/'/g, "") ?? ""}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="gap-1"
                          disabled={isBusy || isActive}
                          onClick={() => onApply(theme)}
                        >
                          {isBusy ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Applying…
                            </>
                          ) : isActive ? (
                            "Applied"
                          ) : (
                            "Apply"
                          )}
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="gap-1" asChild>
                          <Link href={brandingHref}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
