"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
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
  airport: z
    .string()
    .min(1, "Airport is required")
    .max(4, "Airport must be 4 characters or less")
    .regex(/^[A-Z]{4}$/, "Must be a 4-letter ICAO code (e.g., KLAX)"),
  callsign: z
    .string()
    .min(1, "Callsign is required")
    .max(7, "Callsign must be 7 characters or less"),
  geofs_callsign: z
    .string()
    .min(1, "GeoFS Callsign is required")
    .max(24, "GeoFS Callsign must be 23 characters or less"),
  aircraft_type: z
    .string()
    .min(1, "Aircraft type is required")
    .max(6, "Aircraft type must be 6 characters or less")
    .regex(/^[A-Z]{1,4}[0-9]{1,4}$/, "Must be like A320 or B777"),
  departure: z
    .string()
    .min(1, "Departure is required")
    .max(4, "Departure must be 4 characters or less")
    .regex(/^[A-Z]{4}$/, "Must be a 4-letter ICAO code (e.g., KLAX)"),
  departure_time: z
    .string()
    .min(1, "Departure time is required")
    .max(4, "Departure time must be 4 characters or less")
    .regex(/^\d{4}$/, "Must be a 4-digit time (e.g., 1720)"),
  // .refine((v) => {
  //   const hh = Number(v.slice(0, 2));
  //   const mm = Number(v.slice(2, 4));
  //   return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
  // }, { message: "Invalid time – minutes must be 00-59" })
  // .refine((v) => Number(v.slice(0, 2)) >= 1530 && Number(v.slice(0, 2)) <= 1830, {
  //   message: "Departure time must be between 1600 and 1900 (4 PM – 7 PM)",
  // }),
  arrival: z
    .string()
    .min(1, "Arrival is required")
    .max(4, "Arrival must be 4 characters or less")
    .regex(/^[A-Z]{4}$/, "Must be a 4-letter ICAO code (e.g., KLAX)"),
  altitude: z
    .string()
    .min(1, "Altitude is required")
    .max(5, "Altitude must be 5 characters or less")
    .regex(/^FL\d{3}$/, "Must be a Flight Level (e.g., FL350)"),
  speed: z
    .string()
    .min(1, "Speed is required")
    .max(4, "Speed must be 4 characters or less")
    .regex(/^0\.\d{1,2}$/, "Must be in Mach (e.g., 0.82)"),
  route: z
    .string()
    .min(1, "Flight Route is required")
    .max(2000, "route are too long"),
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
    redirect("/sign-up");
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmissionResult(null);

    const formData = new FormData(event.currentTarget);
    const formValues = {
      airport: selectedAirport,
      // airport: "VGHS",
      callsign: formData.get("callsign") as string,
      geofs_callsign: formData.get("geofs_callsign") as string,
      aircraft_type: formData.get("aircraft_type") as string,
      departure: formData.get("departure") as string,
      // departure: "VGHS",
      departure_time: formData.get("departure_time") as string,
      // departure_time: "2300",
      arrival: formData.get("arrival") as string,
      // arrival: "VQPR",
      altitude: formData.get("altitude") as string,
      speed: formData.get("speed") as string,
      route: formData.get("route") as string,
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
      discord_username: user.externalAccounts[0]?.username,
      status: "delivery",
    };

    try {
      const response = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flightData),
      });

      console.log(flightData);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to file flight.");
      }

      setSubmissionResult({
        success: true,
        message: "Thank you. Your flight is filed. See you at the event!",
      });
    } catch (error: any) {
      setSubmissionResult({ success: false, message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionResult?.success) {
    return (
      <div className="container mx-auto max-w-lg rounded-lg bg-gray-900 p-6 text-center text-white shadow-xl">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
        <h1 className="3xl mb-4 font-bold">Flight Filed!</h1>
        <p className="mb-6 text-lg text-gray-300">{submissionResult.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg rounded-lg bg-gray-900 p-6 text-white shadow-xl">
      <div className="mb-6 flex flex-col items-center">
        <h1 className="text-3xl font-bold">File a Flight Plan</h1>
      </div>

      {submissionResult?.success === false && (
        <Alert variant="destructive" className="mb-4 border-red-600 bg-red-900">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="text-red-200">
            {submissionResult.message}
            {submissionResult.errors && (
              <ul className="mt-2 list-inside list-disc space-y-1">
                {submissionResult.errors.map((err, index) => (
                  <li key={index}>
                    {err.path.join(".")}: {err.message}
                  </li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* === Section 1: Pilot & Aircraft Info === */}
        <div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="callsign">Callsign</Label>
              <Input
                id="callsign"
                name="callsign"
                type="text"
                placeholder="e.g., DAL123"
                required
                className="border-gray-700 bg-gray-800 text-white"
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
                className="border-gray-700 bg-gray-800 text-white"
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
                className="border-gray-700 bg-gray-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="departure_time"
                className="flex items-center gap-1"
              >
                Time
                <div
                  className="group relative inline-block"
                  title="The time you will be using the airspace — whether departing, arriving, or crossing the airfield."
                >
                  <Info className="h-3.5 w-3.5 text-blue-400 cursor-help" />
                  <span className="absolute hidden group-hover:block bg-gray-700 text-white text-xs rounded p-2 -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                    The time you will enter the airspace — whether departing, arriving, or overflying the field.
                </span>
                </div>
              </Label>
              <Input
                id="departure_time"
                name="departure_time"
                type="text"
                placeholder="e.g., 1720"
                required
                className="border-gray-700 bg-gray-800 font-mono text-white"
              />
            </div>
          </div>
        </div>

        <div className="border-b border-gray-700"></div>

        {/* === Section 2: Route & Performance === */}
        <div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="departure">Departure Airport</Label>
              <Input
                id="departure"
                name="departure"
                type="text"
                placeholder="e.g., KLAX"
                required
                className="border-gray-700 bg-gray-800 text-white"
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
                className="border-gray-700 bg-gray-800 text-white"
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
                className="border-gray-700 bg-gray-800 text-white"
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
                className="border-gray-700 bg-gray-800 text-white"
              />
            </div>
          </div>
        </div>

        <div className="border-b border-gray-700"></div>

        {/* === Section 3: Operational & Route route === */}
        <div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="airport_atc">Where do you want ATC?</Label>
              <Select
                name="airport_atc"
                onValueChange={setSelectedAirport}
              >
                <SelectTrigger className="w-full border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Select an airport" />
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-800 text-white">
                  {airports.map((airport) => (
                    <SelectItem key={airport.id} value={airport.id}>
                      {airport.name} ({airport.id})
                    </SelectItem>
                  ))}
                  {/* <SelectItem value="VGHS">
                    {`Hazrat Shahjalal International Airport (VGHS)`}
                  </SelectItem> */}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="route">
                Flight Route
                <div
                  className="group relative inline-block"
                  // title="The time you will be using the airspace — whether departing, arriving, or crossing the airfield."
                >
                  <Info className="h-3.5 w-3.5 cursor-help text-blue-400" />
                  <span className="absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 rounded bg-gray-700 p-2 text-xs whitespace-nowrap text-white group-hover:block">
                    Must include a SID or STAR from approved SID/STARs
                  </span>
                </div>
              </Label>
              <Textarea
                id="route"
                name="route"
                placeholder="e.g., DCT VOR VOR STAR"
                required
                className="border-gray-700 bg-gray-800 text-white"
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="shine-button w-full bg-blue-600 text-white hover:cursor-pointer hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "File Flight Plan"}
        </Button>
        <Link href="/edit-flight">
          <Button
            type="button"
            className="bg-grey-900 w-full border-1 border-white text-white hover:cursor-pointer hover:bg-white hover:text-black"
          >
            Edit a Flight Plan
          </Button>
        </Link>
      </form>
    </div>
  );
}
