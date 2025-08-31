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

interface EditFlightDialogProps {
  flight: Flight | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateFlight: (flight: Flight) => void
}

export function EditFlightDialog({ flight, open, onOpenChange, onUpdateFlight }: EditFlightDialogProps) {
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

  useEffect(() => {
    if (flight) {
      setFormData({
        callsign: flight.callsign,
        aircraft: flight.aircraft,
        departure: flight.departure,
        destination: flight.destination,
        altitude: flight.altitude,
        speed: flight.speed,
        status: flight.status,
        notes: flight.notes || "",
      })
    }
  }, [flight])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!flight || !formData.callsign || !formData.aircraft || !formData.departure || !formData.destination) {
      return
    }

    const updatedFlight: Flight = {
      ...flight,
      ...formData,
    }

    onUpdateFlight(updatedFlight)
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
            <div className="space-y-2">
              <Label htmlFor="edit-aircraft">Aircraft *</Label>
              <Input
                id="edit-aircraft"
                value={formData.aircraft}
                onChange={(e) => handleInputChange("aircraft", e.target.value.toUpperCase())}
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="edit-destination">Destination *</Label>
              <Input
                id="edit-destination"
                value={formData.destination}
                onChange={(e) => handleInputChange("destination", e.target.value.toUpperCase())}
                className="bg-gray-800 border-gray-600 text-white"
                required
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
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
