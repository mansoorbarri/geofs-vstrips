// src/hooks/use-flights.ts
"use client"
import useSWR from "swr"
import { useState, useCallback, useMemo, useEffect } from "react"
import type { Prisma } from "@prisma/client"

// src/hooks/use-flights.ts

export interface Flight {
  id: string;
  created_at: string;
  updated_at: string;
  airport: string;
  callsign: string;
  geofs_callsign: string | null;
  discord_username: string | null; // NEW: Discord username
  aircraft_type: string;
  departure: string;
  departure_time: string | null; // NEW: Departure time
  arrival: string;
  altitude: string;
  speed: string;
  status: string;
  notes: string | null;
}


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

// UPDATED: Added optional airport parameter
export function useFlights(realtime = false, airport?: string): UseFlightsResult {
  // UPDATED: Build URL with airport query parameter if provided
  const apiUrl = useMemo(() => {
    const baseUrl = "/api/flights"
    if (airport) {
      return `${baseUrl}?airport=${encodeURIComponent(airport)}`
    }
    return baseUrl
  }, [airport])

  const { data, error, isLoading, mutate } = useSWR<{ flights: Flight[] }>(
    apiUrl,  // UPDATED: Use dynamic URL
    fetcher,
    {
      refreshInterval: realtime ? 5000 : 0,
      revalidateOnFocus: realtime,
      fallbackData: { flights: [] },
    }
  )

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
        setLastUpdate(new Date(latestFlight.updated_at).toISOString());
      } else {
        setLastUpdate(null);
      }
    } else {
      setLastUpdate(null);
    }
  }, [data]);

  const flights = useMemo(() => data?.flights || [], [data])

  // UPDATED: Include airport in createFlight
  const createFlight = useCallback(
    async (flightData: Omit<Flight, "id" | "created_at" | "updated_at">): Promise<Flight> => {
      // Ensure airport is included in the flight data
      const flightDataWithAirport = {
        ...flightData,
        airport: flightData.airport || airport || "", // Use provided airport as fallback
      }

      const res = await fetch("/api/flights/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flightDataWithAirport),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to create flight.")
      }

      const newFlight = await res.json()
      void mutate() // Revalidate the SWR cache
      return newFlight
    },
    [mutate, airport],
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
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to update flight.")
      }

      const updatedFlight = await res.json()
      void mutate() // Revalidate the SWR cache
      return updatedFlight
    },
    [mutate],
  )

  const deleteFlight = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/flights/${id}`, {
      method: "DELETE",
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || "Failed to delete flight.")
    }

    void mutate() // Revalidate the SWR cache
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