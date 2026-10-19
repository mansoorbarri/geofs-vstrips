"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle,
  Info,
  RotateCcw,
  Send,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { DropZone } from "~/components/drop-zone";
import { DemoFlightStrip } from "~/components/demo/demo-flight-strip";
import type { FlightStatus } from "~/components/flight-strip";
import type { LegacyFlight as Flight } from "~/hooks/use-flights";
import {
  DEMO_AIRPORTS,
  DEMO_FLIGHTS,
  DEMO_RADAR_AIRCRAFT,
  type DemoAirportId,
} from "~/components/demo/demo-data";

const BOARD_SECTORS = [
  "delivery",
  "ground",
  "tower",
  "departure",
  "approach",
  "control",
] as const satisfies readonly FlightStatus[];

const STATUS_CYCLE: Record<FlightStatus, FlightStatus> = {
  delivery: "ground",
  ground: "tower",
  tower: "departure",
  departure: "approach",
  approach: "control",
  control: "delivery",
};

const STATUS_TITLES: Record<FlightStatus, string> = {
  delivery: "Delivery",
  ground: "Ground",
  tower: "Tower",
  departure: "Departure",
  approach: "Approach",
  control: "Control",
};

function randomSquawk(taken: Set<string>): string {
  const reserved = new Set(["7500", "7600", "7700", "1200", "2000", "7000"]);
  for (let i = 0; i < 100; i++) {
    const code = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 8),
    ).join("");
    if (!taken.has(code) && !reserved.has(code)) return code;
  }
  return "4000";
}

