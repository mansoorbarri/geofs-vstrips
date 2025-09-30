"use client";

import type React from "react";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Upload, FileText, AlertCircle, CheckCircle, Copy, Download, ArrowLeft, XCircle, Send, X } from "lucide-react";
import { FlightStrip } from "~/components/flight-strip";
import { DropZone } from "~/components/drop-zone";
import { EditFlightDialog } from "~/components/edit-flight-dialog";
import { RealTimeIndicator } from "~/components/real-time-indicator";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { useFlights } from "~/hooks/use-flights";
import { type Flight } from "~/hooks/use-flights";
import Link from "next/link";
import { useParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { airports } from "~/constants/airports";
import Loading from "~/components/loading";

export type FlightStatus = "delivery" | "ground" | "tower" | "departure" | "approach" | "control";


type ImportedFlight = {
  discord_username: null;
  departure_time: null;
  callsign: string;
  geofs_callsign?: string;
  airport?: string;
  aircraft_type?: string;
  aircraft?: string;
  departure: string;
  arrival?: string;
  destination?: string;
  altitude: string;
  speed: string;
  status: FlightStatus;
  notes?: string;
};

interface ImportStatus {
  type: "success" | "error" | null;
  message: string;
}

interface TransferDialogState {
  isOpen: boolean;
  targetAirport: string;
  targetSector: FlightStatus;
}

interface BoardPageClientProps {
  airportName: string;
}

export function BoardPageClient({ airportName }: BoardPageClientProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const params = useParams();
  const airportNameFromURL = params.airportName;
  
  const { flights, isLoading, error, lastUpdate, createFlight, updateFlight, deleteFlight } = useFlights(true, airportName);

  const [draggedFlightId, setDraggedFlightId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>({ type: null, message: "" });
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFlights, setSelectedFlights] = useState<string[]>([]);
  const [selectedImportStatus, setSelectedImportStatus] = useState<FlightStatus>("delivery");
  const [transferDialog, setTransferDialog] = useState<TransferDialogState>({
    isOpen: false,
    targetAirport: "",
    targetSector: "delivery"
  });

  const boardSectors = useMemo(() => {
    return ["delivery", "ground", "tower", "departure", "approach", "control"] as const;
  }, []);

  const flightsByStatus = useMemo(() => {
    const categories = boardSectors.reduce((acc, status) => {
      acc[status] = [];
      return acc;
    }, {} as Record<typeof boardSectors[number], Flight[]>);

    flights.forEach((flight) => {
      const status = flight.status as FlightStatus;
      
      if ((boardSectors as readonly FlightStatus[]).includes(status)) {
        categories[status].push(flight);
      }
    });

    return categories;
  }, [flights, boardSectors]);

  const statusCycle: Record<FlightStatus, FlightStatus> = useMemo(
    () => ({
      delivery: "ground",
      ground: "tower",
      tower: "departure",
      departure: "approach",
      approach: "control",
      control: "delivery",
    }),
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

  const gridClasses = useMemo(() => {
    return "grid-cols-3";
  }, []);

  const sampleFlights = useMemo(
      () => [
        {
          airport: airportName,
          callsign: "DAL456",
          geofs_callsign: "featherway",
          discord_username: "featherway",
          departure_time: "1300",
          aircraft_type: "A320",
          departure: "KORD",
          arrival: "KDEN",
          altitude: "37000",
          speed: "420",
          notes: "Weather deviation requested",
        },
        {
          airport: airportName,
          callsign: "UAL789",
          geofs_callsign: "user2",
          discord_username: "user2",
          departure_time: "1400",
          aircraft_type: "B737",
          departure: "KDEN",
          arrival: "KLAX",
          altitude: "29000",
          speed: "380",
          notes: "Holding for runway 25L",
        },
        {
          airport: airportName,
          callsign: "SWA123",
          geofs_callsign: "user3",
          discord_username: "user3",
          departure_time: "1500",
          aircraft_type: "B777",
          departure: "KLAX",
          arrival: "KJFK",
          altitude: "41000",
          speed: "450",
          notes: "Direct to destination",
        },
      ],
      [airportName]
    );

  const showStatus = useCallback((type: "success" | "error", message: string, duration = 3000) => {
    setImportStatus({ type, message });
    setTimeout(() => setImportStatus({ type: null, message: "" }), duration);
  }, []);

  const handleFlightClick = useCallback(
    async (flightId: string) => {
      const flight = flights.find((f) => f.id === flightId);
      if (!flight) return;

      try {
        await updateFlight(flightId, { status: statusCycle[flight.status as FlightStatus] });
      } catch (error) {
        showStatus("error", "Failed to update flight status. Please try again.");
      }
    },
    [flights, updateFlight, statusCycle, showStatus]
  );

  const handleDragStart = useCallback((flightId: string) => {
    setDraggedFlightId(flightId);
  }, []);

  const handleDrop = useCallback(
    (targetStatus: FlightStatus) => async (flightId: string) => {
      try {
        await updateFlight(flightId, { status: targetStatus });
        setDraggedFlightId(null);
      } catch (error) {
        showStatus("error", "Failed to move flight. Please try again.");
        setDraggedFlightId(null);
      }
    },
    [updateFlight, showStatus]
  );

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const validateFlight = useCallback(
    (flight: any): flight is ImportedFlight => {
      return (
        typeof flight === "object" &&
        typeof flight.callsign === "string" &&
        (typeof flight.aircraft_type === "string" || typeof flight.aircraft === "string") &&
        typeof flight.departure === "string" &&
        (typeof flight.arrival === "string" || typeof flight.destination === "string") &&
        typeof flight.altitude === "string" &&
        typeof flight.speed === "string" &&
        (flight.status === undefined || ["delivery", "ground", "tower", "departure", "approach", "control"].includes(flight.status))
      );
    },
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

        const validFlights: Omit<Flight, "id" | "created_at" | "updated_at">[] = [];
        const invalidFlights: any[] = [];

        flightsToImport.forEach((flight, index) => {
          if (validateFlight(flight)) {
            const aircraft_type = flight.aircraft_type || flight.aircraft;
            const arrival = flight.arrival || flight.destination;

            if (typeof aircraft_type === "string" && typeof arrival === "string") {
              const normalizedFlight: Omit<Flight, "id" | "created_at" | "updated_at"> = {
                airport: airportName,
                callsign: flight.callsign || "",
                geofs_callsign: flight.geofs_callsign || null,
                discord_username: flight.discord_username || " ",
                aircraft_type: aircraft_type || "",
                departure: flight.departure || "",
                departure_time: flight.departure_time ?? " ",
                arrival: arrival || "",
                altitude: flight.altitude || "",
                speed: flight.speed || "",
                status: selectedImportStatus,
                notes: flight.notes || "",
              };
              validFlights.push(normalizedFlight);
            } else {
              invalidFlights.push({ index, flight, reason: "Inferred types were incorrect." });
            }
          } else {
            invalidFlights.push({ index, flight });
          }
        });

        if (validFlights.length > 0) {
          let successCount = 0;
          let errorCount = 0;

          const batchSize = 5;
          for (let i = 0; i < validFlights.length; i += batchSize) {
            const batch = validFlights.slice(i, i + batchSize);
            const promises = batch.map(async (flight) => {
              try {
                await createFlight(flight);
                return { success: true };
              } catch (error) {
                return { success: false };
              }
            });

            const results = await Promise.all(promises);
            successCount += results.filter((r) => r.success).length;
            errorCount += results.filter((r) => !r.success).length;
          }

          const message = `Successfully imported ${successCount} flight(s)${
            errorCount > 0 ? `. ${errorCount} flights failed to import (possibly duplicates).` : "."
          }${invalidFlights.length > 0 ? ` ${invalidFlights.length} invalid entries were skipped.` : ""}`;

          showStatus(successCount > 0 ? "success" : "error", message, 5000);
        } else {
          showStatus("error", "No valid flights found in the JSON file. Please check the format.");
        }
      } catch (error) {
        showStatus("error", "Failed to parse JSON file. Please ensure it's a valid JSON format.");
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [validateFlight, createFlight, showStatus, selectedImportStatus, airportName]
  );

  const generateSampleJSON = useCallback(() => {
    const dataStr = JSON.stringify(sampleFlights, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sample_flights_${airportName}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [sampleFlights, airportName]);

  const copySampleJSON = useCallback(async () => {
    const jsonString = JSON.stringify(sampleFlights, null, 2);
    try {
      await navigator.clipboard.writeText(jsonString);
      showStatus("success", "Sample JSON copied to clipboard! You can paste it into a .json file.");
    } catch (error) {
      showStatus("error", "Failed to copy to clipboard. Please try the download option instead.");
    }
  }, [sampleFlights, showStatus]);

  const handleEditFlight = useCallback((flight: Flight) => {
    setEditingFlight(flight);
    setEditDialogOpen(true);
  }, []);

  const handleUpdateFlight = useCallback(
    async (updatedFlightData: Flight) => {
      try {
        const { id, created_at, updated_at, ...updateData } = updatedFlightData;
        await updateFlight(id, updateData);

        showStatus("success", `Flight strip ${updatedFlightData.callsign} updated successfully!`);
      } catch (error: any) {
        showStatus("error", error.message || "Failed to update flight. Please try again.");
      }
    },
    [updateFlight, showStatus]
  );

  const handleDeleteFlight = useCallback(
    async (flightId: string) => {
      const flightToDelete = flights.find((f) => f.id === flightId);

      try {
        await deleteFlight(flightId);
        if (flightToDelete) {
          showStatus("success", `Flight strip ${flightToDelete.callsign} deleted successfully!`);
        }
      } catch (error: any) {
        showStatus("error", error.message || "Failed to delete flight. Please try again.");
      }
    },
    [flights, deleteFlight, showStatus]
  );
  
  const handleFlightSelection = useCallback((flightId: string) => {
    setSelectedFlights(prevSelected =>
      prevSelected.includes(flightId)
        ? prevSelected.filter(id => id !== flightId)
        : [...prevSelected, flightId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedFlights(flights.map(flight => flight.id));
  }, [flights]);

  const handleClearSelection = useCallback(() => {
    setSelectedFlights([]);
  }, []);

  const handleExportFlights = useCallback(() => {
    if (selectedFlights.length === 0) {
      showStatus("error", "No flights selected for export.");
      return;
    }

    const flightsToExport = flights.filter(f => selectedFlights.includes(f.id));

    const dataStr = JSON.stringify(flightsToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `atc_flights_${airportName}_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    showStatus("success", `Exported ${flightsToExport.length} selected flight(s) successfully!`);
  }, [flights, selectedFlights, showStatus, airportName]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedFlights.length === 0) {
      showStatus("error", "No flights selected for deletion.");
      return;
    }

    const flightsToDelete = flights.filter(f => selectedFlights.includes(f.id));
    const flightCallsigns = flightsToDelete.map(f => f.callsign).join(", ");

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedFlights.length} selected flight strip(s)?\n\nCallsigns: ${flightCallsigns}\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      const batchSize = 5;
      for (let i = 0; i < selectedFlights.length; i += batchSize) {
        const batch = selectedFlights.slice(i, i + batchSize);
        const promises = batch.map(async (flightId) => {
          try {
            await deleteFlight(flightId);
            return { success: true };
          } catch (error) {
            return { success: false };
          }
        });

        const results = await Promise.all(promises);
        successCount += results.filter((r) => r.success).length;
        errorCount += results.filter((r) => !r.success).length;
      }

      setSelectedFlights([]);

      const message = `Successfully deleted ${successCount} flight strip(s)${
        errorCount > 0 ? `. ${errorCount} flights failed to delete.` : "."
      }`;

      showStatus(successCount > 0 ? "success" : "error", message, 5000);
    } catch (error) {
      showStatus("error", "Failed to delete selected flights. Please try again.");
    }
  }, [selectedFlights, flights, deleteFlight, showStatus]);

  const handleTransferClick = useCallback(() => {
    if (selectedFlights.length === 0) {
      showStatus("error", "No flights selected for transfer.");
      return;
    }
    
    const otherAirports = airports.filter(airport => airport.id !== airportName);
    setTransferDialog({
      isOpen: true,
      targetAirport: otherAirports.length > 0 ? otherAirports[0]!.id : "",
      targetSector: "delivery"
    });
  }, [selectedFlights, airportName, showStatus]);

  const handleTransferConfirm = useCallback(async () => {
    if (selectedFlights.length === 0 || !transferDialog.targetAirport) {
      return;
    }

    const flightsToTransfer = flights.filter(f => selectedFlights.includes(f.id));
    
    try {
      let successCount = 0;
      let errorCount = 0;

      const batchSize = 5;
      for (let i = 0; i < flightsToTransfer.length; i += batchSize) {
        const batch = flightsToTransfer.slice(i, i + batchSize);
        const promises = batch.map(async (flight) => {
          try {
            await updateFlight(flight.id, {
              airport: transferDialog.targetAirport,
              status: transferDialog.targetSector,
            });
            
            return { success: true };
          } catch (error) {
            return { success: false };
          }
        });

        const results = await Promise.all(promises);
        successCount += results.filter((r) => r.success).length;
        errorCount += results.filter((r) => !r.success).length;
      }

      setSelectedFlights([]);
      setTransferDialog({ isOpen: false, targetAirport: "", targetSector: "delivery" });

      const targetAirportName = airports.find(a => a.id === transferDialog.targetAirport)?.name || transferDialog.targetAirport;
      const sectorName = statusTitles[transferDialog.targetSector];

      const message = `Successfully transferred ${successCount} flight strip(s) to ${targetAirportName} ${sectorName}${
        errorCount > 0 ? `. ${errorCount} flights failed to transfer.` : "."
      }`;

      showStatus(successCount > 0 ? "success" : "error", message, 5000);
    } catch (error) {
      showStatus("error", "Failed to transfer selected flights. Please try again.");
    }
  }, [selectedFlights, flights, transferDialog, updateFlight, showStatus, statusTitles]);

  const handleTransferCancel = useCallback(() => {
    setTransferDialog({ isOpen: false, targetAirport: "", targetSector: "delivery" });
  }, []);
  
  useEffect(() => {
    console.log("Value of airportName prop:", airportName);
    console.log("Value from URL (useParams):", airportNameFromURL);
  }, [airportName, airportNameFromURL]);

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.push('/sign-up');
      } else if (!user?.publicMetadata || user.publicMetadata.controller !== true) {
        router.push('/become-controller');
      }
    }
  }, [isLoaded, isSignedIn, user, router]); 

  if (!isLoaded || !isSignedIn || !user || user.publicMetadata.controller !== true) {
    return (
      <Loading />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <div className="flex-shrink-0 p-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" passHref>
            <Button variant="outline" className="mr-4 bg-black border-gray-700 text-gray-400 hover:bg-gray-800 hover:cursor-pointer">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex-grow text-center">
            {airportName} Board
          </h1>
          <RealTimeIndicator lastUpdate={lastUpdate} isLoading={isLoading} error={error} />
        </div>
        <div className="flex gap-4 flex-wrap">
          <Link href="/file-flight" target="_blank" passHref>
            <Button
              variant="outline"
              className="bg-black border-green-500 text-green-400 hover:bg-green-900 hover:text-green-300 hover:cursor-pointer shine-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Flight Strip
            </Button>
          </Link>          
          <div className="h-8 border-l ml-1 border-gray-700"></div>      
          {flights.length > 0 && (
            <Button
              variant="outline"
              className="bg-black border-yellow-500 text-yellow-400 hover:bg-yellow-900 hover:text-yellow-300 hover:cursor-pointer"
              onClick={handleSelectAll}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Select All
            </Button>
          )}

          {selectedFlights.length > 0 && (
            <Button
              variant="outline"
              className="bg-black border-red-500 text-red-400 hover:bg-red-900 hover:text-red-300 hover:cursor-pointer"
              onClick={handleClearSelection}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Clear Selection
            </Button>
          )}

          <div className="flex items-center space-x-2">
            <Select
              value={selectedImportStatus}
              onValueChange={(value) => setSelectedImportStatus(value as FlightStatus)}
            >
              <SelectTrigger className="bg-black border-grey-700 text-white w-[110px]">
                <SelectValue placeholder="Import to" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {boardSectors.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusTitles[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="bg-black border-white text-white hover:bg-white hover:text-white hover:cursor-pointer"
              onClick={handleImportClick}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import JSON
            </Button>
          </div>
          
          <Button
            variant="outline"
            className="bg-black border-purple-500 text-purple-400 hover:bg-purple-900 hover:text-purple-300 hover:cursor-pointer"
            onClick={handleExportFlights}
            disabled={selectedFlights.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Selected
          </Button>
          <Button
            variant="outline"
            className="bg-black border-red-500 text-red-400 hover:bg-red-900 hover:text-red-300 hover:cursor-pointer"
            onClick={handleDeleteSelected}
            disabled={selectedFlights.length === 0}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
          <Button
            variant="outline"
            className="bg-black border-orange-500 text-orange-400 hover:bg-orange-900 hover:text-orange-300 hover:cursor-pointer"
            onClick={handleTransferClick}
            disabled={selectedFlights.length === 0}
          >
            <Send className="w-4 h-4 mr-2" />
            Transfer Selected
          </Button>
          <Button
            variant="outline"
            className="bg-black border-blue-500 text-blue-400 hover:bg-blue-900 hover:text-blue-300 hover:cursor-pointer"
            onClick={copySampleJSON}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Sample JSON
          </Button>
          <Button
            variant="outline"
            className="bg-black border-gray-500 text-gray-300 hover:bg-gray-800 hover:text-white hover:cursor-pointer"
            onClick={generateSampleJSON}
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Sample
          </Button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileImport} className="hidden" />
      </div>

      {importStatus.type && (
        <Alert className={`mx-6 my-4 ${importStatus.type === "success" ? "border-green-600" : "border-red-600"}`}>
          {importStatus.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <AlertDescription className="text-white">{importStatus.message}</AlertDescription>
        </Alert>
      )}

      <EditFlightDialog
        flight={editingFlight}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdateFlight={handleUpdateFlight}
      />

      <Dialog open={transferDialog.isOpen} onOpenChange={handleTransferCancel}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Transfer Selected Flights</DialogTitle>
            <DialogDescription className="text-gray-300">
              Transfer {selectedFlights.length} selected flight strip(s) to another board and sector.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Target Airport/Board
              </label>
              <Select
                value={transferDialog.targetAirport}
                onValueChange={(value) => 
                  setTransferDialog(prev => ({ ...prev, targetAirport: value }))
                }
              >
                <SelectTrigger className="bg-black border-gray-700 text-white">
                  <SelectValue placeholder="Select target airport" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {airports
                    .filter(airport => airport.id !== airportName)
                    .map((airport) => (
                      <SelectItem key={airport.id} value={airport.id}>
                        {airport.id} - {airport.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Target Sector
              </label>
              <Select
                value={transferDialog.targetSector}
                onValueChange={(value) => 
                  setTransferDialog(prev => ({ ...prev, targetSector: value as FlightStatus }))
                }
              >
                <SelectTrigger className="bg-black border-gray-700 text-white">
                  <SelectValue placeholder="Select target sector" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {boardSectors.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusTitles[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {transferDialog.targetAirport && (
              <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                <p className="text-sm text-gray-300">
                  <strong>Transfer Summary:</strong><br />
                  Moving {selectedFlights.length} flight(s) from <strong>{airportName}</strong> to{" "}
                  <strong>
                    {airports.find(a => a.id === transferDialog.targetAirport)?.name || transferDialog.targetAirport}
                  </strong>{" "}
                  under <strong>{statusTitles[transferDialog.targetSector]}</strong> sector.
                </p>
                <p className="text-xs text-yellow-400 mt-2">
                  Note: This will remove the flights from the current board and create them in the target board.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleTransferCancel}
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
        <div className={`grid ${gridClasses} gap-4 h-full`}>
          {boardSectors.map((status) => (
            <DropZone key={status} onDrop={handleDrop(status)} className="h-full">
              <Card className="bg-gray-900 border-gray-700 flex flex-col h-[70vh]">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-white text-center text-sm">
                    {statusTitles[status]} ({flightsByStatus[status].length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 p-4 overflow-y-auto">
                  {flightsByStatus[status].length === 0 ? (
                    <p className="text-gray-400 text-center py-8 text-sm">No flights</p>
                  ) : (
                    flightsByStatus[status].map((flight) => (
                      <FlightStrip
                        key={flight.id}
                        flight={flight}
                        onClick={() => handleFlightClick(flight.id)}
                        onDragStart={handleDragStart}
                        isDragging={draggedFlightId === flight.id}
                        onEdit={handleEditFlight}
                        onDelete={handleDeleteFlight}
                        onSelect={handleFlightSelection}
                        isSelected={selectedFlights.includes(flight.id)}
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