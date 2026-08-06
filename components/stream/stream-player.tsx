"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Hls from "hls.js"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, VolumeX, Maximize, Minimize, Play, Pause, RefreshCw, Settings, Check } from "lucide-react"

const REACTION_TYPES = [
  { type: "heart", emoji: "❤️" },
  { type: "thumbsup", emoji: "👍" },
  { type: "laugh", emoji: "😂" },
  { type: "fire", emoji: "🔥" },
  { type: "clap", emoji: "👏" },
] as const

interface StreamPlayerProps {
  hlsUrl: string | null
  youtubeUrl?: string | null
  embedUrl?: string | null
  isLive: boolean
  isPlayable?: boolean
  eventTitle: string
  streamType: "rtmp" | "hls" | "youtube" | "embedded" | "youtube_api" | "youtube_embed" | "third_party"
  allowReactions?: boolean
  onReaction?: (type: string) => void
}

export function StreamPlayer({
  hlsUrl,
  youtubeUrl,
  embedUrl,
  isLive,
  isPlayable = isLive,
  eventTitle,
  streamType,
  allowReactions,
  onReaction,
}: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [playbackBlocked, setPlaybackBlocked] = useState(false)
  const [reloadNonce, setReloadNonce] = useState(0)

  // Timeline seekbar & playback state
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isSeeking, setIsSeeking] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [qualities, setQualities] = useState<{ id: number; label: string }[]>([])
  const [selectedQuality, setSelectedQuality] = useState<number>(-1)

  const playVideo = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video
      .play()
      .then(() => {
        setPlaybackBlocked(false)
        setPlayerError(null)
        setIsPlaying(true)
      })
      .catch((error) => {
        console.warn("HLS playback blocked", { error, hlsUrl })
        setPlaybackBlocked(true)
        setIsPlaying(false)
      })
  }, [hlsUrl])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      if (!isSeeking) setCurrentTime(video.currentTime)
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        setDuration(video.duration)
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleDurationChange = () => {
      if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        setDuration(video.duration)
      }
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("durationchange", handleDurationChange)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("durationchange", handleDurationChange)
    }
  }, [isSeeking])

  useEffect(() => {
    if (streamType !== "rtmp" && streamType !== "hls") return
    if (!hlsUrl || !videoRef.current) return

    const video = videoRef.current
    video.muted = isMuted
    setPlayerError(null)
    setPlaybackBlocked(false)
    setQualities([])
    setSelectedQuality(-1)
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
      hls.on(Hls.Events.MANIFEST_PARSED, (_evt, data) => {
        if (data.levels && data.levels.length > 1) {
          const mapped = data.levels.map((lvl, index) => ({
            id: index,
            label: lvl.height ? `${lvl.height}p` : `Level ${index + 1}`,
          }))
          setQualities(mapped)
        }
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

        const details = String(data.details || "")
        if (details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR || details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT) {
          setPlayerError("HLS manifest is not available from the streaming server yet.")
          return
        }

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          setPlayerError("HLS network error from the streaming server. Retrying...")
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

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      playVideo()
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

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

  const handleSeek = (targetTime: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = targetTime
    setCurrentTime(targetTime)
  }

  const jumpToLive = () => {
    const video = videoRef.current
    if (!video) return
    if (duration > 0) {
      video.currentTime = duration - 1
    }
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds === Infinity || !isFinite(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
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
    <div ref={containerRef} className="relative aspect-video rounded-lg overflow-hidden bg-black group/player">
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
      ) : playbackBlocked && isPlayable ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/55 text-white">
          <p className="text-sm">Click to play {isLive ? "live stream" : "recording"}</p>
          <Button variant="outline" size="sm" onClick={playVideo}>
            <Play className="h-4 w-4 mr-2" />
            Play
          </Button>
        </div>
      ) : !isPlayable ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Volume2 className="h-6 w-6" />
          </div>
          <p className="text-sm">Waiting for stream to start...</p>
        </div>
      ) : null}

      <video
        ref={videoRef}
        className="h-full w-full object-contain cursor-pointer"
        autoPlay
        playsInline
        muted={isMuted}
        onClick={togglePlay}
        style={{ display: isPlayable && !playerError ? "block" : "none" }}
      />

      {/* Unified Controls Overlay */}
      {isPlayable && !playerError && (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pb-3 pt-6 transition-opacity duration-200">
          {/* Top Row: Video Timeline Seekbar */}
          <div className="relative mb-2 flex items-center gap-2 px-1">
            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 100}
              step={0.1}
              value={currentTime}
              onMouseDown={() => setIsSeeking(true)}
              onChange={(e) => {
                const val = Number(e.target.value)
                setCurrentTime(val)
                handleSeek(val)
              }}
              onMouseUp={() => setIsSeeking(false)}
              onTouchEnd={() => setIsSeeking(false)}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/30 accent-primary focus:outline-none transition-all hover:h-2"
              style={{
                background: duration > 0
                  ? `linear-gradient(to right, var(--primary, #3b82f6) ${(currentTime / duration) * 100}%, rgba(255, 255, 255, 0.3) ${(currentTime / duration) * 100}%)`
                  : "rgba(255, 255, 255, 0.3)",
              }}
            />
          </div>

          {/* Bottom Row: Controls */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Play/Pause, Mute, LIVE Badge, Title */}
            <div className="flex items-center gap-1.5 min-w-0">
              <Button variant="ghost" size="icon" onClick={togglePlay} className="h-8 w-8 text-white hover:bg-white/20 shrink-0">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
              </Button>

              <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8 text-white hover:bg-white/20 shrink-0">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>

              {isLive ? (
                <Badge
                  onClick={jumpToLive}
                  className="cursor-pointer border border-red-500/50 bg-red-600 text-white font-semibold text-[10px] px-2 py-0.5 shadow-none hover:bg-red-700 shrink-0 flex items-center gap-1"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/20 text-[10px] px-2 py-0.5 shrink-0">
                  Replay
                </Badge>
              )}

              <span className="text-white text-xs font-medium truncate max-w-[130px] sm:max-w-[200px]">
                {eventTitle}
              </span>
            </div>

            {/* Center: Reactions */}
            {allowReactions && (
              <div className="flex items-center gap-0.5 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/10 shrink-0">
                {REACTION_TYPES.map(({ type, emoji }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onReaction?.(type)}
                    className="text-base hover:scale-125 transition-transform px-1 py-0.5 select-none"
                    title={type}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Right: Time, Settings, Fullscreen */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-white/80 text-[11px] font-mono shrink-0">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {qualities.length > 0 && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className={`h-4 w-4 transition-transform ${showSettings ? "rotate-45" : ""}`} />
                  </Button>

                  {showSettings && (
                    <div className="absolute bottom-10 right-0 w-36 rounded-lg border border-white/10 bg-black/90 backdrop-blur-md p-1.5 text-white text-xs shadow-xl z-50">
                      <p className="text-[10px] text-white/50 px-2 py-1 uppercase tracking-wide">Quality</p>
                      <button
                        onClick={() => {
                          if (hlsRef.current) hlsRef.current.currentLevel = -1
                          setSelectedQuality(-1)
                          setShowSettings(false)
                        }}
                        className={`w-full text-left px-2 py-1 rounded hover:bg-white/10 flex items-center justify-between ${selectedQuality === -1 ? "text-primary font-medium" : ""}`}
                      >
                        Auto
                        {selectedQuality === -1 && <Check className="h-3 w-3" />}
                      </button>
                      {qualities.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => {
                            if (hlsRef.current) hlsRef.current.currentLevel = q.id
                            setSelectedQuality(q.id)
                            setShowSettings(false)
                          }}
                          className={`w-full text-left px-2 py-1 rounded hover:bg-white/10 flex items-center justify-between ${selectedQuality === q.id ? "text-primary font-medium" : ""}`}
                        >
                          {q.label}
                          {selectedQuality === q.id && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8 text-white hover:bg-white/20">
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