export function DemoBoard() {
  const [flights, setFlights] = useState<Flight[]>(DEMO_FLIGHTS);
  const [airport, setAirport] = useState<DemoAirportId>("EGLL");
  const [selectedFlights, setSelectedFlights] = useState<string[]>([]);
  const [draggedFlightId, setDraggedFlightId] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferSector, setTransferSector] =
    useState<FlightStatus>("delivery");

  const updateFlight = useCallback(
    (id: string, data: Partial<Flight>) =>
      setFlights((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, ...data, updated_at: new Date().toISOString() }
            : f,
        ),
      ),
    [],
  );

  const boardFlights = useMemo(
    () => flights.filter((f) => f.airport === airport),
    [flights, airport],
  );

  const flightsByStatus = useMemo(() => {
    const categories = Object.fromEntries(
      BOARD_SECTORS.map((s) => [s, [] as Flight[]]),
    ) as Record<FlightStatus, Flight[]>;
    boardFlights.forEach((f) => categories[f.status as FlightStatus]?.push(f));
    return categories;
  }, [boardFlights]);

  const handleFlightClick = (flight: Flight) => {
    const next = STATUS_CYCLE[flight.status as FlightStatus];
    updateFlight(flight.id, { status: next });
    toast.success(`Flight ${flight.callsign} moved to ${STATUS_TITLES[next]}.`);
  };

  const handleDrop = (status: FlightStatus) => (flightId: string) => {
    const flight = flights.find((f) => f.id === flightId);
    setDraggedFlightId(null);
    if (!flight || flight.status === status) return;
    updateFlight(flightId, { status });
    toast.success(
      `Flight ${flight.callsign} moved to ${STATUS_TITLES[status]} sector.`,
    );
  };

  const handleDelete = (flightId: string) => {
    const flight = flights.find((f) => f.id === flightId);
    setFlights((prev) => prev.filter((f) => f.id !== flightId));
    setSelectedFlights((prev) => prev.filter((id) => id !== flightId));
    if (flight) toast.success(`Flight ${flight.callsign} deleted.`);
  };

  const handleEdit = () => {
    toast.info("Editing is disabled in the demo.");
  };

  const handleSelect = (flightId: string) => {
    setSelectedFlights((prev) =>
      prev.includes(flightId)
        ? prev.filter((id) => id !== flightId)
        : [...prev, flightId],
    );
  };

  const handleSquawkChange = (flightId: string, squawk: string) => {
    updateFlight(flightId, { squawk });
    toast.success(`Squawk updated to ${squawk}`);
  };

  const handleAssignSquawk = (flightId: string) => {
    const taken = new Set(
      flights.map((f) => f.squawk).filter((s): s is string => !!s),
    );
    const squawk = randomSquawk(taken);
    updateFlight(flightId, { squawk });
    toast.success(`Squawk assigned: ${squawk}`);
  };

  const handleDeleteSelected = () => {
    setFlights((prev) => prev.filter((f) => !selectedFlights.includes(f.id)));
    toast.success(`Deleted ${selectedFlights.length} flight strip(s).`);
    setSelectedFlights([]);
  };

  const handleTransferConfirm = () => {
    setFlights((prev) =>
      prev.map((f) =>
        selectedFlights.includes(f.id) ? { ...f, status: transferSector } : f,
      ),
    );
    toast.success(
      `Moved ${selectedFlights.length} flight strip(s) to ${STATUS_TITLES[transferSector]}.`,
    );
    setSelectedFlights([]);
    setTransferOpen(false);
  };

  const handleReset = () => {
    setFlights(DEMO_FLIGHTS);
    setSelectedFlights([]);
    toast.success("Demo board reset.");
  };

  const handleAirportChange = (value: string) => {
    setAirport(value as DemoAirportId);
    setSelectedFlights([]);
  };

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <div className="flex-shrink-0 p-6">
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-cyan-800 bg-cyan-950/40 p-3 text-sm text-cyan-200">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            This is a demo board with example flight strips. Click a strip to
            advance it to the next sector, drag it between columns, edit
            squawks, or select strips to move them in bulk. Nothing here is
            saved.
          </p>
        </div>

        <div className="mb-2 flex items-center justify-between gap-3">
          <Link href="/" passHref>
            <Button
              variant="outline"
              className="cursor-pointer border-gray-700 bg-black text-gray-400 hover:bg-gray-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex min-w-0 flex-1 justify-center px-2 sm:px-4">
            <div className="flex w-full max-w-[420px] min-w-0 flex-col items-center">
              <span className="mb-1 text-[10px] font-medium tracking-[0.28em] text-gray-500 uppercase">
                Demo Board
              </span>
              <Select value={airport} onValueChange={handleAirportChange}>
                <SelectTrigger className="h-auto w-full min-w-0 justify-center border border-transparent bg-transparent px-3 py-1 text-center text-2xl font-bold text-white shadow-none hover:border-gray-800 hover:bg-gray-950/70 focus-visible:border-gray-700 focus-visible:ring-1 focus-visible:ring-gray-700 sm:px-4 sm:text-3xl [&>svg]:hidden">
                  <span className="block w-full truncate text-center text-2xl sm:text-3xl">
                    {airport}
                  </span>
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-900 text-white">
                  {DEMO_AIRPORTS.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.id} - {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-cyan-600 bg-cyan-950/50 text-cyan-300"
          >
            DEMO
          </Badge>
        </div>

        <div className="flex flex-wrap gap-4">
          {boardFlights.length > 0 && (
            <Button
              variant="outline"
              className="cursor-pointer border-yellow-500 bg-black text-yellow-400 hover:bg-yellow-900 hover:text-yellow-300"
              onClick={() => setSelectedFlights(boardFlights.map((f) => f.id))}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Select All
            </Button>
          )}
          {selectedFlights.length > 0 && (
            <Button
              variant="outline"
              className="cursor-pointer border-red-500 bg-black text-red-400 hover:bg-red-900 hover:text-red-300"
              onClick={() => setSelectedFlights([])}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Clear Selection
            </Button>
          )}
          <Button
            variant="outline"
            className="cursor-pointer border-red-500 bg-black text-red-400 hover:bg-red-900 hover:text-red-300"
            onClick={handleDeleteSelected}
            disabled={selectedFlights.length === 0}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
          <Button
            variant="outline"
            className="cursor-pointer border-orange-500 bg-black text-orange-400 hover:bg-orange-900 hover:text-orange-300"
            onClick={() => setTransferOpen(true)}
            disabled={selectedFlights.length === 0}
          >
            <Send className="mr-2 h-4 w-4" />
            Transfer Selected
          </Button>
          <div className="ml-1 h-8 border-l border-gray-700"></div>
          <Button
            variant="outline"
            className="cursor-pointer border-cyan-500 bg-black text-cyan-400 hover:bg-cyan-900 hover:text-cyan-300"
            onClick={handleReset}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Demo
          </Button>
        </div>
      </div>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="border-gray-700 bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              Transfer Selected Flights
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Move {selectedFlights.length} selected flight strip(s) to another
              sector.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Target Sector
            </label>
            <Select
              value={transferSector}
              onValueChange={(value) =>
                setTransferSector(value as FlightStatus)
              }
            >
              <SelectTrigger className="border-gray-700 bg-black text-white">
                <SelectValue placeholder="Select target sector" />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-900">
                {BOARD_SECTORS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_TITLES[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransferOpen(false)}
              className="border-gray-600 bg-black text-gray-300 hover:bg-gray-800"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleTransferConfirm}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Transfer Flights
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="flex-grow overflow-hidden p-6 pt-0">
        <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {BOARD_SECTORS.map((status) => (
            <DropZone
              key={status}
              onDrop={handleDrop(status)}
              className="h-full"
            >
              <Card className="flex h-[70vh] flex-col border-gray-700 bg-gray-900">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-center text-sm text-white">
                    {STATUS_TITLES[status]} ({flightsByStatus[status].length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 overflow-y-auto p-4">
                  {flightsByStatus[status].length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-400">
                      No flights
                    </p>
                  ) : (
                    flightsByStatus[status].map((flight) => (
                      <DemoFlightStrip
                        key={flight.id}
                        flight={flight}
                        onClick={() => handleFlightClick(flight)}
                        onDragStart={setDraggedFlightId}
                        isDragging={draggedFlightId === flight.id}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onSelect={handleSelect}
                        isSelected={selectedFlights.includes(flight.id)}
                        radarAircraft={DEMO_RADAR_AIRCRAFT}
                        onSquawkChange={handleSquawkChange}
                        onAssignSquawk={handleAssignSquawk}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </DropZone>
          ))}
        </div>
      </main>
    </div>
  );
}
