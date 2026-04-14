"use client"

import { createContext, useContext } from "react"

/** DOM node of the main Create/Edit Event `DialogContent` — portaled UI must mount here so Radix does not mark it `inert`. */
export const EventFormDialogContentElementContext = createContext<HTMLElement | null>(null)

export function useEventFormDialogContentElement() {
  return useContext(EventFormDialogContentElementContext)
}
