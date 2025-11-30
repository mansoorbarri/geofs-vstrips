"use client";

import type React from "react";

import { useState } from "react";
import { cn } from "~/lib/utils";

interface DropZoneProps {
  onDrop: (flightId: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function DropZone({ onDrop, children, className }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const flightId = e.dataTransfer.getData("text/plain");
    if (flightId) {
      onDrop(flightId);
    }
    setIsDragOver(false);
  };

  return (
    <div
      className={cn(
        "transition-all duration-200",
        isDragOver &&
          "rounded-lg border-2 border-dashed border-white/30 bg-gray-800/50",
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
}
