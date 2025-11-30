"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import Header from "./header";

import { type Flight } from "~/hooks/use-flights";
import { type FlightStatus } from "~/components/board-page-client";

interface EditFlightDialogProps {
  flight: Flight | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateFlight: (updatedFlight: Flight) => Promise<void>;
}

export function EditFlightDialog({
  flight,
  open,
  onOpenChange,
  onUpdateFlight,
}: EditFlightDialogProps) {
  const [formData, setFormData] = useState({
    callsign: "",
    geofs_callsign: "",
    discord_username: "",
    aircraft_type: "",
    departure: "",
    departure_time: "",
    arrival: "",
    altitude: "",
    speed: "",
    status: "delivery" as FlightStatus,
    route: "",
    notes: "",
    squawk: "", // ✅ Added squawk
  });

  const statusOptions: FlightStatus[] = [
    "delivery",
    "ground",
    "tower",
    "departure",
    "approach",
    "control",
  ];

  useEffect(() => {
    if (flight) {
      setFormData({
        callsign: flight.callsign,
        geofs_callsign: flight.geofs_callsign || "",
        discord_username: flight.discord_username || "",
        aircraft_type: flight.aircraft_type,
        departure: flight.departure,
        departure_time: flight.departure_time || "",
        arrival: flight.arrival,
        altitude: flight.altitude,
        speed: flight.speed,
        status: flight.status as FlightStatus,
        route: flight.route || "",
        notes: flight.notes || "",
        squawk: flight.squawk || "", // ✅ Initialize squawk
      });
    }
  }, [flight]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSquawkChange = (value: string) => {
    // Only numeric, max 4 digits
    const numeric = value.replace(/\D/g, "").slice(0, 4);
    setFormData((prev) => ({ ...prev, squawk: numeric }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !flight ||
      !formData.callsign ||
      !formData.aircraft_type ||
      !formData.departure ||
      !formData.arrival
    ) {
      return;
    }

    const updatedFlight: Flight = {
      ...flight,
      ...formData,
    };

    await onUpdateFlight(updatedFlight);
    onOpenChange(false);
  };

  if (!flight) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Header />
      <DialogContent className="max-w-2xl border-gray-700 bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle>Edit Flight Strip</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update flight details for {flight.callsign}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Callsign, GeoFS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-callsign">Callsign *</Label>
              <Input
                id="edit-callsign"
                value={formData.callsign}
                onChange={(e) =>
                  handleInputChange("callsign", e.target.value.toUpperCase())
                }
                className="border-gray-600 bg-gray-800 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-geofs_callsign">GeoFS Callsign</Label>
              <Input
                id="edit-geofs_callsign"
                value={formData.geofs_callsign}
                onChange={(e) =>
                  handleInputChange("geofs_callsign", e.target.value)
                }
                className="border-gray-600 bg-gray-800 text-white"
              />
            </div>
          </div>

          {/* Aircraft, Departure, Arrival, Departure Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-aircraft_type">Aircraft *</Label>
              <Input
                id="edit-aircraft_type"
                value={formData.aircraft_type}
                onChange={(e) =>
                  handleInputChange(
                    "aircraft_type",
                    e.target.value.toUpperCase(),
                  )
                }
                className="border-gray-600 bg-gray-800 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-departure">Departure *</Label>
              <Input
                id="edit-departure"
                value={formData.departure}
                onChange={(e) =>
                  handleInputChange("departure", e.target.value.toUpperCase())
                }
                className="border-gray-600 bg-gray-800 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-arrival">Arrival *</Label>
              <Input
                id="edit-arrival"
                value={formData.arrival}
                onChange={(e) =>
                  handleInputChange("arrival", e.target.value.toUpperCase())
                }
                className="border-gray-600 bg-gray-800 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-departure_time">Departure Time</Label>
              <Input
                id="edit-departure_time"
                value={formData.departure_time}
                onChange={(e) =>
                  handleInputChange("departure_time", e.target.value)
                }
                className="border-gray-600 bg-gray-800 text-white"
              />
            </div>
          </div>

          {/* Altitude, Speed, Status, Squawk */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="edit-altitude">Altitude</Label>
              <Input
                id="edit-altitude"
                value={formData.altitude}
                onChange={(e) => handleInputChange("altitude", e.target.value)}
                className="border-gray-600 bg-gray-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-speed">Speed</Label>
              <Input
                id="edit-speed"
                value={formData.speed}
                onChange={(e) => handleInputChange("speed", e.target.value)}
                className="border-gray-600 bg-gray-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: FlightStatus) =>
                  handleInputChange("status", value)
                }
              >
                <SelectTrigger className="border-gray-600 bg-gray-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-gray-600 bg-gray-800">
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ✅ New Squawk Input */}
            <div className="space-y-2">
              <Label htmlFor="edit-squawk">Squawk</Label>
              <Input
                id="edit-squawk"
                value={formData.squawk}
                onChange={(e) => handleSquawkChange(e.target.value)}
                placeholder="e.g. 4721"
                className="border-gray-600 bg-gray-800 text-white"
                maxLength={4}
              />
            </div>
          </div>

          {/* Route & Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-route">Route</Label>
            <Textarea
              id="edit-route"
              value={formData.route}
              onChange={(e) => handleInputChange("route", e.target.value)}
              placeholder="edit route for this flight..."
              className="min-h-[80px] border-gray-600 bg-gray-800 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Controller Notes</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any notes for this flight..."
              className="min-h-[80px] border-gray-600 bg-gray-800 text-white"
            />
          </div>

          {/* Dialog footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Update Flight Strip
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
