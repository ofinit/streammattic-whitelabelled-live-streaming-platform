"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { Header } from "@/components/dashboard/header"
import { EmailTemplatePreview } from "@/components/notifications/email-template-preview"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import type { EmailTemplate } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function EmailTemplatesPage() {
  const [search, setSearch] = useState("")
  const { data, error, isLoading } = useSWR("/api/admin/email-templates", fetcher)

  const templates = useMemo(() => data?.data?.templates || [], [data])

  const filteredTemplates = useMemo(() => 
    templates.filter(
      (t: EmailTemplate) => 
        t.name.toLowerCase().includes(search.toLowerCase()) || 
        t.type.toLowerCase().includes(search.toLowerCase())
    ),
    [templates, search]
  )

  return (
    <div className="flex flex-col">
      <Header title="Email Templates" subtitle="Preview and manage email templates" />
      <main className="flex-1">
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No email templates found.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredTemplates.map((template: EmailTemplate) => (
              <EmailTemplatePreview key={template.id} template={template} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
