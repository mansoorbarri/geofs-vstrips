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
import { useFlights, type LegacyFlight as Flight } from "~/hooks/use-flights";
import { useEventSettings } from "~/hooks/use-event-settings";
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
    isConnected,
    createFlight,
    updateFlight,
    deleteFlight,
  } = useFlights(true, undefined);

  const { settings: eventSettings } = useEventSettings();

  const dynamicAirports = useMemo(() => {
    if (!eventSettings) return [];
    const masterList = (eventSettings.airportData as { id: string; name: string }[]) || [];
    const activeIds = eventSettings.activeAirports || [];
    return masterList.filter((ap) => activeIds.includes(ap.id));
  }, [eventSettings]);

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
    [],
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
    [],
  );

  const showStatus = useCallback(
    (type: "success" | "error", message: string, duration = 3000) => {
      setImportStatus({ type, message });
      setTimeout(() => setImportStatus({ type: null, message: "" }), duration);
    },
    [],
  );

  const triggerFileInput = useCallback(() => fileInputRef.current?.click(), []);

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
            "No valid flights found in the JSON file. Please check the format.",
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
            }),
          );
          successCount += results.filter(Boolean).length;
          errorCount += results.filter((r) => !r).length;
        }

        showStatus(
          successCount > 0 ? "success" : "error",
          `Successfully imported ${successCount} flight(s)${
            errorCount > 0 ? `. ${errorCount} failed (duplicates?).` : "."
          }${invalidFlights.length > 0 ? ` ${invalidFlights.length} invalid skipped.` : ""}`,
          5000,
        );
      } catch {
        showStatus(
          "error",
          "Failed to parse JSON file. Please ensure it's valid JSON.",
        );
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [createFlight, showStatus, selectedImportStatus],
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
          `Flight strip ${updatedFlightData.callsign} updated successfully!`,
        );
      } catch (err: any) {
        showStatus(
          "error",
          err.message || "Failed to update flight. Please try again.",
        );
      }
    },
    [updateFlight, showStatus],
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
    [flights, deleteFlight, showStatus],
  );

  const toggleFlightSelection = useCallback((flightId: string) => {
    setSelectedFlights((prev) =>
      prev.includes(flightId)
        ? prev.filter((id) => id !== flightId)
        : [...prev, flightId],
    );
  }, []);

  const handleSelectAll = useCallback(
    () => setSelectedFlights(flights.map((f) => f.id)),
    [flights],
  );

  const handleClearSelection = useCallback(() => setSelectedFlights([]), []);

  const handleExportFlights = useCallback(() => {
    if (selectedFlights.length === 0)
      return showStatus("error", "No flights selected for export.");

    const flightsToExport = flights.filter((f) =>
      selectedFlights.includes(f.id),
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
      `Exported ${flightsToExport.length} selected flight(s)!`,
    );
  }, [flights, selectedFlights, showStatus]);

  const batchProcessFlights = async <T,>(
    items: T[],
    batchSize: number,
    fn: (item: T) => Promise<boolean>,
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
      `Delete ${selectedFlights.length} selected flight(s)?`,
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
      },
    );

    setSelectedFlights([]);
    showStatus(
      success > 0 ? "success" : "error",
      `Deleted ${success} flight(s)${failed > 0 ? `, ${failed} failed.` : "."}`,
      5000,
    );
  }, [selectedFlights, deleteFlight, showStatus]);

  const handleTransferClick = useCallback(() => {
    if (selectedFlights.length === 0)
      return showStatus("error", "No flights selected for transfer.");

    const selectedFlight = flights.find((f) => f.id === selectedFlights[0]);
    const defaultAirport =
      dynamicAirports.find((a) => a.id !== selectedFlight?.airport)?.id || "";
    setTransferDialog({
      isOpen: true,
      targetAirport: defaultAirport,
      targetSector: "delivery",
    });
  }, [selectedFlights, flights, showStatus, dynamicAirports]);

  const handleTransferConfirm = useCallback(async () => {
    if (!transferDialog.targetAirport || selectedFlights.length === 0) return;

    const toTransfer = flights.filter((f) => selectedFlights.includes(f.id));
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
      },
    );

    const airportName =
      dynamicAirports.find((a) => a.id === transferDialog.targetAirport)?.name ??
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
      5000,
    );
  }, [
    selectedFlights,
    transferDialog,
    flights,
    updateFlight,
    showStatus,
    statusTitles,
    dynamicAirports,
  ]);

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) router.push("/sign-up");
      else if (!user?.publicMetadata?.controller)
        router.push("/become-controller");
    }
  }, [isLoaded, isSignedIn, user, router]);

  const sortedFlights = useMemo(
    () => flights.slice().sort((a, b) => a.callsign.localeCompare(b.callsign)),
    [flights],
  );

  if (!isLoaded || !isSignedIn || !user?.publicMetadata?.controller)
    return <Loading />;

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <div className="flex-shrink-0 p-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" passHref>
            <Button
              variant="outline"
              className="mr-4 border-gray-700 bg-black text-gray-400 hover:bg-gray-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="flex-grow text-center text-3xl font-bold">
            All Flights
          </h1>
          <RealTimeIndicator
            lastUpdate={lastUpdate}
            isLoading={isLoading}
            error={error}
            isConnected={isConnected}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/file-flight" target="_blank" passHref>
            <Button
              variant="outline"
              className="border-green-500 bg-black text-green-400 hover:bg-green-900"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Flight Strip
            </Button>
          </Link>
          {flights.length > 0 && (
            <Button
              variant="outline"
              className="border-yellow-500 bg-black text-yellow-400 hover:bg-yellow-900"
              onClick={handleSelectAll}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Select All
            </Button>
          )}
          {selectedFlights.length > 0 && (
            <Button
              variant="outline"
              className="border-red-500 bg-black text-red-400 hover:bg-red-900"
              onClick={handleClearSelection}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Clear Selection
            </Button>
          )}
          <div className="flex items-center space-x-2">
            <Select
              value={selectedImportStatus}
              onValueChange={(v) => setSelectedImportStatus(v as FlightStatus)}
            >
              <SelectTrigger className="w-[110px] border-gray-700 bg-black text-white">
                <SelectValue placeholder="Import to" />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-900">
                {boardSectors.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusTitles[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="border-white bg-black text-white hover:bg-white hover:text-white"
              onClick={triggerFileInput}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import JSON
            </Button>
          </div>
          <Button
            variant="outline"
            className="border-purple-500 bg-black text-purple-400 hover:bg-purple-900"
            onClick={handleExportFlights}
            disabled={!selectedFlights.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Selected
          </Button>
          <Button
            variant="outline"
            className="border-red-500 bg-black text-red-400 hover:bg-red-900"
            onClick={handleDeleteSelected}
            disabled={!selectedFlights.length}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
          <Button
            variant="outline"
            className="border-orange-500 bg-black text-orange-400 hover:bg-orange-900"
            onClick={handleTransferClick}
            disabled={!selectedFlights.length}
          >
            <Send className="mr-2 h-4 w-4" />
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

      <Dialog
        open={transferDialog.isOpen}
        onOpenChange={() =>
          setTransferDialog({
            isOpen: false,
            targetAirport: "",
            targetSector: "delivery",
          })
        }
      >
        <DialogContent className="border-gray-700 bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Transfer Selected Flights</DialogTitle>
            <DialogDescription>
              Transfer {selectedFlights.length} selected flights.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Target Airport/Board
              </label>
              <Select
                value={transferDialog.targetAirport}
                onValueChange={(v) =>
                  setTransferDialog((p) => ({ ...p, targetAirport: v }))
                }
              >
                <SelectTrigger className="border-gray-700 bg-black text-white">
                  <SelectValue placeholder="Select target airport" />
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-900">
                  {dynamicAirports.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.id} - {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
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
                <SelectTrigger className="border-gray-700 bg-black text-white">
                  <SelectValue placeholder="Select target sector" />
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-900">
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
              className="border-gray-600 bg-black text-gray-300 hover:bg-gray-800"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleTransferConfirm}
              disabled={!transferDialog.targetAirport}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Transfer Flights
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="flex-grow overflow-hidden p-6 pt-0">
        <div className="flex h-full justify-center">
          <Card className="flex h-[85vh] w-150 flex-col border-gray-700 bg-gray-900">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-center text-sm text-white">
                All Flights ({flights.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-2 overflow-y-auto p-4">
              {sortedFlights.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
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