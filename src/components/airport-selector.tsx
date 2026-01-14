"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useState } from "react";
import { useEventSettings } from "~/hooks/use-event-settings";

type Airport = {
  id: string;
  name: string;
};

export function AirportSelector() {
  const [selectedAirport, setSelectedAirport] = useState<string | null>(null);
  const router = useRouter();
  const { settings, isLoading } = useEventSettings();

  const dynamicAirports = useMemo(() => {
    if (!settings) return [];
    const masterList: Airport[] = (settings.airportData as Airport[]) || [];
    const activeIds: string[] = settings.activeAirports || [];
    return masterList.filter((ap) => activeIds.includes(ap.id));
  }, [settings]);

  const handleGoToBoard = () => {
    if (selectedAirport) {
      const encodedId = encodeURIComponent(selectedAirport);
      router.push(`/board/${encodedId}`);
    }
  };

  if (isLoading) {
    return <div className="text-gray-500 italic">Loading airports...</div>;
  }

  return (
    <div className="flex w-full flex-col items-center gap-4 sm:flex-row">
      <Select onValueChange={(value) => setSelectedAirport(value)}>
        <SelectTrigger className="w-full border-gray-700 bg-gray-800 py-2 text-white">
          <SelectValue placeholder={dynamicAirports.length > 0 ? "Select an airport" : "No active airports"} />
        </SelectTrigger>
        <SelectContent className="border-gray-700 bg-gray-800 text-white">
          {dynamicAirports.map((airport) => (
            <SelectItem key={airport.id} value={airport.id}>
              {airport.name} ({airport.id})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
        <Button
          onClick={handleGoToBoard}
          disabled={!selectedAirport}
          className="w-full bg-blue-500 px-4 py-2 text-lg transition-colors duration-300 hover:cursor-pointer hover:bg-blue-600 sm:w-auto"
        >
          Go to Board
        </Button>
        <Link href="/all-flights" passHref>
          <Button className="text-md w-full border-1 border-white bg-black px-4 py-2 text-white transition-colors duration-300 hover:cursor-pointer hover:bg-white hover:text-black sm:w-auto">
            All Flights
          </Button>
        </Link>
      </div>
    </div>
  );
}
