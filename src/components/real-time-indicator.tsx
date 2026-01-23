"use client";

import { useState, useEffect } from "react";
import { Badge } from "~/components/ui/badge";

interface RealTimeIndicatorProps {
  lastUpdate: Date | null;
  isLoading: boolean;
  error: Error | null;
  isConnected?: boolean;
}

export function RealTimeIndicator({
  lastUpdate,
  isLoading,
  error,
  isConnected = true,
}: RealTimeIndicatorProps) {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>("just now");

  useEffect(() => {
    if (!lastUpdate) return;

    const updateTimer = () => {
      const now = new Date();
      const diffInSeconds = Math.floor(
        (now.getTime() - lastUpdate.getTime()) / 1000
      );

      if (diffInSeconds < 5) {
        setTimeSinceUpdate("just now");
      } else if (diffInSeconds < 60) {
        setTimeSinceUpdate(`${diffInSeconds}s ago`);
      } else if (diffInSeconds < 3600) {
        setTimeSinceUpdate(`${Math.floor(diffInSeconds / 60)}m ago`);
      } else {
        setTimeSinceUpdate(`${Math.floor(diffInSeconds / 3600)}h ago`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  if (error) {
    return (
      <Badge
        variant="destructive"
        className="border-red-700 bg-red-900 text-red-100"
      >
        Connection Error
      </Badge>
    );
  }

  if (isLoading || !isConnected) {
    return (
      <Badge
        variant="secondary"
        className="border-yellow-700 bg-yellow-900 text-yellow-100"
      >
        Connecting...
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="border-green-700 bg-green-900 text-green-100"
    >
      Live {lastUpdate ? `• ${timeSinceUpdate}` : ""}
    </Badge>
  );
}
