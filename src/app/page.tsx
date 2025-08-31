"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Upload, FileText, AlertCircle, CheckCircle, Copy, Download } from "lucide-react"
import { FlightStrip } from "~/components/flight-strip"
import { DropZone } from "~/components/drop-zone"
import { CreateFlightDialog } from "~/components/create-flight-dialog"
import { EditFlightDialog } from "~/components/edit-flight-dialog"
import { Alert, AlertDescription } from "~/components/ui/alert"

interface Flight {
  id: string
  callsign: string
  aircraft: string
  departure: string
  destination: string
  altitude: string
  speed: string
  status: "all" | "current" | "transferred"
  notes?: string
}

export default function ATCFlightStrip() {
  const [flights, setFlights] = useState<Flight[]>([])
  const [draggedFlightId, setDraggedFlightId] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | null
    message: string
  }>({ type: null, message: "" })
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allFlights = flights.filter((flight) => flight.status === "all")
  const currentFlights = flights.filter((flight) => flight.status === "current")
  const transferredFlights = flights.filter((flight) => flight.status === "transferred")

  const handleFlightClick = (flightId: string) => {
    setFlights((prevFlights) =>
      prevFlights.map((flight) => {
        if (flight.id === flightId) {
          const statusCycle: Record<Flight["status"], Flight["status"]> = {
            all: "current",
            current: "transferred",
            transferred: "all",
          }
          return { ...flight, status: statusCycle[flight.status] }
        }
        return flight
      }),
    )
  }

  const handleDragStart = (flightId: string) => {
    setDraggedFlightId(flightId)
  }

  const handleDrop = (targetStatus: Flight["status"]) => (flightId: string) => {
    setFlights((prevFlights) =>
      prevFlights.map((flight) => (flight.id === flightId ? { ...flight, status: targetStatus } : flight)),
    )
    setDraggedFlightId(null)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const validateFlight = (flight: any): flight is Flight => {
    return (
      typeof flight === "object" &&
      typeof flight.id === "string" &&
      typeof flight.callsign === "string" &&
      typeof flight.aircraft === "string" &&
      typeof flight.departure === "string" &&
      typeof flight.destination === "string" &&
      typeof flight.altitude === "string" &&
      typeof flight.speed === "string" &&
      (flight.status === "all" || flight.status === "current" || flight.status === "transferred")
    )
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const jsonData = JSON.parse(text)

      const flightsToImport = Array.isArray(jsonData) ? jsonData : [jsonData]

      const validFlights: Flight[] = []
      const invalidFlights: any[] = []

      flightsToImport.forEach((flight, index) => {
        if (validateFlight(flight)) {
          const uniqueFlight = {
            ...flight,
            id: `${flight.id}_${Date.now()}_${index}`,
          }
          validFlights.push(uniqueFlight)
        } else {
          invalidFlights.push({ index, flight })
        }
      })

      if (validFlights.length > 0) {
        setFlights((prevFlights) => [...prevFlights, ...validFlights])
        setImportStatus({
          type: "success",
          message: `Successfully imported ${validFlights.length} flight(s)${
            invalidFlights.length > 0 ? `. ${invalidFlights.length} invalid entries were skipped.` : "."
          }`,
        })
      } else {
        setImportStatus({
          type: "error",
          message: "No valid flights found in the JSON file. Please check the format.",
        })
      }
    } catch (error) {
      setImportStatus({
        type: "error",
        message: "Failed to parse JSON file. Please ensure it's a valid JSON format.",
      })
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    setTimeout(() => {
      setImportStatus({ type: null, message: "" })
    }, 5000)
  }

  const generateSampleJSON = () => {
    const sampleFlights: Flight[] = [
      {
        id: "sample_1",
        callsign: "UAL123",
        aircraft: "B737-800",
        departure: "KJFK",
        destination: "KLAX",
        altitude: "35000",
        speed: "450",
        status: "all",
        notes: "Priority passenger on board",
      },
      {
        id: "sample_2",
        callsign: "DAL456",
        aircraft: "A320",
        departure: "KORD",
        destination: "KDEN",
        altitude: "37000",
        speed: "420",
        status: "current",
        notes: "Weather deviation requested",
      },
      {
        id: "sample_3",
        callsign: "SWA789",
        aircraft: "B737-700",
        departure: "KPHX",
        destination: "KLAS",
        altitude: "33000",
        speed: "430",
        status: "transferred",
      },
    ]

    const dataStr = JSON.stringify(sampleFlights, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "sample_flights.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const copySampleJSON = () => {
    const sampleFlights: Flight[] = [
      {
        id: "sample_1",
        callsign: "UAL123",
        aircraft: "B737-800",
        departure: "KJFK",
        destination: "KLAX",
        altitude: "35000",
        speed: "450",
        status: "all",
        notes: "Priority passenger on board",
      },
      {
        id: "sample_2",
        callsign: "DAL456",
        aircraft: "A320",
        departure: "KORD",
        destination: "KDEN",
        altitude: "37000",
        speed: "420",
        status: "current",
        notes: "Weather deviation requested",
      },
      {
        id: "sample_3",
        callsign: "SWA789",
        aircraft: "B737-700",
        departure: "KPHX",
        destination: "KLAS",
        altitude: "33000",
        speed: "430",
        status: "transferred",
      },
    ]

    const jsonString = JSON.stringify(sampleFlights, null, 2)
    navigator.clipboard
      .writeText(jsonString)
      .then(() => {
        setImportStatus({
          type: "success",
          message: "Sample JSON copied to clipboard! You can paste it into a .json file.",
        })

        setTimeout(() => {
          setImportStatus({ type: null, message: "" })
        }, 3000)
      })
      .catch(() => {
        setImportStatus({
          type: "error",
          message: "Failed to copy to clipboard. Please try the download option instead.",
        })

        setTimeout(() => {
          setImportStatus({ type: null, message: "" })
        }, 3000)
      })
  }

  const handleCreateFlight = (newFlight: Flight) => {
    setFlights((prevFlights) => [...prevFlights, newFlight])
    setImportStatus({
      type: "success",
      message: `Flight strip ${newFlight.callsign} created successfully!`,
    })

    setTimeout(() => {
      setImportStatus({ type: null, message: "" })
    }, 3000)
  }

  const handleEditFlight = (flight: Flight) => {
    setEditingFlight(flight)
    setEditDialogOpen(true)
  }

  const handleUpdateFlight = (updatedFlight: Flight) => {
    setFlights((prevFlights) => prevFlights.map((flight) => (flight.id === updatedFlight.id ? updatedFlight : flight)))
    setImportStatus({
      type: "success",
      message: `Flight strip ${updatedFlight.callsign} updated successfully!`,
    })

    setTimeout(() => {
      setImportStatus({ type: null, message: "" })
    }, 3000)
  }

  const handleDeleteFlight = (flightId: string) => {
    const flightToDelete = flights.find((f) => f.id === flightId)
    setFlights((prevFlights) => prevFlights.filter((flight) => flight.id !== flightId))

    if (flightToDelete) {
      setImportStatus({
        type: "success",
        message: `Flight strip ${flightToDelete.callsign} deleted successfully!`,
      })

      setTimeout(() => {
        setImportStatus({ type: null, message: "" })
      }, 3000)
    }
  }

  const handleExportFlights = () => {
    if (flights.length === 0) {
      setImportStatus({
        type: "error",
        message: "No flights to export. Add some flights first.",
      })

      setTimeout(() => {
        setImportStatus({ type: null, message: "" })
      }, 3000)
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

    setImportStatus({
      type: "success",
      message: `Exported ${flights.length} flight(s) successfully!`,
    })

    setTimeout(() => {
      setImportStatus({ type: null, message: "" })
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">ATC Flight Strip Manager</h1>
          <div className="flex gap-4 flex-wrap">
            <CreateFlightDialog onCreateFlight={handleCreateFlight} />
            <Button
              variant="outline"
              className="bg-black border-white text-white  hover:bg-gray-800 hover:text-white"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DropZone onDrop={handleDrop("all")}>
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-center">All Flights ({allFlights.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 min-h-96">
                {allFlights.length === 0 && <p className="text-gray-400 text-center py-8">No flights in queue</p>}
                {allFlights.map((flight) => (
                  <FlightStrip
                    key={flight.id}
                    flight={flight}
                    onClick={() => handleFlightClick(flight.id)}
                    onDragStart={handleDragStart}
                    isDragging={draggedFlightId === flight.id}
                    onEdit={handleEditFlight}
                    onDelete={handleDeleteFlight}
                  />
                ))}
              </CardContent>
            </Card>
          </DropZone>

          <DropZone onDrop={handleDrop("current")}>
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-center">Current Flights ({currentFlights.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 min-h-96">
                {currentFlights.length === 0 && <p className="text-gray-400 text-center py-8">No active flights</p>}
                {currentFlights.map((flight) => (
                  <FlightStrip
                    key={flight.id}
                    flight={flight}
                    onClick={() => handleFlightClick(flight.id)}
                    onDragStart={handleDragStart}
                    isDragging={draggedFlightId === flight.id}
                    onEdit={handleEditFlight}
                    onDelete={handleDeleteFlight}
                  />
                ))}
              </CardContent>
            </Card>
          </DropZone>

          <DropZone onDrop={handleDrop("transferred")}>
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-center">
                  Transferred Flights ({transferredFlights.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 min-h-96">
                {transferredFlights.length === 0 && (
                  <p className="text-gray-400 text-center py-8">No transferred flights</p>
                )}
                {transferredFlights.map((flight) => (
                  <FlightStrip
                    key={flight.id}
                    flight={flight}
                    onClick={() => handleFlightClick(flight.id)}
                    onDragStart={handleDragStart}
                    isDragging={draggedFlightId === flight.id}
                    onEdit={handleEditFlight}
                    onDelete={handleDeleteFlight}
                  />
                ))}
              </CardContent>
            </Card>
          </DropZone>
        </div>
      </div>
    </div>
  )
}
