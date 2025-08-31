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

interface CreateFlightDialogProps {
  onCreateFlight: (flight: Flight) => void
}

export function CreateFlightDialog({ onCreateFlight }: CreateFlightDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    callsign: "",
    aircraft: "",
    departure: "",
    destination: "",
    altitude: "",
    speed: "",
    status: "all" as Flight["status"],
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.callsign || !formData.aircraft || !formData.departure || !formData.destination) {
      return
    }

    const newFlight: Flight = {
      id: `flight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...formData,
    }

    onCreateFlight(newFlight)

    // Reset form and close dialog
    setFormData({
      callsign: "",
      aircraft: "",
      departure: "",
      destination: "",
      altitude: "",
      speed: "",
      status: "all",
      notes: "",
    })
    setOpen(false)
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

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
              <Label htmlFor="aircraft">Aircraft *</Label>
              <Input
                id="aircraft"
                value={formData.aircraft}
                onChange={(e) => handleInputChange("aircraft", e.target.value.toUpperCase())}
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
              <Label htmlFor="destination">Destination *</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => handleInputChange("destination", e.target.value.toUpperCase())}
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
              onValueChange={(value: Flight["status"]) => handleInputChange("status", value)}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Flights</SelectItem>
                <SelectItem value="current">Current Flights</SelectItem>
                <SelectItem value="transferred">Transferred Flights</SelectItem>
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
