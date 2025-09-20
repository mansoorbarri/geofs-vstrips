"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Import the Link component
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

export function AirportSelector({ airports }: { airports: readonly Airport[] }) {
  const [selectedAirport, setSelectedAirport] = useState<string | null>(null);
  const router = useRouter();

  const handleGoToBoard = () => {
    if (selectedAirport) {
      const encodedId = encodeURIComponent(selectedAirport);
      router.push(`/board/${encodedId}`);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full items-center">
      <Select onValueChange={(value) => setSelectedAirport(value)}>
        <SelectTrigger className="w-full bg-gray-800 text-white border-gray-700 py-2">
          <SelectValue placeholder="Select an airport" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700 text-white">
          {airports.map((airport) => (
            <SelectItem key={airport.id} value={airport.id}>
              {airport.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Button
          onClick={handleGoToBoard}
          disabled={!selectedAirport}
          className="w-full sm:w-auto px-4 py-2 text-lg bg-blue-500 hover:bg-blue-600 transition-colors duration-300 hover:cursor-pointer"
        >
          Go to Board
        </Button>
        <Link href="/all-flights" passHref>
          <Button
            className="w-full sm:w-auto px-4 py-2 text-lg bg-green-500 hover:bg-green-600 transition-colors duration-300 hover:cursor-pointer"
          >
            All Flights
          </Button>
        </Link>
      </div>
    </div>
  );
}