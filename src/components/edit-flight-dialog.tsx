// src/components/edit-flight-dialog.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"

// Import the correct Flight type from the single source of truth
import { type Flight } from "~/hooks/use-flights"

// The FlightStatus type is defined in the main page component, so we can import it
import { type FlightStatus } from "~/components/board-page-client"

interface EditFlightDialogProps {
  flight: Flight | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateFlight: (updatedFlight: Flight) => Promise<void>
}

export function EditFlightDialog({ flight, open, onOpenChange, onUpdateFlight }: EditFlightDialogProps) {
  // UPDATED: Added new state fields for Discord and departure time
  const [formData, setFormData] = useState({
    callsign: "",
    geofs_callsign: "",
    discord_username: "", // NEW STATE FIELD
    aircraft_type: "",
    departure: "",
    departure_time: "", // NEW STATE FIELD
    arrival: "",
    altitude: "",
    speed: "",
    status: "delivery" as FlightStatus,
    notes: "",
  })

  const statusOptions: FlightStatus[] = ["delivery", "ground", "tower", "departure", "approach", "control"]

  useEffect(() => {
    if (flight) {
      // UPDATED: Initialize with the new fields from the flight prop
      setFormData({
        callsign: flight.callsign,
        geofs_callsign: flight.geofs_callsign || "",
        discord_username: flight.discord_username || "", // NEW INITIALIZATION
        aircraft_type: flight.aircraft_type,
        departure: flight.departure,
        departure_time: flight.departure_time || "", // NEW INITIALIZATION
        arrival: flight.arrival,
        altitude: flight.altitude,
        speed: flight.speed,
        status: flight.status as FlightStatus,
        notes: flight.notes || "",
      })
    }
  }, [flight])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation remains the same. The new fields are optional.
    if (!flight || !formData.callsign || !formData.aircraft_type || !formData.departure || !formData.arrival) {
      return
    }

    const updatedFlight: Flight = {
      ...flight,
      ...formData,
    }

    await onUpdateFlight(updatedFlight)
    onOpenChange(false)
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!flight) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Flight Strip</DialogTitle>
          <DialogDescription className="text-gray-400">Update flight details for {flight.callsign}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-callsign">Callsign *</Label>
              <Input
                id="edit-callsign"
                value={formData.callsign}
                onChange={(e) => handleInputChange("callsign", e.target.value.toUpperCase())}
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
            {/* Field for GeoFS Callsign */}
            <div className="space-y-2">
              <Label htmlFor="edit-geofs_callsign">GeoFS Callsign</Label>
              <Input
                id="edit-geofs_callsign"
                value={formData.geofs_callsign}
                onChange={(e) => handleInputChange("geofs_callsign", e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            {/* NEW FIELD for Discord Username */}
            <div className="space-y-2">
              <Label htmlFor="edit-discord_username">Discord Username</Label>
              <Input
                id="edit-discord_username"
                value={formData.discord_username}
                onChange={(e) => handleInputChange("discord_username", e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-aircraft_type">Aircraft *</Label>
              <Input
                id="edit-aircraft_type"
                value={formData.aircraft_type}
                onChange={(e) => handleInputChange("aircraft_type", e.target.value.toUpperCase())}
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-departure">Departure *</Label>
              <Input
                id="edit-departure"
                value={formData.departure}
                onChange={(e) => handleInputChange("departure", e.target.value.toUpperCase())}
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-arrival">Arrival *</Label>
              <Input
                id="edit-arrival"
                value={formData.arrival}
                onChange={(e) => handleInputChange("arrival", e.target.value.toUpperCase())}
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
            {/* NEW FIELD for Departure Time */}
            <div className="space-y-2">
              <Label htmlFor="edit-departure_time">Departure Time</Label>
              <Input
                id="edit-departure_time"
                value={formData.departure_time}
                onChange={(e) => handleInputChange("departure_time", e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-altitude">Altitude</Label>
              <Input
                id="edit-altitude"
                value={formData.altitude}
                onChange={(e) => handleInputChange("altitude", e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-speed">Speed</Label>
              <Input
                id="edit-speed"
                value={formData.speed}
                onChange={(e) => handleInputChange("speed", e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: FlightStatus) => handleInputChange("status", value)}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Controller Notes</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any notes for this flight..."
              className="bg-gray-800 border-gray-600 text-white min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Update Flight Strip
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}