import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms governing use of the StreamLivee live streaming platform.",
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
