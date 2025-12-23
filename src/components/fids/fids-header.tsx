"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface FidsHeaderProps {
  currentAirport: string;
}

export const FidsHeader: React.FC<FidsHeaderProps> = ({ currentAirport }) => {
  const router = useRouter();
  const [dynamicAirports, setDynamicAirports] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadAirports() {
      try {
        const response = await fetch("/api/admin/settings");
        if (response.ok) {
          const data = await response.json();
          const masterList = data.airportData || [];
          const activeIds = data.activeAirports || [];
          const filtered = masterList.filter((ap: any) => activeIds.includes(ap.id));
          setDynamicAirports(filtered);
        }
      } catch (err) {
        console.error("FIDS Header failed to load airports:", err);
      }
    }
    void loadAirports();
  }, []);

  return (
    <header className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 border-b border-gray-700 bg-gray-900 px-5 py-4 text-white shadow-md mb-3">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-wide text-blue-400 hover:text-blue-300 transition-colors duration-200"
        >
          ✈︎ FIDS
        </Link>
        <span className="hidden sm:inline text-gray-400 text-sm font-medium">
          Airport Information Display
        </span>
      </div>

      <div className="flex w-full sm:w-auto items-center gap-3">
        <Select
          value={currentAirport}
          onValueChange={(value) => router.push(`/fids/${value}`)}
        >
          <SelectTrigger className="min-w-[6rem] w-auto border-gray-700 bg-gray-800 py-2 text-white">
            <SelectValue placeholder="Select an airport" />
          </SelectTrigger>
          <SelectContent className="border-gray-700 bg-gray-800 text-white">
            {dynamicAirports.map((airport) => (
              <SelectItem key={airport.id} value={airport.id}>
                {airport.id} — {airport.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );
};