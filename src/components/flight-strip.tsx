"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Edit, Trash2, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { toast } from "sonner";
import { type LegacyFlight as Flight } from "~/hooks/use-flights";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export type FlightStatus =
  | "delivery"
  | "ground"
  | "tower"
  | "departure"
  | "approach"
  | "control";

interface FlightStripProps {
  flight: Flight;
  onClick?: () => void;
  onDragStart?: (flightId: string) => void;
  className?: string;
  isDragging?: boolean;
  onEdit?: (flight: Flight) => void;
  onDelete?: (flightId: string) => void;
  isSelected: boolean;
  onSelect: (flightId: string) => void;
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
  const [isEditingSquawk, setIsEditingSquawk] = useState(false);
  const [squawkValue, setSquawkValue] = useState(flight.squawk || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const updateFlightMutation = useMutation(api.flights.update);

  useEffect(() => {
    setSquawkValue(flight.squawk || "");
  }, [flight.squawk]);

  useEffect(() => {
    if (isEditingSquawk && inputRef.current) inputRef.current.focus();
  }, [isEditingSquawk]);

  const getStatusColors = (status: FlightStatus) => {
    switch (status) {
      case "delivery":
        return "bg-gray-800 border-gray-600 hover:bg-gray-700";
      case "ground":
        return "bg-blue-900 border-blue-600 hover:bg-blue-800";
      case "tower":
        return "bg-green-900 border-green-600 hover:bg-green-800";
      case "departure":
        return "bg-purple-900 border-purple-600 hover:bg-purple-800";
      case "approach":
        return "bg-indigo-900 border-indigo-600 hover:bg-indigo-800";
      case "control":
        return "bg-red-900 border-red-600 hover:bg-red-800";
      default:
        return "bg-gray-800 border-gray-600 hover:bg-gray-700";
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", flight.id);
    e.dataTransfer.effectAllowed = "move";
    onDragStart?.(flight.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(flight);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(flight.id);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(flight.id);
  };

  useEffect(() => {
    if (isEditingSquawk && inputRef.current) inputRef.current.focus();
  }, [isEditingSquawk]);

  const handleSquawkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingSquawk(true);
  };

  const handleSquawkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = e.target.value.replace(/\D/g, "").slice(0, 4);
    setSquawkValue(numeric);
  };

  const handleSquawkBlur = async () => {
    setIsEditingSquawk(false);
    if (squawkValue !== (flight.squawk || "")) {
      try {
        await updateFlightMutation({
          id: flight.id as Id<"flights">,
          squawk: squawkValue,
        });
        toast.success(`Squawk updated to ${squawkValue}`);
      } catch (err: any) {
        console.error("Error updating squawk:", err);
        setSquawkValue(flight.squawk || "");
        toast.error("Failed to update squawk");
      }
    }
  };

  const handleSquawkKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") inputRef.current?.blur();
  };

  return (
    <div
      className={cn(
        "group relative cursor-pointer rounded border p-3 transition-all duration-200 select-none",
        getStatusColors(flight.status as FlightStatus),
        isDragging && "scale-95 rotate-1 opacity-50",
        isSelected && "ring-2 ring-white",
        className,
      )}
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
    >
      <div
        className={cn(
          "absolute top-2 left-2 z-10 flex h-5 w-5 cursor-pointer items-center justify-center transition-all duration-300",
          "hover:rounded-sm hover:border hover:border-gray-400",
          isSelected ? "rounded-sm border-blue-600 bg-blue-600" : "",
        )}
        onClick={handleSelect}
        role="checkbox"
        aria-checked={isSelected}
      >
        {isSelected && <Check className="h-4 w-4 text-white" />}
      </div>

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEdit}
          className="h-6 w-6 p-0 text-white hover:bg-blue-600"
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          className="h-6 w-6 p-0 text-white hover:bg-red-600"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="space-y-2 pr-16 pl-6 font-mono text-sm text-white">
        <div className="flex items-center justify-between">
          <div className="text-base font-bold">{flight.callsign}</div>
          <div className="text-xs font-semibold text-gray-300">
            {flight.status.toUpperCase()}
          </div>
        </div>

        {(flight.geofs_callsign || flight.discord_username) && (
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            {flight.geofs_callsign && (
              <span className="text-gray-300">
                GFS: {flight.geofs_callsign}
              </span>
            )}
            {flight.geofs_callsign && flight.discord_username && (
              <span className="text-gray-500">|</span>
            )}
            {flight.discord_username && (
              <span className="text-gray-300">
                DISCORD: {flight.discord_username}
              </span>
            )}
          </div>
        )}

        <div className="text-gray-200">{flight.aircraft_type}</div>

        <div className="flex justify-between text-xs text-gray-300">
          {flight.departure_time && (
            <span>
              ETD: <span className="text-white">{flight.departure_time}</span>
            </span>
          )}
          <span>
            SQK:{" "}
            {isEditingSquawk ? (
              <input
                ref={inputRef}
                type="text"
                value={squawkValue}
                onChange={handleSquawkChange}
                onBlur={handleSquawkBlur}
                onKeyDown={handleSquawkKeyDown}
                maxLength={4}
                onClick={(e) => e.stopPropagation()}
                className="w-14 rounded border border-gray-600 bg-gray-700 px-1 py-0.5 text-xs text-white outline-none focus:border-blue-500"
              />
            ) : (
              <span
                onClick={handleSquawkClick}
                className="cursor-pointer rounded px-1 py-0.5 text-white hover:bg-gray-700"
              >
                {flight.squawk || "----"}
              </span>
            )}
          </span>
        </div>

        <div className="flex justify-between text-xs text-gray-300">
          <span>
            ALT: <span className="text-white">{flight.altitude}</span>
          </span>
          <span>
            SPD: <span className="text-white">{flight.speed}</span>
          </span>
        </div>

        {flight.route && (
          <div className="bg-opacity-50 mt-2 rounded bg-gray-800 p-2 text-xs text-blue-300">
            <div className="mb-1 font-semibold">ROUTE:</div>
            <div className="break-words">{flight.route}</div>
          </div>
        )}

        {flight.notes && (
          <div className="bg-opacity-50 mt-2 rounded bg-gray-800 p-2 text-xs text-yellow-300">
            <div className="mb-1 font-semibold">NOTES:</div>
            <div className="break-words">{flight.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}
