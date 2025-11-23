"use client"

import type React from "react"
import { Edit, Trash2, Check } from "lucide-react"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"

import { type Flight } from "~/hooks/use-flights"

export type FlightStatus = "delivery" | "ground" | "tower" | "departure" | "approach" | "control";

interface FlightStripProps {
  flight: Flight
  onClick?: () => void
  onDragStart?: (flightId: string) => void
  className?: string
  isDragging?: boolean
  onEdit?: (flight: Flight) => void
  onDelete?: (flightId: string) => void
  isSelected: boolean
  onSelect: (flightId: string) => void
}

export function FlightStrip({
  flight,
  onClick,
  onDragStart,
  className,
  isDragging,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
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
  
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(flight.id);
  }

  return (
    <div
      className={cn(
        "p-3 rounded border cursor-pointer transition-all duration-200 select-none relative group",
        getStatusColors(flight.status as FlightStatus),
        isDragging && "opacity-50 scale-95 rotate-1",
        isSelected && "ring-2 ring-white",
        className,
      )}
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
    >
      <div
        className={cn(
          "absolute top-2 left-2 z-10 w-5 h-5 transition-all duration-300 flex items-center justify-center cursor-pointer",
          "before:content-[''] before:absolute before:h-[2px] before:w-3 before:bg-gray-400 before:transition-all before:duration-300",
          "hover:border hover:border-gray-400 hover:rounded-sm",
          isSelected ? "border-blue-600 bg-blue-600 rounded-sm" : ""
        )}
        onClick={handleSelect}
        role="checkbox"
        aria-checked={isSelected}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onSelect(flight.id);
          }
        }}
      >
        {isSelected && <Check className="h-4 w-4 text-white" />}
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button size="sm" variant="ghost" onClick={handleEdit} className="h-6 w-6 p-0 hover:bg-blue-600 text-white">
          <Edit className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDelete} className="h-6 w-6 p-0 hover:bg-red-600 text-white">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="font-mono text-sm text-white pr-16 pl-6 space-y-2">
        {/* Row 1: Callsign & Status */}
        <div className="flex justify-between items-center">
          <div className="font-bold text-base">{flight.callsign}</div>
          <div className="text-xs text-gray-300 font-semibold">{flight.status.toUpperCase()}</div>
        </div> 

        {/* Row 2: Pilot Details */}
        {(flight.geofs_callsign || flight.discord_username) && (
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            {flight.geofs_callsign && <span className="text-gray-300">GFS: {flight.geofs_callsign}</span>}
            {flight.geofs_callsign && flight.discord_username && <span className="text-gray-500">|</span>}
            {flight.discord_username && <span className="text-gray-300">DISCORD: {flight.discord_username}</span>}
          </div>
        )}

        {/* Row 3: Aircraft Type */}
        <div className="text-gray-200">{flight.aircraft_type}</div>

        {/* Row 4: Departure Time */}
        {flight.departure_time && (
          <div className="text-xs text-gray-300">
            <span className="font-semibold">ETD:</span> {flight.departure_time}
          </div>
        )}

        {/* Row 5: Altitude & Speed */}
        <div className="flex justify-between text-xs text-gray-300">
          <span>
            ALT: <span className="text-white">{flight.altitude}</span>
          </span>
          <span>
            SPD: <span className="text-white">{flight.speed}</span>
          </span>
        </div>

        {/* Route Section */}
        {flight.route && (
          <div className="text-xs text-blue-300 bg-gray-800 bg-opacity-50 p-2 rounded mt-2">
            <div className="font-semibold mb-1">ROUTE:</div>
            <div className="break-words">{flight.route}</div>
          </div>
        )}

        {/* Notes Section */}
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