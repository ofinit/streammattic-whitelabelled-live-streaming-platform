"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, VolumeX, Maximize, Minimize, RefreshCw } from "lucide-react"

interface StreamPlayerProps {
  hlsUrl: string | null
  youtubeUrl?: string | null
  embedUrl?: string | null
  isLive: boolean
  eventTitle: string
  streamType: "rtmp" | "hls" | "youtube" | "embedded" | "youtube_api" | "youtube_embed" | "third_party"
}

export function StreamPlayer({ hlsUrl, youtubeUrl, embedUrl, isLive, eventTitle, streamType }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playerError, setPlayerError] = useState<string | null>(null)

  useEffect(() => {
    if (streamType !== "rtmp" && streamType !== "hls") return
    if (!hlsUrl || !videoRef.current) return

    const video = videoRef.current
    video.muted = isMuted

    // Native HLS support (Safari)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl
      video.play().catch(() => setPlayerError("Playback blocked - click to play"))
      return
    }

    // Dynamic import of hls.js for other browsers
    import("hls.js")
      .then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            liveSyncDurationCount: 3,
          })
          hls.loadSource(hlsUrl)
          hls.attachMedia(video)
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => setPlayerError("Playback blocked - click to play"))
          })
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              setPlayerError("Stream connection lost. Retrying...")
              setTimeout(() => {
                hls.destroy()
                hls.loadSource(hlsUrl)
                hls.attachMedia(video)
              }, 3000)
            }
          })
          return () => hls.destroy()
        } else {
          setPlayerError("HLS playback not supported in this browser")
        }
      })
      .catch(() => {
        // hls.js not installed, show fallback
        setPlayerError("Video player library not available. Install hls.js for HLS playback.")
      })
  }, [hlsUrl, streamType, isMuted])

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setIsFullscreen(!isFullscreen)
  }

  // YouTube embed
  if (streamType === "youtube" || streamType === "youtube_api" || streamType === "youtube_embed") {
    const videoId = youtubeUrl?.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1]
    if (!videoId && !youtubeUrl) {
      return (
        <Card className="flex items-center justify-center aspect-video bg-muted">
          <p className="text-muted-foreground">No YouTube URL configured</p>
        </Card>
      )
    }

    return (
      <div ref={containerRef} className="relative aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId || ""}?autoplay=1&mute=1`}
          title={eventTitle}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {isLive && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-red-600 text-white font-semibold">LIVE</Badge>
          </div>
        )}
      </div>
    )
  }

  // Third-party embed (iframe)
  if (streamType === "embedded" || streamType === "third_party") {
    return (
      <div ref={containerRef} className="relative aspect-video rounded-lg overflow-hidden bg-black">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={eventTitle}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            No embed URL configured
          </div>
        )}
        {isLive && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-red-600 text-white font-semibold">LIVE</Badge>
          </div>
        )}
      </div>
    )
  }

  // RTMP / HLS native player
  return (
    <div ref={containerRef} className="relative aspect-video rounded-lg overflow-hidden bg-black">
      {playerError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <p className="text-sm">{playerError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setPlayerError(null)
              videoRef.current?.play()
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      ) : !isLive ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Volume2 className="h-6 w-6" />
          </div>
          <p className="text-sm">Waiting for stream to start...</p>
        </div>
      ) : null}

      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        autoPlay
        playsInline
        muted={isMuted}
        style={{ display: isLive && !playerError ? "block" : "none" }}
      />

      {/* Controls overlay */}
      {isLive && !playerError && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-red-600 text-white font-semibold">LIVE</Badge>
              <span className="text-white text-sm">{eventTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
