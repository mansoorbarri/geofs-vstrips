"use client"

import type React from "react"
import { useState, useRef, useCallback, useMemo } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Upload, FileText, AlertCircle, CheckCircle, Copy, Download } from "lucide-react"
import { FlightStrip } from "~/components/flight-strip"
import { DropZone } from "~/components/drop-zone"
import { CreateFlightDialog } from "~/components/create-flight-dialog"
import { EditFlightDialog } from "~/components/edit-flight-dialog"
import { RealTimeIndicator } from "~/components/real-time-indicator"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { useFlights, type Flight } from "~/hooks/use-flights"

type FlightStatus = "delivery" | "ground" | "tower" | "departure" | "approach" | "control"

interface ImportStatus {
  type: "success" | "error" | null
  message: string
}

export default function ATCFlightStrip() {
  const { flights, isLoading, error, lastUpdate, createFlight, updateFlight, deleteFlight } = useFlights(true)

  const [draggedFlightId, setDraggedFlightId] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<ImportStatus>({ type: null, message: "" })
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Memoize flight categorization for better performance
  const flightsByStatus = useMemo(() => {
    const categories = {
      delivery: [] as Flight[],
      ground: [] as Flight[],
      tower: [] as Flight[],
      departure: [] as Flight[],
      approach: [] as Flight[],
      control: [] as Flight[]
    }

    flights.forEach((flight) => {
      if (categories[flight.status]) {
        categories[flight.status].push(flight)
      }
    })

    return categories
  }, [flights])

  // Memoize status cycle for performance
  const statusCycle: Record<FlightStatus, FlightStatus> = useMemo(() => ({
    delivery: "ground",
    ground: "tower",
    tower: "departure",
    departure: "approach",
    approach: "control",
    control: "delivery",
  }), [])

  // Show status message helper
  const showStatus = useCallback((type: "success" | "error", message: string, duration = 3000) => {
    setImportStatus({ type, message })
    setTimeout(() => setImportStatus({ type: null, message: "" }), duration)
  }, [])

  const handleFlightClick = useCallback(async (flightId: string) => {
    const flight = flights.find((f) => f.id === flightId)
    if (!flight) return

    try {
      await updateFlight(flightId, { status: statusCycle[flight.status] })
    } catch (error) {
      showStatus("error", "Failed to update flight status. Please try again.")
    }
  }, [flights, updateFlight, statusCycle, showStatus])

  const handleDragStart = useCallback((flightId: string) => {
    setDraggedFlightId(flightId)
  }, [])

  const handleDrop = useCallback((targetStatus: FlightStatus) => async (flightId: string) => {
    try {
      await updateFlight(flightId, { status: targetStatus })
      setDraggedFlightId(null)
    } catch (error) {
      showStatus("error", "Failed to move flight. Please try again.")
      setDraggedFlightId(null)
    }
  }, [updateFlight, showStatus])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const validateFlight = useCallback((flight: any): flight is Omit<Flight, "id" | "created_at" | "updated_at"> => {
    return (
      typeof flight === "object" &&
      typeof flight.callsign === "string" &&
      (typeof flight.aircraft_type === "string" || typeof flight.aircraft === "string") &&
      typeof flight.departure === "string" &&
      (typeof flight.arrival === "string" || typeof flight.destination === "string") &&
      typeof flight.altitude === "string" &&
      typeof flight.speed === "string" &&
      ["delivery", "ground", "tower", "departure", "approach", "control"].includes(flight.status)
    )
  }, [])

  const handleFileImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const jsonData = JSON.parse(text)
      const flightsToImport = Array.isArray(jsonData) ? jsonData : [jsonData]

      const validFlights: Omit<Flight, "id" | "created_at" | "updated_at">[] = []
      const invalidFlights: any[] = []

      flightsToImport.forEach((flight, index) => {
        if (validateFlight(flight)) {
          const normalizedFlight = {
            callsign: flight.callsign,
            aircraft_type: flight.aircraft_type || flight.aircraft,
            departure: flight.departure,
            arrival: flight.arrival || flight.destination,
            altitude: flight.altitude,
            speed: flight.speed,
            status: flight.status,
            notes: flight.notes || "",
          }
          validFlights.push(normalizedFlight)
        } else {
          invalidFlights.push({ index, flight })
        }
      })

      if (validFlights.length > 0) {
        let successCount = 0
        let errorCount = 0

        // Process imports in batches for better performance
        const batchSize = 5
        for (let i = 0; i < validFlights.length; i += batchSize) {
          const batch = validFlights.slice(i, i + batchSize)
          const promises = batch.map(async (flight) => {
            try {
              await createFlight(flight)
              return { success: true }
            } catch (error) {
              return { success: false }
            }
          })

          const results = await Promise.all(promises)
          successCount += results.filter(r => r.success).length
          errorCount += results.filter(r => !r.success).length
        }

        const message = `Successfully imported ${successCount} flight(s)${
          errorCount > 0 ? `. ${errorCount} flights failed to import (possibly duplicates).` : "."
        }${invalidFlights.length > 0 ? ` ${invalidFlights.length} invalid entries were skipped.` : ""}`

        showStatus(successCount > 0 ? "success" : "error", message, 5000)
      } else {
        showStatus("error", "No valid flights found in the JSON file. Please check the format.")
      }
    } catch (error) {
      showStatus("error", "Failed to parse JSON file. Please ensure it's a valid JSON format.")
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [validateFlight, createFlight, showStatus])

  const sampleFlights = useMemo(() => [
    {
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
      callsign: "SWA789",
      aircraft_type: "B737-700",
      departure: "KPHX",
      arrival: "KLAS",
      altitude: "33000",
      speed: "430",
      status: "tower" as FlightStatus,
    },
  ], [])

  const generateSampleJSON = useCallback(() => {
    const dataStr = JSON.stringify(sampleFlights, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "sample_flights.json"
    link.click()
    URL.revokeObjectURL(url)
  }, [sampleFlights])

  const copySampleJSON = useCallback(async () => {
    const jsonString = JSON.stringify(sampleFlights, null, 2)
    try {
      await navigator.clipboard.writeText(jsonString)
      showStatus("success", "Sample JSON copied to clipboard! You can paste it into a .json file.")
    } catch (error) {
      showStatus("error", "Failed to copy to clipboard. Please try the download option instead.")
    }
  }, [sampleFlights, showStatus])

  const handleCreateFlight = useCallback(async (newFlightData: Omit<Flight, "id" | "created_at" | "updated_at">) => {
    try {
      const newFlight = await createFlight(newFlightData)
      showStatus("success", `Flight strip ${newFlight.callsign} created successfully!`)
    } catch (error: any) {
      showStatus("error", error.message || "Failed to create flight. Please try again.")
    }
  }, [createFlight, showStatus])

  const handleEditFlight = useCallback((flight: Flight) => {
    setEditingFlight(flight)
    setEditDialogOpen(true)
  }, [])

  const handleUpdateFlight = useCallback(async (updatedFlightData: Flight) => {
    try {
      const updatedFlight = await updateFlight(updatedFlightData.id, {
        callsign: updatedFlightData.callsign,
        aircraft_type: updatedFlightData.aircraft_type,
        departure: updatedFlightData.departure,
        arrival: updatedFlightData.arrival,
        altitude: updatedFlightData.altitude,
        speed: updatedFlightData.speed,
        status: updatedFlightData.status,
        notes: updatedFlightData.notes,
      })

      showStatus("success", `Flight strip ${updatedFlight.callsign} updated successfully!`)
    } catch (error: any) {
      showStatus("error", error.message || "Failed to update flight. Please try again.")
    }
  }, [updateFlight, showStatus])

  const handleDeleteFlight = useCallback(async (flightId: string) => {
    const flightToDelete = flights.find((f) => f.id === flightId)

    try {
      await deleteFlight(flightId)
      if (flightToDelete) {
        showStatus("success", `Flight strip ${flightToDelete.callsign} deleted successfully!`)
      }
    } catch (error: any) {
      showStatus("error", error.message || "Failed to delete flight. Please try again.")
    }
  }, [flights, deleteFlight, showStatus])

  const handleExportFlights = useCallback(() => {
    if (flights.length === 0) {
      showStatus("error", "No flights to export. Add some flights first.")
      return
    }

    const dataStr = JSON.stringify(flights, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `atc_flights_${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)

    showStatus("success", `Exported ${flights.length} flight(s) successfully!`)
  }, [flights, showStatus])

  // Render flight category component for better code reuse
  const renderFlightCategory = useCallback((
    status: FlightStatus,
    title: string,
    flights: Flight[]
  ) => (
    <DropZone key={status} onDrop={handleDrop(status)}>
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-center text-sm">
            {title} ({flights.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 min-h-96">
          {flights.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm">No flights</p>
          ) : (
            flights.map((flight) => (
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
  ), [handleDrop, handleFlightClick, handleDragStart, draggedFlightId, handleEditFlight, handleDeleteFlight])

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-full mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">ATC Flight Strip Manager</h1>
            <RealTimeIndicator lastUpdate={lastUpdate} isLoading={isLoading} error={error} />
          </div>
          <div className="flex gap-4 flex-wrap">
            <CreateFlightDialog onCreateFlight={handleCreateFlight} />
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
          <Alert className={`mb-6 ${importStatus.type === "success" ? "border-green-600" : "border-red-600"}`}>
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
          {renderFlightCategory("delivery", "Delivery", flightsByStatus.delivery)}
          {renderFlightCategory("ground", "Ground", flightsByStatus.ground)}
          {renderFlightCategory("tower", "Tower", flightsByStatus.tower)}
          {renderFlightCategory("departure", "Departure", flightsByStatus.departure)}
          {renderFlightCategory("approach", "Approach", flightsByStatus.approach)}
          {renderFlightCategory("control", "Control", flightsByStatus.control)}
        </div>

        <div className="mt-8 p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <p className="text-gray-300 text-sm">
            <strong>Database Ready:</strong> The application is now configured with Prisma for efficient database 
            operations and real-time sharing with full type safety. All flight data is persisted with automatic 
            history tracking and optimized queries for better performance.
          </p>
        </div>
      </div>
    </div>
  )
}