// src/components/CreateFlightDialog.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Plus } from "lucide-react"

// Import the correct Flight type from the single source of truth
import { type Flight } from "~/hooks/use-flights"

// UPDATED: Added new fields to the type definition
type NewFlightData = Omit<Flight, "id" | "created_at" | "updated_at"> & {
  geofs_callsign?: string;
  discord_username?: string;
  departure_time?: string;
}

interface CreateFlightDialogProps {
  onCreateFlight: (newFlightData: NewFlightData) => Promise<void>
  airportName: string
}

export function CreateFlightDialog({ onCreateFlight, airportName }: CreateFlightDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    airport: airportName,
    callsign: "",
    geofs_callsign: "",
    discord_username: "", // NEW STATE FIELD
    aircraft_type: "",
    departure: "",
    departure_time: "", // NEW STATE FIELD
    arrival: "",
    altitude: "",
    speed: "",
    status: "delivery",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validation remains the same, as the new fields are optional
    if (!formData.callsign || !formData.aircraft_type || !formData.departure || !formData.arrival || !formData.status) {
      console.log("Missing required fields");
      return
    }

    await onCreateFlight(formData as NewFlightData)

    // Reset form and close dialog
    setFormData({
      airport: airportName,
      callsign: "",
      geofs_callsign: "",
      discord_username: "", // RESET NEW FIELD
      aircraft_type: "",
      departure: "",
      departure_time: "", // RESET NEW FIELD
      arrival: "",
      altitude: "",
      speed: "",
      status: "delivery",
      notes: "",
    })
    console.log(formData)
    setOpen(false)
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const statusOptions = ["delivery", "ground", "tower", "departure", "approach", "control"]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-black border-green-500 text-green-400 hover:bg-green-900 hover:text-green-300 shine-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Flight Strip
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Flight Strip</DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter flight details to create a new flight strip.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="hidden" value={formData.airport} name="airport" />
          
          {/* Group 1: Callsign & Pilot Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="callsign">Callsign *</Label>
              <Input
                id="callsign"
                value={formData.callsign}
                onChange={(e) => handleInputChange("callsign", e.target.value.toUpperCase())}
                placeholder="UAL123"
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="geofs_callsign">GeoFS Callsign</Label>
              <Input
                id="geofs_callsign"
                value={formData.geofs_callsign}
                onChange={(e) => handleInputChange("geofs_callsign", e.target.value)}
                placeholder="Ayman"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            {/* NEW FIELD: Discord Username */}
            <div className="space-y-2">
              <Label htmlFor="discord_username">Discord Username</Label>
              <Input
                id="discord_username"
                value={formData.discord_username}
                onChange={(e) => handleInputChange("discord_username", e.target.value)}
                placeholder="pilot_user"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>

          {/* Group 2: Aircraft & Route */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aircraft_type">Aircraft *</Label>
              <Input
                id="aircraft_type"
                value={formData.aircraft_type}
                onChange={(e) => handleInputChange("aircraft_type", e.target.value.toUpperCase())}
                placeholder="B737-800"
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departure">Departure *</Label>
              <Input
                id="departure"
                value={formData.departure}
                onChange={(e) => handleInputChange("departure", e.target.value.toUpperCase())}
                placeholder="KJFK"
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrival">Arrival *</Label>
              <Input
                id="arrival"
                value={formData.arrival}
                onChange={(e) => handleInputChange("arrival", e.target.value.toUpperCase())}
                placeholder="KLAX"
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
            {/* NEW FIELD: Departure Time */}
            <div className="space-y-2">
              <Label htmlFor="departure_time">Departure Time</Label>
              <Input
                id="departure_time"
                value={formData.departure_time}
                onChange={(e) => handleInputChange("departure_time", e.target.value)}
                placeholder="14:30"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>

          {/* Group 3: Performance & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="altitude">Altitude</Label>
              <Input
                id="altitude"
                value={formData.altitude}
                onChange={(e) => handleInputChange("altitude", e.target.value)}
                placeholder="35000"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="speed">Speed</Label>
              <Input
                id="speed"
                value={formData.speed}
                onChange={(e) => handleInputChange("speed", e.target.value)}
                placeholder="450"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
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

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Controller Notes</Label>
            <Textarea
              id="notes"
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
              onClick={() => setOpen(false)}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
              Create Flight Strip
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}