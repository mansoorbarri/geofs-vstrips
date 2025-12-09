"use client";

import { useFlights } from "~/hooks/use-flights";
import { FidsRow } from "./fids-row";

interface FidsBoardProps {
  airport: string;
}

export const FidsBoard: React.FC<FidsBoardProps> = ({ airport }) => {
  const { flights, isLoading, error } = useFlights(true, airport);

  if (isLoading) return <p>Loading flight data...</p>;
  if (error) return <p className="text-red-600">{String(error.message)}</p>;

  // Filter by the current airport
  const relevantFlights = flights.filter(
    (f) => f.departure === airport || f.arrival === airport,
  );

  const isDepartureBoard = relevantFlights.some(
    (f) => f.departure === airport,
  );

  return (
    <section className="w-full overflow-x-auto rounded-lg bg-neutral-900 text-white font-mono">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-800 uppercase tracking-wider border-b border-neutral-700">
          <tr>
            <th className="px-4 py-2 text-left">Callsign</th>
            <th className="px-4 py-2 text-left">From</th>
            <th className="px-4 py-2 text-left">To</th>
            <th className="px-4 py-2 text-left">Dep Time</th>
            <th className="px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {relevantFlights.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="text-center text-neutral-400 py-6 italic"
              >
                No active flights
              </td>
            </tr>
          )}
          {relevantFlights.map((flight) => (
            <FidsRow
              key={flight.id}
              flight={flight}
              airport={airport}
              isDepartureBoard={isDepartureBoard}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
};