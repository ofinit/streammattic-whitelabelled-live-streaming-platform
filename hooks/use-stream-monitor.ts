"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { NimbleStreamStats } from "@/lib/types"

interface UseStreamMonitorOptions {
  eventId: string
  enabled: boolean
  pollInterval?: number // ms, default 5000
}

interface StreamMonitorState {
  stats: NimbleStreamStats | null
  isLoading: boolean
  error: string | null
  history: NimbleStreamStats[]
  isConnected: boolean
}

export function useStreamMonitor({ eventId, enabled, pollInterval = 5000 }: UseStreamMonitorOptions): StreamMonitorState {
  const [stats, setStats] = useState<NimbleStreamStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<NimbleStreamStats[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)

  const fetchStats = useCallback(async () => {
    if (!eventId || !enabled) return

    try {
      const res = await fetch(`/api/stream/status?eventId=${eventId}`)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()
      if (data.success && data.stats) {
        setStats(data.stats)
        setIsConnected(true)
        setError(null)
        retryCountRef.current = 0

        // Add to history (keep last 60 data points for charts)
        setHistory((prev) => {
          const updated = [...prev, data.stats]
          return updated.slice(-60)
        })
      }
    } catch (err) {
      retryCountRef.current += 1
      if (retryCountRef.current >= 3) {
        setError("Connection lost. Retrying...")
        setIsConnected(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [eventId, enabled])

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Initial fetch
    fetchStats()

    // Set up polling
    intervalRef.current = setInterval(fetchStats, pollInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, pollInterval, fetchStats])

  return { stats, isLoading, error, history, isConnected }
}
