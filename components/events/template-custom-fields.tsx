"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, ImageIcon } from "lucide-react"
import { getTemplateFields, type TemplateField, type TemplateFieldGroup } from "@/lib/template-fields"
import type { TemplateData } from "@/lib/types"
import { EVENT_TEMPLATES } from "@/lib/template-registry"

interface TemplateCustomFieldsProps {
  templateId: string
  data: TemplateData
  onChange: (data: TemplateData) => void
  errors?: Record<string, string>
}

export function TemplateCustomFields({ templateId, data, onChange, errors = {} }: TemplateCustomFieldsProps) {
  const [fieldGroups, setFieldGroups] = useState<TemplateFieldGroup[]>([])

  // Get template info
  const template = EVENT_TEMPLATES.find((t) => t.id === templateId)

  useEffect(() => {
    if (templateId && template) {
      const groups = getTemplateFields(templateId, template.category)
      setFieldGroups(groups)
    }
  }, [templateId, template])

  const handleFieldChange = (key: string, value: string | number | boolean | null) => {
    onChange({
      ...data,
      [key]: value,
    })
  }

  const handleImageUpload = (key: string, file: File) => {
    // In a real app, this would upload to a server and return a URL
    // For now, we'll create a data URL for preview
    const reader = new FileReader()
    reader.onloadend = () => {
      handleFieldChange(key, reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const renderField = (field: TemplateField) => {
    const value = data[field.key]
    const error = errors[field.key]

    switch (field.type) {
      case "text":
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              value={(value as string) || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
            />
            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      case "textarea":
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.key}
              value={(value as string) || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              rows={3}
            />
            {field.maxLength && (
              <p className="text-xs text-muted-foreground text-right">
                {((value as string) || "").length}/{field.maxLength}
              </p>
            )}
            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      case "number":
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type="number"
              value={(value as number) || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value ? Number(e.target.value) : null)}
              placeholder={field.placeholder}
            />
            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      case "date":
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type="date"
              value={(value as string) || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
            />
            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      case "time":
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.key}
              type="time"
              value={(value as string) || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
            />
            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      case "select":
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select value={(value as string) || ""} onValueChange={(v) => handleFieldChange(field.key, v)}>
              <SelectTrigger id={field.key}>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      case "image":
        return (
          <div key={field.key} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {value ? (
              <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                <img
                  src={(value as string) || "/placeholder.svg"}
                  alt={field.label}
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => handleFieldChange(field.key, null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg hover:bg-muted transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload Image</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(field.key, file)
                    }}
                  />
                </label>
                <div className="w-16 h-16 border border-dashed rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            )}
            {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      default:
        return null
    }
  }

  if (!templateId || !template) {
    return (
      <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
        <p className="text-muted-foreground">Select a template to customize its fields</p>
      </div>
    )
  }

  if (fieldGroups.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(var(--primary))" }} />
        <h3 className="font-medium">Customize: {template.name}</h3>
      </div>

      {fieldGroups.map((group, groupIndex) => (
        <Card key={groupIndex} className="border-muted">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium">{group.title}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid gap-4 sm:grid-cols-2">{group.fields.map((field) => renderField(field))}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
