"use client"

import { useState, useEffect, useCallback } from "react"
import useSWR from "swr"

export interface Flight {
  id: string
  callsign: string
  aircraft_type: string
  departure: string
  arrival: string
  altitude: string
  speed: string
  status: "delivery" | "ground" | "tower" | "departure" | "approach" | "control"
  notes: string
  created_at: string
  updated_at: string
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Failed to fetch")
  }
  return response.json()
}

export function useFlights(enableRealtime = true) {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  // Main data fetching with SWR
  const { data, error, mutate, isLoading } = useSWR<{ flights: Flight[] }>("/api/flights", fetcher, {
    refreshInterval: enableRealtime ? 1000 : 0, // Poll every 3 seconds if realtime enabled
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  // Update lastUpdate timestamp when data changes
  useEffect(() => {
    if (data?.flights && data.flights.length > 0) {
      const latest = data.flights.reduce((latest, flight) => {
        return new Date(flight.updated_at) > new Date(latest) ? flight.updated_at : latest
      }, data.flights[0].updated_at)
      setLastUpdate(latest)
    }
  }, [data])

  // Create a new flight
  const createFlight = useCallback(
    async (flightData: Omit<Flight, "id" | "created_at" | "updated_at">) => {
      try {
        const response = await fetch("/api/flights", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(flightData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to create flight")
        }

        const result = await response.json()

        // Optimistically update the cache
        mutate()

        return result.flight
      } catch (error) {
        console.error("Error creating flight:", error)
        throw error
      }
    },
    [mutate],
  )

  // Update a flight
  const updateFlight = useCallback(
    async (id: string, updates: Partial<Omit<Flight, "id" | "created_at" | "updated_at">>) => {
      try {
        const response = await fetch(`/api/flights/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to update flight")
        }

        const result = await response.json()

        // Optimistically update the cache
        mutate()

        return result.flight
      } catch (error) {
        console.error("Error updating flight:", error)
        throw error
      }
    },
    [mutate],
  )

  // Delete a flight
  const deleteFlight = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/flights/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to delete flight")
        }

        // Optimistically update the cache
        mutate()

        return true
      } catch (error) {
        console.error("Error deleting flight:", error)
        throw error
      }
    },
    [mutate],
  )

  // Get flight history
  const getFlightHistory = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/flights/history/${id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch flight history")
      }
      const result = await response.json()
      return result.history
    } catch (error) {
      console.error("Error fetching flight history:", error)
      throw error
    }
  }, [])

  return {
    flights: data?.flights || [],
    isLoading,
    error,
    lastUpdate,
    createFlight,
    updateFlight,
    deleteFlight,
    getFlightHistory,
    refresh: mutate,
  }
}
