"use client"

import { HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

interface HelpTipProps {
  text: string
  link?: string
  linkLabel?: string
}

export function HelpTip({ text, link, linkLabel }: HelpTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors ml-1.5 align-middle focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Help"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-left leading-relaxed">
        <p>{text}</p>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-primary underline underline-offset-2 hover:text-primary/80"
          >
            {linkLabel || "Learn more"}
          </a>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
