"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Hls from "hls.js"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, VolumeX, Maximize, Minimize, Play, RefreshCw } from "lucide-react"

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
  const hlsRef = useRef<Hls | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [playbackBlocked, setPlaybackBlocked] = useState(false)
  const [reloadNonce, setReloadNonce] = useState(0)

  const playVideo = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video
      .play()
      .then(() => {
        setPlaybackBlocked(false)
        setPlayerError(null)
      })
      .catch((error) => {
        console.warn("HLS playback blocked", { error, hlsUrl })
        setPlaybackBlocked(true)
      })
  }, [hlsUrl])

  useEffect(() => {
    if (streamType !== "rtmp" && streamType !== "hls") return
    if (!hlsUrl || !videoRef.current) return

    const video = videoRef.current
    video.muted = isMuted
    setPlayerError(null)
    setPlaybackBlocked(false)
    hlsRef.current?.destroy()
    hlsRef.current = null

    // Native HLS support (Safari)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl
      video.load()
      playVideo()
      return () => {
        video.removeAttribute("src")
        video.load()
      }
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveSyncDurationCount: 3,
      })
      hlsRef.current = hls
      hls.attachMedia(video)
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(hlsUrl)
      })
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        playVideo()
      })
      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.warn("HLS error", {
          type: data.type,
          details: data.details,
          fatal: data.fatal,
          hlsUrl,
        })

        if (!data.fatal) return

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          setPlayerError("Stream network error. Retrying...")
          hls.startLoad()
          return
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          setPlayerError("Stream media error. Recovering...")
          hls.recoverMediaError()
          return
        }

        setPlayerError("Stream connection lost.")
      })

      return () => {
        hls.destroy()
        hlsRef.current = null
      }
    }

    setPlayerError("HLS playback not supported in this browser")
  }, [hlsUrl, streamType, isMuted, playVideo, reloadNonce])

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

    const baseId = videoId || ""
    const liveParams = "autoplay=1&mute=1&controls=0&rel=0&iv_load_policy=3&modestbranding=1"
    const replayParams = "autoplay=1&mute=1&rel=0&iv_load_policy=3&modestbranding=1"
    const src = `https://www.youtube.com/embed/${baseId}?${isLive ? liveParams : replayParams}`

    return (
      <div ref={containerRef} className="relative aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={src}
          title={eventTitle}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {isLive && (
          <div className="absolute top-3 left-3">
            <Badge className="border border-zinc-500/50 bg-zinc-600 text-white font-semibold shadow-none">LIVE</Badge>
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
            <Badge className="border border-zinc-500/50 bg-zinc-600 text-white font-semibold shadow-none">LIVE</Badge>
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
              setPlaybackBlocked(false)
              setReloadNonce((value) => value + 1)
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      ) : playbackBlocked && isLive ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/55 text-white">
          <p className="text-sm">Click to play live stream</p>
          <Button variant="outline" size="sm" onClick={playVideo}>
            <Play className="h-4 w-4 mr-2" />
            Play
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
              <Badge className="border border-zinc-500/50 bg-zinc-600 text-white font-semibold shadow-none">LIVE</Badge>
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
