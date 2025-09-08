"use client";

import type React from "react";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Upload, FileText, AlertCircle, CheckCircle, Copy, Download, ArrowLeft, XCircle } from "lucide-react";
import { FlightStrip } from "~/components/flight-strip";
import { DropZone } from "~/components/drop-zone";
// import { CreateFlightDialog } from "~/components/create-flight-dialog";
import { EditFlightDialog } from "~/components/edit-flight-dialog";
import { RealTimeIndicator } from "~/components/real-time-indicator";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { useFlights } from "~/hooks/use-flights";
import { type Flight } from "~/hooks/use-flights";
import Link from "next/link";
import { useParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

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

// CORRECTED: Moved this array out of the interface
const airports = [
  { id: "KBOS", name: "Boston" },
  { id: "KBDL", name: "Bradley" },
  { id: "KDXR", name: "Danbury" },
];

interface ImportStatus {
  type: "success" | "error" | null;
  message: string;
}

// CORRECTED: Renamed the interface and fixed the syntax
interface BoardPageClientProps {
  airportName: string;
}

export function BoardPageClient({ airportName }: BoardPageClientProps) {
  const { user, isSignedIn } = useUser();
  if (!isSignedIn) {
    redirect('/sign-up');
  }

  if (!user.publicMetadata || user.publicMetadata.controller !== true) {
    redirect('/become-controller');
  }

  const params = useParams();
  const airportNameFromURL = params.airportName;
  
  useEffect(() => {
    console.log("Value of airportName prop:", airportName);
    console.log("Value from URL (useParams):", airportNameFromURL);
  }, [airportName, airportNameFromURL]);

  const { flights, isLoading, error, lastUpdate, createFlight, updateFlight, deleteFlight } = useFlights(true, airportName);

  const [draggedFlightId, setDraggedFlightId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>({ type: null, message: "" });
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFlights, setSelectedFlights] = useState<string[]>([]);
  const [selectedImportStatus, setSelectedImportStatus] = useState<FlightStatus>("delivery");


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
                airport: flight.airport || "",
                callsign: flight.callsign || "",
                geofs_callsign: flight.geofs_callsign || null,
                discord_username: flight.discord_username || " ", // ADDED: New field
                aircraft_type: flight.aircraft_type || "",
                departure: flight.departure || "",
                departure_time: flight.departure_time ?? " ", // ADDED: New field
                arrival: flight.arrival || "",
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
    [validateFlight, createFlight, showStatus, airportName, selectedImportStatus]
  );

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
          // status field is intentionally removed to show it's set on import
          notes: "Weather deviation requested",
        },
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
      ],
      [airportName]
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

  // const handleCreateFlight = useCallback(
  //   async (newFlightData: Omit<Flight, "id" | "created_at" | "updated_at">) => {
  //     try {
  //       const flightWithAirport = {
  //         ...newFlightData,
  //         airport: newFlightData.airport || airportName,
  //       };
  //       const newFlight = await createFlight(flightWithAirport);
  //       showStatus("success", `Flight strip ${newFlight.callsign} created successfully!`);
  //     } catch (error: any) {
  //       showStatus("error", error.message || "Failed to create flight. Please try again.");
  //     }
  //   },
  //   [createFlight, showStatus, airportName]
  // );

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

  const gridClasses = useMemo(() => {
    return "grid-cols-3";
  }, []);

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
          {/* <div className="h-8 border-l border-gray-700"></div> */}
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