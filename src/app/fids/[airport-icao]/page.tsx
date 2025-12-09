import { FidsBoard } from "~/components/fids/fids-board";
import { airports } from "~/constants/airports";
import { notFound } from "next/navigation";
import { FidsHeader } from "~/components/fids/fids-header";

export default async function FidsPage({ params }: any) {
  const airport = params["airport-icao"]?.toUpperCase?.();

  if (!airport) notFound();

  const airportExists = airports.some((a) => a.id === airport);
  if (!airportExists) notFound();

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