"use client";

import type { Flight } from "~/hooks/use-flights";
import type { FlightStatus } from "@prisma/client";

interface FidsRowProps {
  flight: Flight;
  airport: string;
  isDepartureBoard: boolean;
}

export const FidsRow: React.FC<FidsRowProps> = ({
  flight,
  airport,
  isDepartureBoard,
}) => {
  const { callsign, departure, arrival, departure_time, status } = flight;

  const getDisplayStatus = (status: FlightStatus, isDeparture: boolean): string => {
    if (isDeparture) {
      switch (status) {
        case "delivery":
        case "ground":
          return "At Gate";
        case "tower":
          return "Departing";
        case "control":
          return "Departed";
        default:
          return "Scheduled";
      }
    } else {
      switch (status) {
        case "delivery":
        case "ground":
          return "Inbound";
        case "tower":
          return "Landing";
        case "control":
          return "Arrived";
        default:
          return "Scheduled";
      }
    }
  };

  const statusText = getDisplayStatus(status as FlightStatus, isDepartureBoard);

  return (
    <tr className="border-b border-neutral-700 hover:bg-neutral-800 transition-colors">
      <td className="px-4 py-2 font-bold">{callsign}</td>
      <td className="px-4 py-2">{departure}</td>
      <td className="px-4 py-2">{arrival}</td>
      <td className="px-4 py-2">{departure_time ?? "—"}</td>
      <td className="px-4 py-2 text-yellow-400">{statusText}</td>
    </tr>
  );
};