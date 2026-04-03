"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Copy, Check, Loader2 } from "lucide-react"

/** eventId may be numeric id or public slug — same as /api/watch/[eventId]/... */
export function CrewCredentialsContent({ eventId }: { eventId: string }) {
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [credentials, setCredentials] = useState<{ rtmpUrl: string; streamKey: string } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!pin.trim()) {
      setError("Enter the crew PIN")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/watch/${encodeURIComponent(eventId)}/crew-credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to verify PIN")
        setCredentials(null)
        return
      }
      setCredentials({ rtmpUrl: data.rtmpUrl || "", streamKey: data.streamKey || "" })
    } catch {
      setError("Network error")
      setCredentials(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Crew stream credentials
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter the PIN shared by the event organizer to view the stream URL and key.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!credentials ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={12}
                  className="font-mono"
                  disabled={loading}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "View credentials"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">RTMP URL (FMS / Server)</Label>
                <div className="flex gap-2">
                  <Input value={credentials.rtmpUrl} readOnly className="font-mono text-sm" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credentials.rtmpUrl, "rtmp")}
                  >
                    {copied === "rtmp" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Stream key</Label>
                <div className="flex gap-2">
                  <Input value={credentials.streamKey} readOnly type="password" className="font-mono text-sm" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credentials.streamKey, "key")}
                  >
                    {copied === "key" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setCredentials(null); setPin(""); setError("") }}>
                Hide credentials
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
