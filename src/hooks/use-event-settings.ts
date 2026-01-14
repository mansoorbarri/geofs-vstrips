"use client";

import { useQuery, useMutation } from "convex/react";
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
  const settings = useQuery(api.eventSettings.get);
  const updateSettingsMutation = useMutation(api.eventSettings.update);

  const updateSettings = async (newSettings: Partial<EventSettings>) => {
    // Strip out _id as it's not part of the mutation args
    const { _id, ...settingsToUpdate } = newSettings as EventSettings & { _id?: string };
    return await updateSettingsMutation(settingsToUpdate);
  };

  return {
    settings: settings ?? null,
    isLoading: settings === undefined,
    updateSettings,
  };
}
