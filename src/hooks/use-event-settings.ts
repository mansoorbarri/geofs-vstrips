"use client";

import { useQuery, useMutation } from "convex/react";
import { useMemo, useCallback } from "react";
import { api } from "../../convex/_generated/api";

export interface EventSettings {
  _id?: string;
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
  airportData: unknown[];
}

export function useEventSettings() {
  const rawSettings = useQuery(api.eventSettings.get);
  const updateSettingsMutation = useMutation(api.eventSettings.update);

  const updateSettings = useCallback(async (newSettings: Partial<EventSettings>) => {
    // Strip out _id as it's not part of the mutation args
    const { _id, ...settingsToUpdate } = newSettings as EventSettings & { _id?: string };
    return await updateSettingsMutation(settingsToUpdate);
  }, [updateSettingsMutation]);

  // Cast to proper type - memoize to prevent infinite loops
  const settings = useMemo<EventSettings | null>(() => {
    if (!rawSettings) return null;
    return {
      ...rawSettings,
      activeAirports: rawSettings.activeAirports as string[],
      airportData: rawSettings.airportData as unknown[],
    };
  }, [rawSettings]);

  return {
    settings,
    isLoading: rawSettings === undefined,
    updateSettings,
  };
}
