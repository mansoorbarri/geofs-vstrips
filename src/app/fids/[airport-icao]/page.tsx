import { FidsBoard } from "~/components/fids/fids-board";
import { notFound } from "next/navigation";
import { FidsHeader } from "~/components/fids/fids-header";
import { db } from "~/server/db";

export default async function FidsPage({ params }: any) {
  const { "airport-icao": airportIcao } = await params;
  const airport = airportIcao?.toUpperCase();

  if (!airport) notFound();

  const settings = await db.eventSettings.findUnique({
    where: { id: "current" },
  });

  const activeAirports = settings?.activeAirports || [];
  const airportExists = activeAirports.includes(airport);

  if (!airportExists) {
    notFound();
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