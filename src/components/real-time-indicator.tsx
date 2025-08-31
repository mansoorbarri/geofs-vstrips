"use client"

import { useState, useEffect } from "react"
import { Badge } from "~/components/ui/badge"

interface RealTimeIndicatorProps {
  lastUpdate: string | null
  isLoading: boolean
  error: any
}

export function RealTimeIndicator({ lastUpdate, isLoading, error }: RealTimeIndicatorProps) {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>("")

  useEffect(() => {
    if (!lastUpdate) return

    const updateTimer = () => {
      const now = new Date()
      const updateTime = new Date(lastUpdate)
      const diffInSeconds = Math.floor((now.getTime() - updateTime.getTime()) / 1000)

      if (diffInSeconds < 60) {
        setTimeSinceUpdate(`${diffInSeconds}s ago`)
      } else if (diffInSeconds < 3600) {
        setTimeSinceUpdate(`${Math.floor(diffInSeconds / 60)}m ago`)
      } else {
        setTimeSinceUpdate(`${Math.floor(diffInSeconds / 3600)}h ago`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [lastUpdate])

  if (error) {
    return (
      <Badge variant="destructive" className="bg-red-900 text-red-100 border-red-700">
        Connection Error
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Badge variant="secondary" className="bg-yellow-900 text-yellow-100 border-yellow-700">
        Connecting...
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="bg-green-900 text-green-100 border-green-700">
      Live • {timeSinceUpdate}
    </Badge>
  )
}
