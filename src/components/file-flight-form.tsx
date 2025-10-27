"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { redirect } from "next/navigation";
import { z } from "zod";
import { airports } from "~/constants/airports";
import Link from "next/link";

const flightSchema = z.object({
  airport: z.string()
  .min(1, "Airport is required")
  .max(4, "Airport must be 4 characters or less")
  .regex(/^[A-Z]{4}$/, "Must be a 4-letter ICAO code (e.g., KLAX)"),
  callsign: z.string()
    .min(1, "Callsign is required")
    .max(7, "Callsign must be 7 characters or less"),  
  geofs_callsign: z.string()
    .min(1, "GeoFS Callsign is required")
    .max(24, "GeoFS Callsign must be 23 characters or less"),
  aircraft_type: z.string()
    .min(1, "Aircraft type is required")
    .max(6, "Aircraft type must be 6 characters or less")
    .regex(/^[A-Z]{1,4}[0-9]{1,4}$/, "Must be like A320 or B777"),
  departure: z.string()
    .min(1, "Departure is required")
    .max(4, "Departure must be 4 characters or less")
    .regex(/^[A-Z]{4}$/, "Must be a 4-letter ICAO code (e.g., KLAX)"),
  departure_time: z.string()
    .min(1, "Departure time is required")
    .max(4, "Departure time must be 4 characters or less")
    .regex(/^\d{4}$/, "Must be a 4-digit time (e.g., 1300)"),
  arrival: z.string()
    .min(1, "Arrival is required")
    .max(4, "Arrival must be 4 characters or less")
    .regex(/^[A-Z]{4}$/, "Must be a 4-letter ICAO code (e.g., KLAX)"),
  altitude: z.string()
    .min(1, "Altitude is required")
    .max(5, "Altitude must be 5 characters or less")
    .regex(/^FL\d{3}$/, "Must be a Flight Level (e.g., FL350)"),
  speed: z.string()
    .min(1, "Speed is required")
    .max(4, "Speed must be 4 characters or less")
    .regex(/^0\.\d{1,2}$/, "Must be in Mach (e.g., 0.82)"),
  notes: z.string()
    .min(1, "Flight Route is required")
    .max(2000, "Notes are too long"),
});

export function FileFlightForm() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [selectedAirport, setSelectedAirport] = useState("");
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    message?: string;
    errors?: z.ZodIssue[];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    redirect('/sign-up');
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmissionResult(null);

    const formData = new FormData(event.currentTarget);
    const formValues = {
      // airport: selectedAirport,
      airport: "EDDF",
      callsign: formData.get("callsign") as string,
      geofs_callsign: formData.get("geofs_callsign") as string,
      aircraft_type: formData.get("aircraft_type") as string,
      departure: formData.get("departure") as string,
      // departure: "VECC",
      departure_time: formData.get("departure_time") as string,
      // departure_time: "2200",
      arrival: formData.get("arrival") as string,
      // arrival: "VOMM",
      altitude: formData.get("altitude") as string,
      speed: formData.get("speed") as string,
      notes: formData.get("notes") as string,
      // notes: "VECC TARUK LEGOS KAKID PALKO LEMEX SADGU KAGUL POTAS NODAX KASRO GURAS RUPKU WISAT MM503 MM513 VOMM",
    };

    const validation = flightSchema.safeParse(formValues);
    if (!validation.success) {
      setIsSubmitting(false);
      setSubmissionResult({
        success: false,
        message: "Please correct the errors in the form.",
        errors: validation.error.issues,
      });
      return;
    }

    const flightData = {
      ...validation.data,
      discord_username: user.username,
      status: "delivery",
    };

    try {
      const response = await fetch('/api/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flightData),
      });
      
      console.log(flightData);
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
        <h1 className="3xl font-bold mb-4">Flight Filed!</h1>
        <p className="text-lg text-gray-300 mb-6">
          {submissionResult.message}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-lg bg-gray-900 rounded-lg shadow-xl text-white">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-3xl font-bold">File a Flight Plan</h1>
      </div>

      {submissionResult?.success === false && (
        <Alert variant="destructive" className="bg-red-900 border-red-600 mb-4">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="text-red-200">
            {submissionResult.message}
            {submissionResult.errors && (
              <ul className="list-disc list-inside mt-2 space-y-1">
                {submissionResult.errors.map((err, index) => (
                  <li key={index}>{err.path.join('.')}: {err.message}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* === Section 1: Pilot & Aircraft Info === */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="callsign">Callsign</Label>
              <Input
                id="callsign"
                name="callsign"
                type="text"
                placeholder="e.g., DAL123"
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="geofs_callsign">GeoFS Callsign</Label>
              <Input
                id="geofs_callsign"
                name="geofs_callsign"
                type="text"
                placeholder="e.g., Ayman"
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aircraft_type">Aircraft</Label>
              <Input
                id="aircraft_type"
                name="aircraft_type"
                type="text"
                placeholder="e.g., A320"
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departure_time">Departure Time</Label>
              <Input
                id="departure_time"
                name="departure_time"
                type="text"
                placeholder="e.g., 1300"
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
        </div>
        
        <div className="border-b border-gray-700"></div>

        {/* === Section 2: Route & Performance === */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure">Departure Airport</Label>
              <Input
                id="departure"
                name="departure"
                type="text"
                placeholder="e.g., KLAX"
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrival">Arrival Airport</Label>
              <Input
                id="arrival"
                name="arrival"
                type="text"
                placeholder="e.g., KJFK"
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="altitude">Cruise Altitude</Label>
              <Input
                id="altitude"
                name="altitude"
                type="text"
                placeholder="e.g., FL350"
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="speed">{"Cruise Speed (mach)"}</Label>
              <Input
                id="speed"
                name="speed"
                type="text"
                placeholder="e.g., 0.82"
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
        </div>
        
        <div className="border-b border-gray-700"></div>

        {/* === Section 3: Operational & Route Notes === */}
        <div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="airport_atc">Where do you want ATC?</Label>
              <Select name="airport_atc" onValueChange={setSelectedAirport} value={`EDDF`} disabled>
                <SelectTrigger className="w-full bg-gray-800 text-white border-gray-700">
                  <SelectValue placeholder="Select an airport" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {/* {airports.map((airport) => (
                    <SelectItem key={airport.id} value={airport.id}>
                      {airport.name} ({airport.id})
                    </SelectItem>
                  ))} */}
                  <SelectItem value="EDDF">
                    {`Frankfurt Main Airport (EDDF)`}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Flight Route</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="e.g., DCT VOR VOR STAR"
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
        </div>
        
          <Button
            type="submit"
            className="w-full bg-blue-600 text-white hover:bg-blue-700 hover:cursor-pointer shine-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "File Flight Plan"}
          </Button>
          <Link href="/edit-flight">
            <Button
              type="button"
              className="w-full bg-grey-900 text-white border-1 border-white hover:bg-white hover:text-black hover:cursor-pointer"
            >
              Edit a Flight Plan
            </Button>
          </Link>
      </form>
    </div>
  );
}