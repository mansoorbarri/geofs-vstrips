"use client";

import { type LegacyFlight as Flight } from "~/hooks/use-flights";

type FlightStatus =
  | "delivery"
  | "ground"
  | "tower"
  | "departure"
  | "approach"
  | "control";

interface FidsColumnProps {
  status: FlightStatus;
  flights: Flight[];
}

const STATUS_LABELS: Record<FlightStatus, string> = {
  delivery: "Delivery",
  ground: "Ground",
  tower: "Tower",
  departure: "Departure",
  approach: "Approach",
  control: "Control",
};

export const FidsColumn: React.FC<FidsColumnProps> = ({
  status,
  flights,
}) => {
  return (
    <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg shadow p-3">
      <h2 className="font-bold text-lg mb-2 text-center">
        {STATUS_LABELS[status]} ({flights.length})
      </h2>
      <div className="flex flex-col gap-2">
        {flights.length === 0 && (
          <p className="text-sm text-center text-neutral-500">No flights</p>
        )}
        {flights.map((flight) => (
          <div
            key={flight.id}
            className="border border-neutral-300 dark:border-neutral-600 rounded p-2 bg-white dark:bg-neutral-700 text-sm"
          >
            <p className="font-semibold">{flight.callsign}</p>
            <p className="text-xs text-neutral-500">
              {flight.departure} → {flight.arrival}
            </p>
            <p className="text-xs">Alt {flight.altitude} / SPD {flight.speed}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
