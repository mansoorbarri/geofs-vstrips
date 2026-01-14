"use client";

import { FidsBoard } from "~/components/fids/fids-board";
import { FidsHeader } from "~/components/fids/fids-header";
import { useParams } from "next/navigation";
import { useEventSettings } from "~/hooks/use-event-settings";
import Loading from "~/components/loading";

export default function FidsPage() {
  const params = useParams();
  const airportIcao = params["airport-icao"] as string;
  const airport = airportIcao?.toUpperCase();

  const { settings, isLoading } = useEventSettings();

  if (isLoading) return <Loading />;

  if (!airport) {
    return (
      <main className="mx-auto max-w-7xl p-6">
        <p className="text-red-500">Airport not found</p>
      </main>
    );
  }

  const activeAirports = settings?.activeAirports || [];
  const airportExists = activeAirports.includes(airport);

  if (!airportExists) {
    return (
      <main className="mx-auto max-w-7xl p-6">
        <p className="text-red-500">Airport {airport} is not currently active</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <FidsHeader currentAirport={airport} />
      <h1 className="text-3xl font-semibold mb-6">
        Flight Information Display — {airport}
      </h1>
      <FidsBoard airport={airport} />
    </main>
  );
}
