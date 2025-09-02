"use client"

import type React from "react"
import { Edit, Trash2 } from "lucide-react"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"

// Import both Flight and FlightStatus from the same source
import { type Flight } from "~/hooks/use-flights"

// Define FlightStatus here since it's used for UI logic
export type FlightStatus = "delivery" | "ground" | "tower" | "departure" | "approach" | "control";

interface FlightStripProps {
  flight: Flight
  onClick?: () => void
  onDragStart?: (flightId: string) => void
  className?: string
  isDragging?: boolean
  onEdit?: (flight: Flight) => void
  onDelete?: (flightId: string) => void
}

export function FlightStrip({
  flight,
  onClick,
  onDragStart,
  className,
  isDragging,
  onEdit,
  onDelete,
}: FlightStripProps) {
  const getStatusColors = (status: FlightStatus) => {
    switch (status) {
      case "delivery":
        return "bg-gray-800 border-gray-600 hover:bg-gray-700"
      case "ground":
        return "bg-blue-900 border-blue-600 hover:bg-blue-800"
      case "tower":
        return "bg-green-900 border-green-600 hover:bg-green-800"
      case "departure":
        return "bg-purple-900 border-purple-600 hover:bg-purple-800"
      case "approach":
        return "bg-indigo-900 border-indigo-600 hover:bg-indigo-800"
      case "control":
        return "bg-red-900 border-red-600 hover:bg-red-800"
      default:
        return "bg-gray-800 border-gray-600 hover:bg-gray-700"
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", flight.id)
    e.dataTransfer.effectAllowed = "move"
    onDragStart?.(flight.id)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(flight)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(flight.id)
  }

  return (
    <div
      className={cn(
        "p-3 rounded border cursor-pointer transition-all duration-200 select-none relative group",
        getStatusColors(flight.status as FlightStatus),
        isDragging && "opacity-50 scale-95 rotate-1",
        className,
      )}
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button size="sm" variant="ghost" onClick={handleEdit} className="h-6 w-6 p-0 hover:bg-blue-600 text-white">
          <Edit className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDelete} className="h-6 w-6 p-0 hover:bg-red-600 text-white">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="font-mono text-sm text-white pr-16">
        <div className="flex justify-between items-center mb-1">
          <div className="font-bold text-base">{flight.callsign}</div>
          <div className="text-xs text-gray-300">{flight.status.toUpperCase()}</div>
        </div>        
        <div className="text-gray-200 mb-1">{flight.aircraft_type}</div>
        <div className="text-gray-200 mb-2">
          <span className="font-medium">{flight.departure}</span>
          <span className="mx-2 text-gray-400">→</span>
          <span className="font-medium">{flight.arrival}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-300 mb-2">
          <span>
            ALT: <span className="text-white">{flight.altitude}</span>
          </span>
          <span>
            SPD: <span className="text-white">{flight.speed}</span>
          </span>
        </div>
        {flight.notes && (
          <div className="text-xs text-yellow-300 bg-gray-800 bg-opacity-50 p-2 rounded mt-2">
            <div className="font-semibold mb-1">NOTES:</div>
            <div className="break-words">{flight.notes}</div>
          </div>
        )}
      </div>
    </div>
  )
}