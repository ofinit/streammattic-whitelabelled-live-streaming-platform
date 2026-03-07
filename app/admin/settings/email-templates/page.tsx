"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { EmailTemplatePreview } from "@/components/notifications/email-template-preview"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { mockEmailTemplates } from "@/lib/mock-data"

export default function EmailTemplatesPage() {
  const [search, setSearch] = useState("")

  const filteredTemplates = mockEmailTemplates.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.type.toLowerCase().includes(search.toLowerCase()),
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
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {filteredTemplates.map((template) => (
            <EmailTemplatePreview key={template.id} template={template} />
          ))}
        </div>
      </main>
    </div>
  )
}
