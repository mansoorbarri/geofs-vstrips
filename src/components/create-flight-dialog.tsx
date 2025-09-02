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

// FIXED: Remove "airport" from the Omit. The parent component expects this field.
type NewFlightData = Omit<Flight, "id" | "created_at" | "updated_at">

interface CreateFlightDialogProps {
  onCreateFlight: (newFlightData: NewFlightData) => Promise<void>
  airportName: string
}

export function CreateFlightDialog({ onCreateFlight, airportName }: CreateFlightDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    airport: airportName,
    callsign: "",
    aircraft_type: "",
    departure: "",
    arrival: "",
    altitude: "",
    speed: "",
    status: "delivery",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.callsign || !formData.aircraft_type || !formData.departure || !formData.arrival || !formData.status) {
      // You should add some user feedback here
      console.log("Missing required fields");
      return
    }

    // Call the onCreateFlight function with the correctly typed data
    // The formData object already contains the 'airport' field.
    await onCreateFlight(formData as NewFlightData)

    // Reset form and close dialog
    setFormData({
      airport: airportName,
      callsign: "",
      aircraft_type: "",
      departure: "",
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

  // The status options
  const statusOptions = ["delivery", "ground", "tower", "departure", "approach", "control"]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-black border-green-500 text-green-400 hover:bg-green-900 hover:text-green-300"
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
          {/* Hidden input to automatically include the airport name */}
          <Input type="hidden" value={formData.airport} name="airport" />
          
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

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