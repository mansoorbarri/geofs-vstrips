"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { Doc } from "../../convex/_generated/dataModel";
import { useMemo, useCallback, useRef, useEffect, useState } from "react";

// Use the generated Convex document type for type safety
export type Flight = Doc<"flights">;

// Legacy interface for compatibility
export interface LegacyFlight {
  id: string;
  created_at: string;
  updated_at: string;
  airport: string;
  callsign: string;
  geofs_callsign: string | null;
  discord_username: string | null;
  aircraft_type: string;
  departure: string;
  departure_time: string | null;
  arrival: string;
  altitude: string;
  squawk: string | null;
  speed: string;
  status: string;
  route: string | null;
  notes: string | null;
}

export type FlightStatus = "delivery" | "ground" | "tower" | "departure" | "approach" | "control";

interface UseFlightsResult {
  flights: LegacyFlight[];
  isLoading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  isConnected: boolean;
  createFlight: (
    flightData: Omit<LegacyFlight, "id" | "created_at" | "updated_at">
  ) => Promise<LegacyFlight>;
  updateFlight: (
    id: string,
    flightData: Partial<Omit<LegacyFlight, "id" | "created_at" | "updated_at">>
  ) => Promise<LegacyFlight>;
  deleteFlight: (id: string) => Promise<void>;
}

// Convert Convex flight to legacy format for compatibility
function toLeglightFlight(flight: Flight): LegacyFlight {
  return {
    id: flight._id,
    created_at: new Date(flight._creationTime).toISOString(),
    updated_at: new Date(flight._creationTime).toISOString(),
    airport: flight.airport,
    callsign: flight.callsign,
    geofs_callsign: flight.geofs_callsign ?? null,
    discord_username: flight.discord_username ?? null,
    aircraft_type: flight.aircraft_type,
    departure: flight.departure,
    departure_time: flight.departure_time ?? null,
    arrival: flight.arrival,
    altitude: flight.altitude,
    squawk: flight.squawk ?? null,
    speed: flight.speed,
    status: flight.status,
    route: flight.route ?? null,
    notes: flight.notes ?? null,
  };
}

export function useFlights(
  _realtime = false, // No longer needed - Convex is always real-time
  airport?: string
): UseFlightsResult {
  const flightsData = useQuery(api.flights.list, { airport });
  const createFlightMutation = useMutation(api.flights.create);
  const updateFlightMutation = useMutation(api.flights.update);
  const deleteFlightMutation = useMutation(api.flights.remove);

  // Track when data actually changes for real-time indicator
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const previousDataRef = useRef<string | null>(null);

  const isLoading = flightsData === undefined;

  const flights = useMemo(() => {
    if (!flightsData) return [];
    return flightsData.map(toLeglightFlight);
  }, [flightsData]);

  // Update lastUpdate when data actually changes (real-time detection)
  useEffect(() => {
    if (flightsData) {
      const dataHash = JSON.stringify(flightsData.map(f => ({ id: f._id, status: f.status, squawk: f.squawk, notes: f.notes })));
      if (previousDataRef.current !== null && previousDataRef.current !== dataHash) {
        setLastUpdate(new Date());
      } else if (previousDataRef.current === null) {
        setLastUpdate(new Date());
      }
      previousDataRef.current = dataHash;
    }
  }, [flightsData]);

  // Connection state - Convex useQuery returns undefined when loading/disconnected
  const isConnected = flightsData !== undefined;

  const createFlight = useCallback(
    async (
      flightData: Omit<LegacyFlight, "id" | "created_at" | "updated_at">
    ): Promise<LegacyFlight> => {
      const id = await createFlightMutation({
        airport: flightData.airport || airport || "",
        callsign: flightData.callsign,
        discord_username: flightData.discord_username ?? undefined,
        geofs_callsign: flightData.geofs_callsign ?? undefined,
        aircraft_type: flightData.aircraft_type,
        departure: flightData.departure,
        departure_time: flightData.departure_time || "",
        arrival: flightData.arrival,
        altitude: flightData.altitude,
        squawk: flightData.squawk ?? undefined,
        speed: flightData.speed,
        status: flightData.status as Flight["status"],
        route: flightData.route ?? undefined,
        notes: flightData.notes ?? undefined,
      });

      // Return a mock response - the actual data will be in the subscription
      return {
        id: id as string,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        airport: flightData.airport,
        callsign: flightData.callsign,
        geofs_callsign: flightData.geofs_callsign,
        discord_username: flightData.discord_username,
        aircraft_type: flightData.aircraft_type,
        departure: flightData.departure,
        departure_time: flightData.departure_time,
        arrival: flightData.arrival,
        altitude: flightData.altitude,
        squawk: flightData.squawk,
        speed: flightData.speed,
        status: flightData.status,
        route: flightData.route,
        notes: flightData.notes,
      };
    },
    [createFlightMutation, airport]
  );

  const updateFlight = useCallback(
    async (
      id: string,
      flightData: Partial<Omit<LegacyFlight, "id" | "created_at" | "updated_at">>
    ): Promise<LegacyFlight> => {
      const result = await updateFlightMutation({
        id: id as Id<"flights">,
        airport: flightData.airport,
        callsign: flightData.callsign,
        discord_username: flightData.discord_username ?? undefined,
        geofs_callsign: flightData.geofs_callsign ?? undefined,
        aircraft_type: flightData.aircraft_type,
        departure: flightData.departure,
        departure_time: flightData.departure_time ?? undefined,
        arrival: flightData.arrival,
        altitude: flightData.altitude,
        squawk: flightData.squawk ?? undefined,
        speed: flightData.speed,
        status: flightData.status as Flight["status"] | undefined,
        route: flightData.route ?? undefined,
        notes: flightData.notes ?? undefined,
      });

      if (!result) {
        throw new Error("Flight not found");
      }

      return toLeglightFlight(result as Flight);
    },
    [updateFlightMutation]
  );

  const deleteFlight = useCallback(
    async (id: string): Promise<void> => {
      await deleteFlightMutation({ id: id as Id<"flights"> });
    },
    [deleteFlightMutation]
  );

  return {
    flights,
    isLoading,
    error: null,
    lastUpdate,
    isConnected,
    createFlight,
    updateFlight,
    deleteFlight,
  };
}

// Additional hook for getting a single flight's history
export function useFlightHistory(flightId: string | null) {
  const history = useQuery(
    api.flights.getHistory,
    flightId ? { flight_id: flightId as Id<"flights"> } : "skip"
  );

  return {
    history: history ?? [],
    isLoading: history === undefined,
  };
}

// Hook for getting user's own flights
export function useMyFlights(discordUsername: string | null) {
  const flights = useQuery(
    api.flights.getMyFlights,
    discordUsername ? { discord_username: discordUsername } : "skip"
  );

  return {
    flights: flights?.map(toLeglightFlight) ?? [],
    isLoading: flights === undefined,
  };
}
