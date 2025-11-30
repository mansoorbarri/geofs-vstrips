// src/components/all-flights.tsx
"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Upload,
  AlertCircle,
  CheckCircle,
  Download,
  ArrowLeft,
  XCircle,
  Plus,
  Send,
  X,
} from "lucide-react";
import { FlightStrip } from "~/components/flight-strip";
import { EditFlightDialog } from "~/components/edit-flight-dialog";
import { RealTimeIndicator } from "~/components/real-time-indicator";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { useFlights, type Flight } from "~/hooks/use-flights";
import Link from "next/link";
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
import { useUser } from "@clerk/nextjs";
import { airports } from "~/constants/airports";
import Loading from "~/components/loading";
import { useRouter } from "next/navigation";

export type FlightStatus =
  | "delivery"
  | "ground"
  | "tower"
  | "departure"
  | "approach"
  | "control";

interface ImportStatus {
  type: "success" | "error" | null;
  message: string;
}

interface TransferDialogState {
  isOpen: boolean;
  targetAirport: string;
  targetSector: FlightStatus;
}

export function AllFlightsPageClient() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const {
    flights,
    isLoading,
    error,
    lastUpdate,
    createFlight,
    updateFlight,
    deleteFlight,
  } = useFlights(true, undefined);

  const [importStatus, setImportStatus] = useState<ImportStatus>({
    type: null,
    message: "",
  });
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFlights, setSelectedFlights] = useState<string[]>([]);
  const [selectedImportStatus, setSelectedImportStatus] =
    useState<FlightStatus>("delivery");
  const [transferDialog, setTransferDialog] = useState<TransferDialogState>({
    isOpen: false,
    targetAirport: "",
    targetSector: "delivery",
  });

  const boardSectors = useMemo(
    () =>
      [
        "delivery",
        "ground",
        "tower",
        "departure",
        "approach",
        "control",
      ] as const,
    []
  );

  const statusTitles: Record<FlightStatus, string> = useMemo(
    () => ({
      delivery: "Delivery",
      ground: "Ground",
      tower: "Tower",
      departure: "Departure",
      approach: "Approach",
      control: "Control",
    }),
    []
  );

  const showStatus = useCallback(
    (type: "success" | "error", message: string, duration = 3000) => {
      setImportStatus({ type, message });
      setTimeout(() => setImportStatus({ type: null, message: "" }), duration);
    },
    []
  );

  const triggerFileInput = useCallback(
    () => fileInputRef.current?.click(),
    []
  );

  const handleFileImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        const flightsToImport = Array.isArray(jsonData) ? jsonData : [jsonData];
        const validFlights: Omit<Flight, "id" | "created_at" | "updated_at">[] =
          [];
        const invalidFlights: unknown[] = [];

        flightsToImport.forEach((flight) => {
          if (
            typeof flight.callsign === "string" &&
            (typeof flight.aircraft_type === "string" ||
              typeof flight.aircraft === "string") &&
            typeof flight.departure === "string" &&
            (typeof flight.arrival === "string" ||
              typeof flight.destination === "string") &&
            typeof flight.altitude === "string" &&
            typeof flight.speed === "string"
          ) {
            const normalizedFlight: Omit<
              Flight,
              "id" | "created_at" | "updated_at"
            > = {
              airport: flight.airport || "undefined",
              callsign: flight.callsign,
              geofs_callsign: flight.geofs_callsign || null,
              discord_username: flight.discord_username || " ",
              aircraft_type: flight.aircraft_type || flight.aircraft,
              departure: flight.departure,
              departure_time: flight.departure_time ?? " ",
              arrival: flight.arrival || flight.destination,
              altitude: flight.altitude,
              squawk: flight.squawk || "",
              speed: flight.speed,
              status: selectedImportStatus,
              route: flight.route || "",
              notes: flight.notes || "",
            };
            validFlights.push(normalizedFlight);
          } else {
            invalidFlights.push(flight);
          }
        });

        if (validFlights.length === 0) {
          showStatus(
            "error",
            "No valid flights found in the JSON file. Please check the format."
          );
          return;
        }

        const batchSize = 5;
        let successCount = 0,
          errorCount = 0;
        for (let i = 0; i < validFlights.length; i += batchSize) {
          const batch = validFlights.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(async (flight) => {
              try {
                await createFlight(flight);
                return true;
              } catch {
                return false;
              }
            })
          );
          successCount += results.filter(Boolean).length;
          errorCount += results.filter((r) => !r).length;
        }

        showStatus(
          successCount > 0 ? "success" : "error",
          `Successfully imported ${successCount} flight(s)${
            errorCount > 0
              ? `. ${errorCount} failed (duplicates?).`
              : "."
          }${invalidFlights.length > 0 ? ` ${invalidFlights.length} invalid skipped.` : ""}`,
          5000
        );
      } catch {
        showStatus(
          "error",
          "Failed to parse JSON file. Please ensure it's valid JSON."
        );
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [createFlight, showStatus, selectedImportStatus]
  );

  const handleEditFlight = useCallback((flight: Flight) => {
    setEditingFlight(flight);
    setEditDialogOpen(true);
  }, []);

  const handleUpdateFlight = useCallback(
    async (updatedFlightData: Flight) => {
      try {
        const { id, created_at, updated_at, ...data } = updatedFlightData;
        await updateFlight(id, data);
        showStatus(
          "success",
          `Flight strip ${updatedFlightData.callsign} updated successfully!`
        );
      } catch (error: any) {
        showStatus(
          "error",
          error.message || "Failed to update flight. Please try again."
        );
      }
    },
    [updateFlight, showStatus]
  );

  const handleDeleteFlight = useCallback(
    async (flightId: string) => {
      const flight = flights.find((f) => f.id === flightId);
      try {
        await deleteFlight(flightId);
        if (flight)
          showStatus("success", `Flight strip ${flight.callsign} deleted.`);
      } catch {
        showStatus("error", "Failed to delete flight.");
      }
    },
    [flights, deleteFlight, showStatus]
  );

  const toggleFlightSelection = useCallback((flightId: string) => {
    setSelectedFlights((prev) =>
      prev.includes(flightId)
        ? prev.filter((id) => id !== flightId)
        : [...prev, flightId]
    );
  }, []);

  const handleSelectAll = useCallback(
    () => setSelectedFlights(flights.map((f) => f.id)),
    [flights]
  );

  const handleClearSelection = useCallback(() => setSelectedFlights([]), []);

  const handleExportFlights = useCallback(() => {
    if (selectedFlights.length === 0)
      return showStatus("error", "No flights selected for export.");

    const flightsToExport = flights.filter((f) =>
      selectedFlights.includes(f.id)
    );
    const dataStr = JSON.stringify(flightsToExport, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `atc_flights_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showStatus(
      "success",
      `Exported ${flightsToExport.length} selected flight(s)!`
    );
  }, [flights, selectedFlights, showStatus]);

  const batchProcessFlights = async <T,>(
    items: T[],
    batchSize: number,
    fn: (item: T) => Promise<boolean>
  ) => {
    let success = 0;
    let failed = 0;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(fn));
      success += results.filter(Boolean).length;
      failed += results.filter((r) => !r).length;
    }
    return { success, failed };
  };

  const handleDeleteSelected = useCallback(async () => {
    if (selectedFlights.length === 0)
      return showStatus("error", "No flights selected for deletion.");

    const confirmDelete = window.confirm(
      `Delete ${selectedFlights.length} selected flight(s)?`
    );
    if (!confirmDelete) return;

    const { success, failed } = await batchProcessFlights(
      selectedFlights,
      5,
      async (id) => {
        try {
          await deleteFlight(id);
          return true;
        } catch {
          return false;
        }
      }
    );

    setSelectedFlights([]);
    showStatus(
      success > 0 ? "success" : "error",
      `Deleted ${success} flight(s)${
        failed > 0 ? `, ${failed} failed.` : "."
      }`,
      5000
    );
  }, [selectedFlights, deleteFlight, showStatus]);

  const handleTransferClick = useCallback(() => {
    if (selectedFlights.length === 0)
      return showStatus("error", "No flights selected for transfer.");

    const selectedFlight = flights.find((f) => f.id === selectedFlights[0]);
    const defaultAirport =
      airports.find((a) => a.id !== selectedFlight?.airport)?.id || "";
    setTransferDialog({
      isOpen: true,
      targetAirport: defaultAirport,
      targetSector: "delivery",
    });
  }, [selectedFlights, flights, showStatus]);

  const handleTransferConfirm = useCallback(async () => {
    if (!transferDialog.targetAirport || selectedFlights.length === 0) return;

    const toTransfer = flights.filter((f) =>
      selectedFlights.includes(f.id)
    );
    const { success, failed } = await batchProcessFlights(
      toTransfer,
      5,
      async (flight) => {
        try {
          await updateFlight(flight.id, {
            airport: transferDialog.targetAirport,
            status: transferDialog.targetSector,
          });
          return true;
        } catch {
          return false;
        }
      }
    );

    const airportName =
      airports.find((a) => a.id === transferDialog.targetAirport)?.name ??
      transferDialog.targetAirport;
    const sectorName = statusTitles[transferDialog.targetSector];

    setSelectedFlights([]);
    setTransferDialog({
      isOpen: false,
      targetAirport: "",
      targetSector: "delivery",
    });

    showStatus(
      success > 0 ? "success" : "error",
      `Transferred ${success} flight(s) to ${airportName} ${sectorName}${
        failed > 0 ? `, ${failed} failed.` : "."
      }`,
      5000
    );
  }, [selectedFlights, transferDialog, flights, updateFlight, showStatus, statusTitles]);

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) router.push("/sign-up");
      else if (!user?.publicMetadata?.controller)
        router.push("/become-controller");
    }
  }, [isLoaded, isSignedIn, user, router]);
  
  const sortedFlights = useMemo(
    () => flights.slice().sort((a, b) => a.callsign.localeCompare(b.callsign)),
    [flights]
  );

  if (!isLoaded || !isSignedIn || !user?.publicMetadata?.controller)
    return <Loading />;


  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <div className="flex-shrink-0 p-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" passHref>
            <Button variant="outline" className="mr-4 bg-black border-gray-700 text-gray-400 hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex-grow text-center">
            All Flights
          </h1>
          <RealTimeIndicator
            lastUpdate={lastUpdate}
            isLoading={isLoading}
            error={error}
          />
        </div>
        <div className="flex gap-4 flex-wrap">
          <Link href="/file-flight" target="_blank" passHref>
            <Button variant="outline" className="bg-black border-green-500 text-green-400 hover:bg-green-900">
              <Plus className="w-4 h-4 mr-2" />
              Create Flight Strip
            </Button>
          </Link>
          {flights.length > 0 && (
            <Button
              variant="outline"
              className="bg-black border-yellow-500 text-yellow-400 hover:bg-yellow-900"
              onClick={handleSelectAll}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Select All
            </Button>
          )}
          {selectedFlights.length > 0 && (
            <Button
              variant="outline"
              className="bg-black border-red-500 text-red-400 hover:bg-red-900"
              onClick={handleClearSelection}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Clear Selection
            </Button>
          )}
          <div className="flex items-center space-x-2">
            <Select
              value={selectedImportStatus}
              onValueChange={(v) =>
                setSelectedImportStatus(v as FlightStatus)
              }
            >
              <SelectTrigger className="bg-black border-gray-700 text-white w-[110px]">
                <SelectValue placeholder="Import to" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {boardSectors.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusTitles[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="bg-black border-white text-white hover:bg-white hover:text-white"
              onClick={triggerFileInput}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import JSON
            </Button>
          </div>
          <Button
            variant="outline"
            className="bg-black border-purple-500 text-purple-400 hover:bg-purple-900"
            onClick={handleExportFlights}
            disabled={!selectedFlights.length}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Selected
          </Button>
          <Button
            variant="outline"
            className="bg-black border-red-500 text-red-400 hover:bg-red-900"
            onClick={handleDeleteSelected}
            disabled={!selectedFlights.length}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
          <Button
            variant="outline"
            className="bg-black border-orange-500 text-orange-400 hover:bg-orange-900"
            onClick={handleTransferClick}
            disabled={!selectedFlights.length}
          >
            <Send className="w-4 h-4 mr-2" />
            Transfer Selected
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          className="hidden"
        />
      </div>

      {importStatus.type && (
        <Alert
          className={`mx-6 my-4 ${
            importStatus.type === "success"
              ? "border-green-600"
              : "border-red-600"
          }`}
        >
          {importStatus.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <AlertDescription className="text-white">
            {importStatus.message}
          </AlertDescription>
        </Alert>
      )}

      <EditFlightDialog
        flight={editingFlight}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdateFlight={handleUpdateFlight}
      />

      <Dialog open={transferDialog.isOpen} onOpenChange={() => setTransferDialog({ isOpen: false, targetAirport: "", targetSector: "delivery" })}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Transfer Selected Flights</DialogTitle>
            <DialogDescription>
              Transfer {selectedFlights.length} selected flights.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Target Airport/Board
              </label>
              <Select
                value={transferDialog.targetAirport}
                onValueChange={(v) =>
                  setTransferDialog((p) => ({ ...p, targetAirport: v }))
                }
              >
                <SelectTrigger className="bg-black border-gray-700 text-white">
                  <SelectValue placeholder="Select target airport" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {airports.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.id} - {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Target Sector
              </label>
              <Select
                value={transferDialog.targetSector}
                onValueChange={(v) =>
                  setTransferDialog((p) => ({
                    ...p,
                    targetSector: v as FlightStatus,
                  }))
                }
              >
                <SelectTrigger className="bg-black border-gray-700 text-white">
                  <SelectValue placeholder="Select target sector" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {boardSectors.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusTitles[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setTransferDialog({
                  isOpen: false,
                  targetAirport: "",
                  targetSector: "delivery",
                })
              }
              className="bg-black border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleTransferConfirm}
              disabled={!transferDialog.targetAirport}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Transfer Flights
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="flex-grow p-6 pt-0 overflow-hidden">
        <div className="flex justify-center h-full">
          <Card className="bg-gray-900 border-gray-700 flex flex-col w-150 h-[85vh]">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-white text-center text-sm">
                All Flights ({flights.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 p-4 overflow-y-auto">
              {sortedFlights.length === 0 ? (
                <p className="text-gray-400 text-center py-8 text-sm">
                  No flights
                </p>
              ) : (
                sortedFlights.map((flight) => (
                  <FlightStrip
                    key={flight.id}
                    flight={flight}
                    onEdit={handleEditFlight}
                    onDelete={handleDeleteFlight}
                    onSelect={toggleFlightSelection}
                    isSelected={selectedFlights.includes(flight.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}