"use client";

import { useState, useEffect } from "react";
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

type Airport = {
  id: string;
  name: string;
};

export function AirportSelector() {
  const [dynamicAirports, setDynamicAirports] = useState<Airport[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadAirports() {
      try {
        const response = await fetch("/api/admin/settings");
        if (response.ok) {
          const data = await response.json();
          const masterList: Airport[] = data.airportData || [];
          const activeIds: string[] = data.activeAirports || [];
          
          const filtered = masterList.filter((ap) => activeIds.includes(ap.id));
          setDynamicAirports(filtered);
        }
      } catch (error) {
        console.error("Failed to load airports:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAirports();
  }, []);

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