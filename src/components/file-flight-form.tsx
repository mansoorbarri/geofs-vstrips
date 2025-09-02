// src/components/file-flight-form.tsx
"use client";

import { useFormStatus } from "react-dom";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

// Define the airport data here
const airports = [
  { id: "YSSY", name: "Sydney (YSSY)" },
  { id: "YMML", name: "Melbourne (YMML)" },
];

export function FileFlightForm() {
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formFields = useMemo(() => [
    { name: "callsign", label: "Callsign", placeholder: "e.g., DAL123", type: "text" },
    { name: "geofs_callsign", label: "GeoFS Callsign", placeholder: "e.g., Ayman", type: "text" },
    { name: "aircraft_type", label: "Aircraft Type", placeholder: "e.g., A320", type: "text" },
    { name: "departure", label: "Departure Airport", placeholder: "e.g., KLAX", type: "text" },
    { name: "arrival", label: "Arrival Airport", placeholder: "e.g., KJFK", type: "text" },
    { name: "altitude", label: "Altitude", placeholder: "e.g., 35000", type: "text" },
    { name: "speed", label: "Speed", placeholder: "e.g., 420", type: "text" },
    { name: "airport_atc", label: "Airport for ATC", placeholder: "e.g., KJFK", type: "select" },
  ], []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmissionResult(null);

    const formData = new FormData(event.currentTarget);
    const flightData = {
      airport: formData.get("airport_atc"),
      callsign: formData.get("callsign"),
      geofs_callsign: formData.get("geofs_callsign"),
      aircraft_type: formData.get("aircraft_type"),
      departure: formData.get("departure"),
      arrival: formData.get("arrival"),
      altitude: formData.get("altitude"),
      speed: formData.get("speed"),
      notes: formData.get("notes"),
      status: "delivery", // Default status
    };

    try {
      const response = await fetch('/api/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flightData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to file flight.');
      }

      setSubmissionResult({ success: true, message: "Thank you. Your flight is filed. See you at the event!" });
    } catch (error: any) {
      setSubmissionResult({ success: false, message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionResult?.success) {
    return (
      <div className="container mx-auto p-6 max-w-lg bg-gray-900 rounded-lg shadow-xl text-white text-center">
        <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
        <h1 className="text-3xl font-bold mb-4">Flight Filed!</h1>
        <p className="text-lg text-gray-300 mb-6">
          {submissionResult.message}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-lg bg-gray-900 rounded-lg shadow-xl text-white">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" passHref>
          <Button variant="outline" className="bg-black border-gray-700 text-gray-400 hover:bg-gray-800 hover:cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold flex-grow text-center">File a Flight Plan</h1>
        <div className="w-[100px]" />
      </div>
      
      {submissionResult?.success === false && (
        <Alert variant="destructive" className="bg-red-900 border-red-600 mb-4">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="text-red-200">
            {submissionResult.message}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {formFields.map(({ name, label, placeholder, type }) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            {type === "select" ? (
              <Select
                name={name}
              >
                <SelectTrigger className="w-full bg-gray-800 text-white border-gray-700">
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {airports.map((airport) => (
                    <SelectItem key={airport.id} value={airport.id}>
                      {airport.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={name}
                name={name}
                type="text"
                placeholder={placeholder}
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            )}
          </div>
        ))}
        
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Additional information"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-blue-600 text-white hover:bg-blue-700 hover:cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "File Flight Plan"}
        </Button>
      </form>
    </div>
  );
}