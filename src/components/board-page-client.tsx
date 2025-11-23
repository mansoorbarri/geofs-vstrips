"use client";

import type React from "react";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Upload,
  ArrowLeft,
  XCircle,
  Send,
  X,
  Plus,
  CheckCircle,
  Download, // Keep Download for general export
} from "lucide-react";
import { FlightStrip } from "~/components/flight-strip";
import { DropZone } from "~/components/drop-zone";
import { EditFlightDialog } from "~/components/edit-flight-dialog";
import { RealTimeIndicator } from "~/components/real-time-indicator";
import { useFlights } from "~/hooks/use-flights";
import { type Flight } from "~/hooks/use-flights";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  // Removed Copy and FileText since sample functions are gone
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
import { useRouter } from "next/navigation";
import { airports } from "~/constants/airports";
import Loading from "~/components/loading";
import { toast } from "sonner"; // Import toast from sonner

export type FlightStatus =
  | "delivery"
  | "ground"
  | "tower"
  | "departure"
  | "approach"
  | "control";

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
  route: string;
  notes?: string;
};

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

  const {
    flights,
    isLoading,
    error,
    lastUpdate,
    createFlight,
    updateFlight,
    deleteFlight,
  } = useFlights(true, airportName);

  const [draggedFlightId, setDraggedFlightId] = useState<string | null>(null);
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

  const boardSectors = useMemo(() => {
    return [
      "delivery",
      "ground",
      "tower",
      "departure",
      "approach",
      "control",
    ] as const;
  }, []);

  const flightsByStatus = useMemo(() => {
    const categories = boardSectors.reduce(
      (acc, status) => {
        acc[status] = [];
        return acc;
      },
      {} as Record<typeof boardSectors[number], Flight[]>,
    );

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

  const gridClasses = useMemo(() => {
    return "grid-cols-3";
  }, []);

  // Removed sampleFlights since sample functions are gone
  // const sampleFlights = useMemo(
  //   () => [
  //     {
  //       airport: airportName,
  //       callsign: "DAL456",
  //       geofs_callsign: "featherway",
  //       discord_username: "featherway",
  //       departure_time: "1300",
  //       aircraft_type: "A320",
  //       departure: "KORD",
  //       arrival: "KDEN",
  //       altitude: "37000",
  //       speed: "420",
  //       notes: "Weather deviation requested",
  //     },
  //     {
  //       airport: airportName,
  //       callsign: "UAL789",
  //       geofs_callsign: "user2",
  //       discord_username: "user2",
  //       departure_time: "1400",
  //       aircraft_type: "B737",
  //       departure: "KDEN",
  //       arrival: "KLAX",
  //       altitude: "29000",
  //       speed: "380",
  //       notes: "Holding for runway 25L",
  //     },
  //     {
  //       airport: airportName,
  //       callsign: "SWA123",
  //       geofs_callsign: "user3",
  //       discord_username: "user3",
  //       departure_time: "1500",
  //       aircraft_type: "B777",
  //       departure: "KLAX",
  //       arrival: "KJFK",
  //       altitude: "41000",
  //       speed: "450",
  //       notes: "Direct to destination",
  //     },
  //   ],
  //   [airportName],
  // );

  const handleFlightClick = useCallback(
    async (flightId: string) => {
      const flight = flights.find((f) => f.id === flightId);
      if (!flight) return;

      try {
        await updateFlight(flightId, {
          status: statusCycle[flight.status as FlightStatus],
        });
        toast.success(
          `Flight ${flight.callsign} moved to ${statusTitles[statusCycle[flight.status as FlightStatus]]}.`,
          {
            duration: 3000,
          },
        );
      } catch (error) {
        toast.error("Failed to update flight status. Please try again.", {
          duration: 3000,
        });
      }
    },
    [flights, updateFlight, statusCycle, statusTitles],
  );

  const handleDragStart = useCallback((flightId: string) => {
    setDraggedFlightId(flightId);
  }, []);

  const handleDrop = useCallback(
    (targetStatus: FlightStatus) => async (flightId: string) => {
      try {
        await updateFlight(flightId, { status: targetStatus });
        setDraggedFlightId(null);
        const flight = flights.find((f) => f.id === flightId);
        if (flight) {
          toast.success(
            `Flight ${flight.callsign} moved to ${statusTitles[targetStatus]} sector.`,
            {
              duration: 3000,
            },
          );
        }
      } catch (error) {
        toast.error("Failed to move flight. Please try again.", {
          duration: 3000,
        });
        setDraggedFlightId(null);
      }
    },
    [updateFlight, flights, statusTitles],
  );

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const validateFlight = useCallback(
    (flight: any): flight is ImportedFlight => {
      return (
        typeof flight === "object" &&
        typeof flight.callsign === "string" &&
        (typeof flight.aircraft_type === "string" ||
          typeof flight.aircraft === "string") &&
        typeof flight.departure === "string" &&
        (typeof flight.arrival === "string" ||
          typeof flight.destination === "string") &&
        typeof flight.altitude === "string" &&
        typeof flight.speed === "string" &&
        (flight.status === undefined ||
          ["delivery", "ground", "tower", "departure", "approach", "control"].includes(
            flight.status,
          ))
      );
    },
    [],
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
        const invalidFlights: any[] = [];

        flightsToImport.forEach((flight, index) => {
          if (validateFlight(flight)) {
            const aircraft_type = flight.aircraft_type || flight.aircraft;
            const arrival = flight.arrival || flight.destination;

            if (
              typeof aircraft_type === "string" &&
              typeof arrival === "string"
            ) {
              const normalizedFlight: Omit<Flight, "id" | "created_at" | "updated_at"> =
                {
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
                  route: flight.route || "",
                  notes: flight.notes || "",
                };
              validFlights.push(normalizedFlight);
            } else {
              invalidFlights.push({
                index,
                flight,
                reason: "Inferred types were incorrect.",
              });
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
            errorCount > 0
              ? `. ${errorCount} flights failed to import (possibly duplicates).`
              : "."
          }${
            invalidFlights.length > 0
              ? ` ${invalidFlights.length} invalid entries were skipped.`
              : ""
          }`;

          if (
            successCount > 0 &&
            errorCount === 0 &&
            invalidFlights.length === 0
          ) {
            toast.success("Import Success", {
              description: message,
              duration: 5000,
            });
          } else if (
            successCount > 0 &&
            (errorCount > 0 || invalidFlights.length > 0)
          ) {
            toast.warning("Import with Issues", {
              description: message,
              duration: 5000,
            });
          } else {
            toast.error("Import Failed", {
              description: message,
              duration: 5000,
            });
          }
        } else {
          toast.error(
            "No valid flights found in the JSON file. Please check the format.",
            {
              duration: 3000,
            },
          );
        }
      } catch (error) {
        toast.error(
          "Failed to parse JSON file. Please ensure it's a valid JSON format.",
          {
            duration: 3000,
          },
        );
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [validateFlight, createFlight, selectedImportStatus, airportName],
  );

  // Removed generateSampleJSON
  // const generateSampleJSON = useCallback(() => {
  //   const dataStr = JSON.stringify(sampleFlights, null, 2);
  //   const dataBlob = new Blob([dataStr], { type: "application/json" });
  //   const url = URL.createObjectURL(dataBlob);
  //   const link = document.createElement("a");
  //   link.href = url;
  //   link.download = `sample_flights_${airportName}.json`;
  //   link.click();
  //   URL.revokeObjectURL(url);
  //   toast.info(`A sample JSON file for ${airportName} has been downloaded.`, {
  //     duration: 3000,
  //   });
  // }, [sampleFlights, airportName]);

  // Removed copySampleJSON
  // const copySampleJSON = useCallback(async () => {
  //   const jsonString = JSON.stringify(sampleFlights, null, 2);
  //   try {
  //     await navigator.clipboard.writeText(jsonString);
  //     toast.success(
  //       "Sample JSON copied to clipboard! You can paste it into a .json file.",
  //       {
  //         duration: 3000,
  //       },
  //     );
  //   } catch (error) {
  //     toast.error(
  //       "Failed to copy to clipboard. Please try the download option instead.",
  //       {
  //         duration: 3000,
  //       },
  //     );
  //   }
  // }, [sampleFlights]);

  const handleEditFlight = useCallback((flight: Flight) => {
    setEditingFlight(flight);
    setEditDialogOpen(true);
  }, []);

  const handleUpdateFlight = useCallback(
    async (updatedFlightData: Flight) => {
      try {
        const { id, created_at, updated_at, ...updateData } = updatedFlightData;
        await updateFlight(id, updateData);

        toast.success(
          `Flight strip ${updatedFlightData.callsign} updated successfully!`,
          {
            duration: 3000,
          },
        );
      } catch (error: any) {
        toast.error(
          error.message || "Failed to update flight. Please try again.",
          {
            duration: 3000,
          },
        );
      }
    },
    [updateFlight],
  );

  const handleDeleteFlight = useCallback(
    async (flightId: string) => {
      const flightToDelete = flights.find((f) => f.id === flightId);

      try {
        await deleteFlight(flightId);
        if (flightToDelete) {
          toast.success(
            `Flight strip ${flightToDelete.callsign} deleted successfully!`,
            {
              duration: 3000,
            },
          );
        }
      } catch (error: any) {
        toast.error(
          error.message || "Failed to delete flight. Please try again.",
          {
            duration: 3000,
          },
        );
      }
    },
    [flights, deleteFlight],
  );

  const handleFlightSelection = useCallback((flightId: string) => {
    setSelectedFlights((prevSelected) =>
      prevSelected.includes(flightId)
        ? prevSelected.filter((id) => id !== flightId)
        : [...prevSelected, flightId],
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedFlights(flights.map((flight) => flight.id));
    toast.info(`${flights.length} flights selected.`, {
      duration: 2000,
    });
  }, [flights]);

  const handleClearSelection = useCallback(() => {
    setSelectedFlights([]);
    toast.info("All flight selections have been cleared.", {
      duration: 2000,
    });
  }, []);

  const handleExportFlights = useCallback(() => {
    if (selectedFlights.length === 0) {
      toast.error("No flights selected for export.", {
        duration: 3000,
      });
      return;
    }

    const flightsToExport = flights.filter((f) =>
      selectedFlights.includes(f.id),
    );

    const dataStr = JSON.stringify(flightsToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `atc_flights_${airportName}_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(
      `Exported ${flightsToExport.length} selected flight(s) successfully!`,
      {
        duration: 3000,
      },
    );
  }, [flights, selectedFlights, airportName]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedFlights.length === 0) {
      toast.error("No flights selected for deletion.", {
        duration: 3000,
      });
      return;
    }

    const flightsToDelete = flights.filter((f) =>
      selectedFlights.includes(f.id),
    );
    const flightCallsigns = flightsToDelete.map((f) => f.callsign).join(", ");

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedFlights.length} selected flight strip(s)?\n\nCallsigns: ${flightCallsigns}\n\nThis action cannot be undone.`,
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

      if (successCount > 0 && errorCount === 0) {
        toast.success("Deletion Success", {
          description: message,
          duration: 5000,
        });
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning("Deletion with Issues", {
          description: message,
          duration: 5000,
        });
      } else {
        toast.error("Deletion Failed", {
          description: message,
          duration: 5000,
        });
      }
    } catch (error) {
      toast.error("Failed to delete selected flights. Please try again.", {
        duration: 3000,
      });
    }
  }, [selectedFlights, flights, deleteFlight]);

  const handleTransferClick = useCallback(() => {
    if (selectedFlights.length === 0) {
      toast.error("No flights selected for transfer.", {
        duration: 3000,
      });
      return;
    }

    const otherAirports = airports.filter(
      (airport) => airport.id !== airportName,
    );
    setTransferDialog({
      isOpen: true,
      targetAirport: otherAirports.length > 0 ? otherAirports[0]!.id : "",
      targetSector: "delivery",
    });
  }, [selectedFlights, airportName]);

  const handleTransferConfirm = useCallback(async () => {
    if (selectedFlights.length === 0 || !transferDialog.targetAirport) {
      return;
    }

    const flightsToTransfer = flights.filter((f) =>
      selectedFlights.includes(f.id),
    );

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
      setTransferDialog({
        isOpen: false,
        targetAirport: "",
        targetSector: "delivery",
      });

      const targetAirportName =
        airports.find((a) => a.id === transferDialog.targetAirport)?.name ||
        transferDialog.targetAirport;
      const sectorName = statusTitles[transferDialog.targetSector];

      const message = `Successfully transferred ${successCount} flight strip(s) to ${targetAirportName} ${sectorName}${
        errorCount > 0 ? `. ${errorCount} flights failed to transfer.` : "."
      }`;

      if (successCount > 0 && errorCount === 0) {
        toast.success("Transfer Success", {
          description: message,
          duration: 5000,
        });
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning("Transfer with Issues", {
          description: message,
          duration: 5000,
        });
      } else {
        toast.error("Transfer Failed", {
          description: message,
          duration: 5000,
        });
      }
    } catch (error) {
      toast.error("Failed to transfer selected flights. Please try again.", {
        duration: 3000,
      });
    }
  }, [selectedFlights, flights, transferDialog, updateFlight, statusTitles]);

  const handleTransferCancel = useCallback(() => {
    setTransferDialog({
      isOpen: false,
      targetAirport: "",
      targetSector: "delivery",
    });
  }, []);

  useEffect(() => {
    console.log("Value of airportName prop:", airportName);
    console.log("Value from URL (useParams):", airportNameFromURL);
  }, [airportName, airportNameFromURL]);

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.push("/sign-up");
      } else if (
        !user?.publicMetadata ||
        user.publicMetadata.controller !== true
      ) {
        router.push("/become-controller");
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (
    !isLoaded ||
    !isSignedIn ||
    !user ||
    user.publicMetadata.controller !== true
  ) {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <div className="flex-shrink-0 p-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" passHref>
            <Button
              variant="outline"
              className="mr-4 cursor-pointer border-gray-700 bg-black text-gray-400 hover:bg-gray-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="flex-grow text-center text-3xl font-bold">
            {airportName} Board
          </h1>
          <RealTimeIndicator
            lastUpdate={lastUpdate}
            isLoading={isLoading}
            error={error}
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/file-flight" target="_blank" passHref>
            <Button
              variant="outline"
              className="shine-button cursor-pointer border-green-500 bg-black text-green-400 hover:bg-green-900 hover:text-green-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Flight Strip
            </Button>
          </Link>
          <div className="ml-1 h-8 border-l border-gray-700"></div>
          {flights.length > 0 && (
            <Button
              variant="outline"
              className="cursor-pointer border-yellow-500 bg-black text-yellow-400 hover:bg-yellow-900 hover:text-yellow-300"
              onClick={handleSelectAll}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Select All
            </Button>
          )}

          {selectedFlights.length > 0 && (
            <Button
              variant="outline"
              className="cursor-pointer border-red-500 bg-black text-red-400 hover:bg-red-900 hover:text-red-300"
              onClick={handleClearSelection}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Clear Selection
            </Button>
          )}

          <div className="flex items-center space-x-2">
            <Select
              value={selectedImportStatus}
              onValueChange={(value) =>
                setSelectedImportStatus(value as FlightStatus)
              }
            >
              <SelectTrigger className="w-[110px] border-grey-700 bg-black text-white">
                <SelectValue placeholder="Import to" />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-900">
                {boardSectors.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusTitles[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="cursor-pointer border-white bg-black text-white hover:bg-white hover:text-white"
              onClick={handleImportClick}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import JSON
            </Button>
          </div>

          <Button
            variant="outline"
            className="cursor-pointer border-purple-500 bg-black text-purple-400 hover:bg-purple-900 hover:text-purple-300"
            onClick={handleExportFlights}
            disabled={selectedFlights.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Selected
          </Button>
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
            onClick={handleTransferClick}
            disabled={selectedFlights.length === 0}
          >
            <Send className="mr-2 h-4 w-4" />
            Transfer Selected
          </Button>
          {/* Removed Copy Sample JSON Button */}
          {/* <Button
            variant="outline"
            className="bg-black border-blue-500 text-blue-400 hover:bg-blue-900 hover:text-blue-300 hover:cursor-pointer"
            onClick={copySampleJSON}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Sample JSON
          </Button> */}
          {/* Removed Download Sample Button */}
          {/* <Button
            variant="outline"
            className="bg-black border-gray-500 text-gray-300 hover:bg-gray-800 hover:text-white hover:cursor-pointer"
            onClick={generateSampleJSON}
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Sample
          </Button> */}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          className="hidden"
        />
      </div>

      <EditFlightDialog
        flight={editingFlight}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdateFlight={handleUpdateFlight}
      />

      <Dialog open={transferDialog.isOpen} onOpenChange={handleTransferCancel}>
        <DialogContent className="border-gray-700 bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              Transfer Selected Flights
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Transfer {selectedFlights.length} selected flight strip(s) to
              another board and sector.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Target Airport/Board
              </label>
              <Select
                value={transferDialog.targetAirport}
                onValueChange={(value) =>
                  setTransferDialog((prev) => ({ ...prev, targetAirport: value }))
                }
              >
                <SelectTrigger className="border-gray-700 bg-black text-white">
                  <SelectValue placeholder="Select target airport" />
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-900">
                  {airports
                    .filter((airport) => airport.id !== airportName)
                    .map((airport) => (
                      <SelectItem key={airport.id} value={airport.id}>
                        {airport.id} - {airport.name}
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
                onValueChange={(value) =>
                  setTransferDialog((prev) => ({
                    ...prev,
                    targetSector: value as FlightStatus,
                  }))
                }
              >
                <SelectTrigger className="border-gray-700 bg-black text-white">
                  <SelectValue placeholder="Select target sector" />
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-900">
                  {boardSectors.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusTitles[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {transferDialog.targetAirport && (
              <div className="rounded-lg border border-gray-600 bg-gray-800 p-3">
                <p className="text-sm text-gray-300">
                  <strong>Transfer Summary:</strong>
                  <br />
                  Moving {selectedFlights.length} flight(s) from{" "}
                  <strong>{airportName}</strong> to{" "}
                  <strong>
                    {airports.find((a) => a.id === transferDialog.targetAirport)
                      ?.name || transferDialog.targetAirport}
                  </strong>{" "}
                  under <strong>{statusTitles[transferDialog.targetSector]}</strong>{" "}
                  sector.
                </p>
                <p className="mt-2 text-xs text-yellow-400">
                  Note: This will remove the flights from the current board and
                  create them in the target board.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleTransferCancel}
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
        <div className={`grid ${gridClasses} h-full gap-4`}>
          {boardSectors.map((status) => (
            <DropZone key={status} onDrop={handleDrop(status)} className="h-full">
              <Card className="flex h-[70vh] flex-col border-gray-700 bg-gray-900">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-center text-sm text-white">
                    {statusTitles[status]} ({flightsByStatus[status].length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 overflow-y-auto p-4">
                  {flightsByStatus[status].length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-400">
                      No flights
                    </p>
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