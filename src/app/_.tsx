"use client";

import type React from "react";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Upload, FileText, AlertCircle, CheckCircle, Copy, Download, ArrowLeft } from "lucide-react";
import { FlightStrip } from "~/components/flight-strip";
import { DropZone } from "~/components/drop-zone";
import { CreateFlightDialog } from "~/components/create-flight-dialog";
import { EditFlightDialog } from "~/components/edit-flight-dialog";
import { RealTimeIndicator } from "~/components/real-time-indicator";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { useFlights } from "~/hooks/use-flights";
import { type Flight } from "~/hooks/use-flights";
import Link from "next/link";
import { useParams } from 'next/navigation';

// Export the FlightStatus type so other components can import it
export type FlightStatus = "delivery" | "ground" | "tower" | "departure" | "approach" | "control";

// Define a type for the data coming from the imported JSON file
type ImportedFlight = {
  callsign: string;
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

interface MainBoardProps {
  airportName: string;
}

export function ATCFlightStrip({ airportName }: MainBoardProps) {
  // NEW TEST CODE START
  const params = useParams();
  const airportNameFromURL = params.airportName;
  
  useEffect(() => {
    console.log("Value of airportName prop:", airportName);
    console.log("Value from URL (useParams):", airportNameFromURL);
  }, [airportName, airportNameFromURL]);
  // NEW TEST CODE END

  // FIXED: Add a validation check for the airportName prop
  if (!airportName || airportName.trim() === "") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Airport Not Found</h1>
        <p className="text-gray-400 mb-6">
          Please provide a valid airport name in the URL. Example: 
          <br />
          <Link href="/board/KJFK" className="underline text-blue-400 hover:text-blue-500">
            /board/KJFK
          </Link>ATC
        </p>
        <Link href="/" passHref>
          <Button variant="outline" className="bg-black border-gray-700 text-gray-400 hover:bg-gray-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  // UPDATED: Pass airportName to useFlights hook for filtering
  const { flights, isLoading, error, lastUpdate, createFlight, updateFlight, deleteFlight } = useFlights(true, airportName);

  const [draggedFlightId, setDraggedFlightId] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>({ type: null, message: "" });
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for selected flights and "select all" functionality
  const [selectedFlights, setSelectedFlights] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

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
        ["delivery", "ground", "tower", "departure", "approach", "control"].includes(flight.status)
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
              const normalizedFlight = {
                airport: flight.airport || airportName, // UPDATED: Use imported airport or default to current airport
                callsign: flight.callsign,
                aircraft_type: aircraft_type,
                departure: flight.departure,
                arrival: arrival,
                altitude: flight.altitude,
                speed: flight.speed,
                status: flight.status,
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
    [validateFlight, createFlight, showStatus, airportName]
  );

  // UPDATED: Sample flights now include airport field
  const sampleFlights = useMemo(
    () => [
      {
        airport: airportName,
        callsign: "UAL123",
        aircraft_type: "B737-800",
        departure: "KJFK",
        arrival: "KLAX",
        altitude: "35000",
        speed: "450",
        status: "delivery" as FlightStatus,
        notes: "Priority passenger on board",
      },
      {
        airport: airportName,
        callsign: "DAL456",
        aircraft_type: "A320",
        departure: "KORD",
        arrival: "KDEN",
        altitude: "37000",
        speed: "420",
        status: "ground" as FlightStatus,
        notes: "Weather deviation requested",
      },
      {
        airport: airportName,
        callsign: "SWA789",
        aircraft_type: "B737-700",
        departure: "KPHX",
        arrival: "KLAS",
        altitude: "33000",
        speed: "430",
        status: "tower" as FlightStatus,
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

  // UPDATED: Ensure created flights have airport field
  const handleCreateFlight = useCallback(
    async (newFlightData: Omit<Flight, "id" | "created_at" | "updated_at">) => {
      try {
        // Ensure airport is set to current airport
        const flightWithAirport = {
          ...newFlightData,
          airport: newFlightData.airport || airportName,
        };
        const newFlight = await createFlight(flightWithAirport);
        showStatus("success", `Flight strip ${newFlight.callsign} created successfully!`);
      } catch (error: any) {
        showStatus("error", error.message || "Failed to create flight. Please try again.");
      }
    },
    [createFlight, showStatus, airportName]
  );

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

  const handleExportFlights = useCallback(() => {
    if (flights.length === 0) {
      showStatus("error", "No flights to export. Add some flights first.");
      return;
    }

    const dataStr = JSON.stringify(flights, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    // UPDATED: Include airport name in export filename
    link.download = `atc_flights_${airportName}_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    showStatus("success", `Exported ${flights.length} flight(s) for ${airportName} successfully!`);
  }, [flights, showStatus, airportName]);
  
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
            <Button variant="outline" className="mr-4 bg-black border-gray-700 text-gray-400 hover:bg-gray-800">
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
        <CreateFlightDialog onCreateFlight={handleCreateFlight} airportName={airportName} />
          <Button
            variant="outline"
            className="bg-black border-white text-white hover:bg-white hover:text-black"
            onClick={handleImportClick}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import JSON
          </Button>
          <Button
            variant="outline"
            className="bg-black border-purple-500 text-purple-400 hover:bg-purple-900 hover:text-purple-300"
            onClick={handleExportFlights}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Current
          </Button>
          <Button
            variant="outline"
            className="bg-black border-blue-500 text-blue-400 hover:bg-blue-900 hover:text-blue-300"
            onClick={copySampleJSON}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Sample JSON
          </Button>
          <Button
            variant="outline"
            className="bg-black border-gray-500 text-gray-300 hover:bg-gray-800 hover:text-white"
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
              <Card className="bg-gray-900 border-gray-700 flex flex-col h-full">
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