"use client"

import useSWR from "swr"
import { useState, useCallback, useMemo, useEffect } from "react"
import type { Prisma } from "@prisma/client"

export type Flight = Prisma.flightsGetPayload<{
  select: {
    id: true
    callsign: true
    aircraft_type: true
    departure: true
    arrival: true
    altitude: true
    speed: true
    status: true
    notes: true
    created_at: true
    updated_at: true
  }
}>

interface UseFlightsResult {
  flights: Flight[]
  isLoading: boolean
  error: any
  lastUpdate: string | null
  createFlight: (flightData: Omit<Flight, "id" | "created_at" | "updated_at">) => Promise<Flight>
  updateFlight: (id: string, flightData: Partial<Omit<Flight, "id" | "created_at" | "updated_at">>) => Promise<Flight>
  deleteFlight: (id: string) => Promise<void>
}

// Custom fetcher for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.")
    throw error
  }
  return res.json()
}

export function useFlights(realtime = false): UseFlightsResult {
  const { data, error, isLoading, mutate } = useSWR<{ flights: Flight[] }>("/api/flights", fetcher, {
    refreshInterval: realtime ? 5000 : 0,
    revalidateOnFocus: realtime,
    fallbackData: { flights: [] },
  })

  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

useEffect(() => {
  if (data?.flights && data.flights.length > 0) {
    // Convert string dates to Date objects for proper numerical comparison
    const sortedFlights = [...data.flights].sort((a, b) => {
      const dateA = new Date(a.updated_at);
      const dateB = new Date(b.updated_at);
      return dateB.getTime() - dateA.getTime();
    });

    const latestFlight = sortedFlights[0];

    if (latestFlight) {
      // The updated_at property is a string from the API.
      // You can either use the original string or, if you want a new
      // ISO string from the Date object, you must call toISOString().
      // This is the line that will fix your runtime and type errors:
      setLastUpdate(new Date(latestFlight.updated_at).toISOString());
    } else {
      setLastUpdate(null);
    }
  } else {
    setLastUpdate(null);
  }
}, [data]);

  const flights = useMemo(() => data?.flights || [], [data])

  const createFlight = useCallback(
    async (flightData: Omit<Flight, "id" | "created_at" | "updated_at">): Promise<Flight> => {
      const res = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flightData),
      })
      if (!res.ok) {
        throw new Error("Failed to create flight.")
      }
      const newFlight = await res.json()
      void mutate() // Corrected: Use 'void' to mark the promise as intentionally unhandled
      return newFlight
    },
    [mutate],
  )

  const updateFlight = useCallback(
    async (
      id: string,
      flightData: Partial<Omit<Flight, "id" | "created_at" | "updated_at">>,
    ): Promise<Flight> => {
      const res = await fetch(`/api/flights/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flightData),
      })
      if (!res.ok) {
        throw new Error("Failed to update flight.")
      }
      const updatedFlight = await res.json()
      void mutate() // Corrected: Use 'void' to mark the promise as intentionally unhandled
      return updatedFlight
    },
    [mutate],
  )

  const deleteFlight = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/flights/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      throw new Error("Failed to delete flight.")
    }
    void mutate() // Corrected: Use 'void' to mark the promise as intentionally unhandled
  }, [mutate])

  return {
    flights,
    isLoading,
    error,
    lastUpdate,
    createFlight,
    updateFlight,
    deleteFlight,
  }
}