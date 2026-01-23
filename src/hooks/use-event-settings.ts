"use client";

import { useQuery, useMutation } from "convex/react";
import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export interface AirportData {
  id: string;
  name: string;
}

export interface EventSettings {
  _id?: Id<"eventSettings">;
  isEventLive: boolean;
  airportMode: string;
  fixedAirport?: string;
  departureMode: string;
  fixedDeparture?: string;
  arrivalMode: string;
  fixedArrival?: string;
  timeMode: string;
  fixedTime?: string;
  routeMode: string;
  fixedRoute?: string;
  activeAirports: string[];
  airportData: AirportData[];
}

export function useEventSettings() {
  const rawSettings = useQuery(api.eventSettings.get);
  const updateSettingsMutation = useMutation(api.eventSettings.update);

  // Track when settings change for real-time detection
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const previousSettingsRef = useRef<string | null>(null);

  const updateSettings = useCallback(async (newSettings: Partial<EventSettings>) => {
    // Strip out _id as it's not part of the mutation args
    const { _id, ...settingsToUpdate } = newSettings as EventSettings & { _id?: Id<"eventSettings"> };
    return await updateSettingsMutation(settingsToUpdate);
  }, [updateSettingsMutation]);

  // Cast to proper type - memoize to prevent infinite loops
  const settings = useMemo<EventSettings | null>(() => {
    if (!rawSettings) return null;
    return {
      ...rawSettings,
      _id: "_id" in rawSettings ? rawSettings._id : undefined,
      activeAirports: rawSettings.activeAirports as string[],
      airportData: rawSettings.airportData as AirportData[],
    };
  }, [rawSettings]);

  // Track real-time updates
  useEffect(() => {
    if (rawSettings) {
      const settingsHash = JSON.stringify(rawSettings);
      if (previousSettingsRef.current !== null && previousSettingsRef.current !== settingsHash) {
        setLastUpdate(new Date());
      } else if (previousSettingsRef.current === null) {
        setLastUpdate(new Date());
      }
      previousSettingsRef.current = settingsHash;
    }
  }, [rawSettings]);

  const isLoading = rawSettings === undefined;
  const isConnected = !isLoading;

  return {
    settings,
    isLoading,
    isConnected,
    lastUpdate,
    updateSettings,
  };
}
