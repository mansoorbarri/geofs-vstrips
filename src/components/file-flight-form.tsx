"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useState, useEffect } from "react";
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
import Link from "next/link";
import Loading from "~/components/loading";

const flightSchema = z.object({
  airport: z
    .string()
    .min(1, "Airport is required")
    .max(4, "Airport must be 4 characters or less"),
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
    .max(4, "Departure must be 4 characters or less"),
  departure_time: z
    .string()
    .min(1, "Departure time is required")
    .max(4, "Departure time must be 4 characters or less"),
  arrival: z
    .string()
    .min(1, "Arrival is required")
    .max(4, "Arrival must be 4 characters or less"),
  altitude: z
    .string()
    .min(1, "Altitude is required")
    .max(5, "Altitude must be 5 characters or less")
    .regex(/^FL\d{3}$/, "Must be a Flight Level (e.g., FL350)"),
  speed: z
    .string()
    .min(1, "Speed is required")
    .max(4, "Speed must be 4 characters or less"),
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
  const [eventSettings, setEventSettings] = useState<any>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setEventSettings(data);
        setIsLoadingSettings(false);
      })
      .catch(() => setIsLoadingSettings(false));
  }, []);

  if (!isLoaded || isLoadingSettings) return <Loading />;
  if (!isSignedIn) redirect("/sign-up");

  if (eventSettings && !eventSettings.isEventLive) {
    return (
      <div className="container mx-auto max-w-lg rounded-lg bg-gray-900 p-10 text-center text-white shadow-xl">
        <Info className="mx-auto mb-4 h-16 w-16 text-blue-500" />
        <h1 className="text-2xl font-bold">No Active Event</h1>
        <p className="mt-4 text-gray-400">There are no events currently live. Please check back later!</p>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmissionResult(null);

    const formData = new FormData(event.currentTarget);
    const finalAirport = eventSettings?.airportMode === "FIXED" 
        ? eventSettings.fixedAirport 
        : selectedAirport;

    const formValues = {
      airport: finalAirport,
      callsign: formData.get("callsign") as string,
      geofs_callsign: formData.get("geofs_callsign") as string,
      aircraft_type: formData.get("aircraft_type") as string,
      departure: (formData.get("departure") as string || "").toUpperCase(),
      departure_time: formData.get("departure_time") as string,
      arrival: (formData.get("arrival") as string || "").toUpperCase(),
      altitude: formData.get("altitude") as string,
      speed: formData.get("speed") as string,
      route: (eventSettings?.routeMode === "FIXED" ? eventSettings.fixedRoute : formData.get("route")) as string,
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
      notes: ""
    };

    try {
      const response = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flightData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to file flight.");

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

  const renderField = (label: string, name: string, mode: string, fixedVal: string, placeholder: string) => {
    const isFixed = mode === "FIXED";
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input
          id={name}
          name={name}
          defaultValue={isFixed ? fixedVal : ""}
          readOnly={isFixed}
          placeholder={placeholder}
          required
          className={`border-gray-700 bg-gray-800 text-white ${isFixed ? "opacity-60 cursor-not-allowed" : ""}`}
        />
      </div>
    );
  };

  const activeATCList = (eventSettings?.airportData || []).filter((ap: any) => 
    eventSettings?.activeAirports?.includes(ap.id)
  );

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
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="callsign">Callsign</Label>
            <Input id="callsign" name="callsign" placeholder="e.g., DAL123" required className="border-gray-700 bg-gray-800 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="geofs_callsign">GeoFS Callsign</Label>
            <Input id="geofs_callsign" name="geofs_callsign" placeholder="e.g., Ayman" required className="border-gray-700 bg-gray-800 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aircraft_type">Aircraft</Label>
            <Input id="aircraft_type" name="aircraft_type" placeholder="e.g., A320" required className="border-gray-700 bg-gray-800 text-white" />
          </div>
          {renderField("Time", "departure_time", eventSettings?.timeMode, eventSettings?.fixedTime, "e.g. 1720")}
        </div>

        <div className="border-b border-gray-700"></div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {renderField("Departure Airport", "departure", eventSettings?.departureMode, eventSettings?.fixedDeparture, "e.g. KLAX")}
          {renderField("Arrival Airport", "arrival", eventSettings?.arrivalMode, eventSettings?.fixedArrival, "e.g. KJFK")}
          <div className="space-y-2">
            <Label htmlFor="altitude">Cruise Altitude</Label>
            <Input id="altitude" name="altitude" placeholder="e.g., FL350" required className="border-gray-700 bg-gray-800 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="speed">Mach Speed</Label>
            <Input id="speed" name="speed" placeholder="e.g., 0.82" required className="border-gray-700 bg-gray-800 text-white" />
          </div>
        </div>

        <div className="border-b border-gray-700"></div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="airport">Where do you want ATC?</Label>
            {eventSettings?.airportMode === "FIXED" ? (
              <div className="space-y-2">
                <Input
                  value={`${eventSettings.airportData.find((a: any) => a.id === eventSettings.fixedAirport)?.name || eventSettings.fixedAirport} (${eventSettings.fixedAirport})`}
                  readOnly
                  className="border-gray-700 bg-gray-700 text-white opacity-60 cursor-not-allowed"
                />
              </div>
            ) : (
              <Select onValueChange={setSelectedAirport} required>
                <SelectTrigger className="w-full border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Select an airport" />
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-800 text-white">
                  {activeATCList.map((airport: any) => (
                    <SelectItem key={airport.id} value={airport.id}>
                      {airport.name} ({airport.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="route">Flight Route</Label>
            {eventSettings?.routeMode === "FIXED" ? (
              <Textarea 
                id="route" 
                name="route" 
                value={eventSettings.fixedRoute} 
                readOnly 
                className="border-gray-700 bg-gray-700 text-white opacity-60" 
              />
            ) : (
              <Textarea id="route" name="route" placeholder="e.g., DCT VOR VOR STAR" required className="border-gray-700 bg-gray-800 text-white" />
            )}
          </div>
        </div>

        <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "File Flight Plan"}
        </Button>
      </form>
    </div>
  );
}