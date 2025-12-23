"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle, CheckCircle, Lock, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { redirect, useRouter } from "next/navigation";
import { z } from "zod";
import Footer from "~/components/footer";
import Header from "./header";
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

interface Flight {
  id: string;
  airport: string;
  callsign: string;
  geofs_callsign: string;
  aircraft_type: string;
  departure: string;
  departure_time: string;
  arrival: string;
  altitude: string;
  speed: string;
  status: string;
  route: string;
  discord_username: string;
}

interface EditFlightFormProps {
  flightId: string;
}

const CACHE_KEY = "flights_cache";
const CACHE_DURATION = 1 * 60 * 1000;

export function EditFlightForm({ flightId }: EditFlightFormProps) {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [selectedAirport, setSelectedAirport] = useState("");
  const [loading, setLoading] = useState(true);
  const [eventSettings, setEventSettings] = useState<any>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    message?: string;
    errors?: z.ZodIssue[];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCachedFlights = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) return data;
        localStorage.removeItem(CACHE_KEY);
      }
    } catch (e) {
      localStorage.removeItem(CACHE_KEY);
    }
    return null;
  };

  const setCachedFlights = (flightsData: Flight[]) => {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data: flightsData, timestamp: Date.now() }),
      );
    } catch (e) {}
  };

  const fetchFlight = useCallback(async () => {
    const cached = getCachedFlights();
    if (cached) {
      const foundFlight = cached.find((f: Flight) => f.id === flightId);
      if (foundFlight) {
        setFlight(foundFlight);
        setSelectedAirport(foundFlight.airport);
        setLoading(false);
        return;
      }
    }

    try {
      const [fRes, sRes] = await Promise.all([
        fetch("/api/flights/my"),
        fetch("/api/admin/settings"),
      ]);
      if (!fRes.ok || !sRes.ok) throw new Error("Failed to fetch data");
      
      const fData = await fRes.json();
      const sData = await sRes.json();
      
      const foundFlight = fData.flights?.find((f: Flight) => f.id === flightId);
      if (!foundFlight) throw new Error("Flight not found");

      setFlight(foundFlight);
      setSelectedAirport(foundFlight.airport);
      setEventSettings(sData);
      setCachedFlights(fData.flights);
    } catch (error: any) {
      setSubmissionResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  }, [flightId]);

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
      departure: (eventSettings?.departureMode === "FIXED" ? eventSettings.fixedDeparture : formData.get("departure")) as string,
      departure_time: (eventSettings?.timeMode === "FIXED" ? eventSettings.fixedTime : formData.get("departure_time")) as string,
      arrival: (eventSettings?.arrivalMode === "FIXED" ? eventSettings.fixedArrival : formData.get("arrival")) as string,
      altitude: formData.get("altitude") as string,
      speed: formData.get("speed") as string,
      route: (eventSettings?.routeMode === "FIXED" ? eventSettings.fixedRoute : formData.get("route")) as string,
    };

    const validation = flightSchema.safeParse(formValues);
    if (!validation.success) {
      setIsSubmitting(false);
      setSubmissionResult({ success: false, message: "Correct errors.", errors: validation.error.issues });
      return;
    }

    try {
      const response = await fetch(`/api/flights/${flightId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      if (!response.ok) throw new Error("Update failed");

      setSubmissionResult({ success: true, message: "Flight plan updated!" });
      localStorage.removeItem(CACHE_KEY);
      void fetchFlight();
    } catch (error: any) {
      setSubmissionResult({ success: false, message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) redirect("/sign-up");
      else void fetchFlight();
    }
  }, [isLoaded, isSignedIn, fetchFlight]);

  const renderField = (label: string, name: string, mode: string, fixedVal: string, defaultVal: string, placeholder: string) => {
    const isFixed = mode === "FIXED";
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input
          id={name}
          name={name}
          defaultValue={isFixed ? fixedVal : defaultVal}
          readOnly={isFixed}
          placeholder={placeholder}
          required
          className={`border-gray-700 bg-gray-800 text-white ${isFixed ? "opacity-60 cursor-not-allowed" : ""}`}
        />
      </div>
    );
  };

  if (!isLoaded || loading) return <Loading />;

  if (!flight) return (
    <div className="container mx-auto max-w-lg rounded-lg bg-gray-900 p-6 text-center text-white shadow-xl">
      <Header />
      <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
      <h1 className="mb-4 text-3xl font-bold">Flight Not Found</h1>
      <Button onClick={() => router.back()}>Go Back</Button>
    </div>
  );

  const isEditable = flight.status === "delivery";

  if (submissionResult?.success) return (
    <>
      <Header />
      <div className="container mx-auto mt-10 max-w-lg rounded-lg bg-gray-900 p-6 text-center text-white shadow-xl">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
        <h1 className="mb-4 text-3xl font-bold">Updated!</h1>
        <Button onClick={() => router.push("/edit-flight")}>View All</Button>
      </div>
    </>
  );

  if (!isEditable) return (
    <div className="container mx-auto max-w-lg rounded-lg bg-gray-900 p-6 text-center text-white shadow-xl">
      <Header />
      <Lock className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
      <h1 className="mb-4 font-bold">Locked</h1>
      <p>Status: {flight.status.toUpperCase()}</p>
      <Button onClick={() => router.back()}>Go Back</Button>
    </div>
  );

  const activeATCList = (eventSettings?.airportData || []).filter((ap: any) => 
    eventSettings?.activeAirports?.includes(ap.id)
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container mx-auto mt-10 max-w-lg rounded-lg bg-gray-900 p-6 text-white shadow-xl">
        <h1 className="text-3xl font-bold text-center">Edit Flight Plan</h1>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Callsign</Label>
              <Input name="callsign" defaultValue={flight.callsign} required className="bg-gray-800 text-white" />
            </div>
            <div className="space-y-2">
              <Label>GeoFS Callsign</Label>
              <Input name="geofs_callsign" defaultValue={flight.geofs_callsign} required className="bg-gray-800 text-white" />
            </div>
            <div className="space-y-2">
              <Label>Aircraft</Label>
              <Input name="aircraft_type" defaultValue={flight.aircraft_type} required className="bg-gray-800 text-white" />
            </div>
            {renderField("Time", "departure_time", eventSettings?.timeMode, eventSettings?.fixedTime, flight.departure_time, "1720")}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 border-t border-gray-700 pt-6">
            {renderField("Departure", "departure", eventSettings?.departureMode, eventSettings?.fixedDeparture, flight.departure, "KLAX")}
            {renderField("Arrival", "arrival", eventSettings?.arrivalMode, eventSettings?.fixedArrival, flight.arrival, "KJFK")}
            <div className="space-y-2">
              <Label>Altitude</Label>
              <Input name="altitude" defaultValue={flight.altitude} required className="bg-gray-800 text-white" />
            </div>
            <div className="space-y-2">
              <Label>Speed (Mach)</Label>
              <Input name="speed" defaultValue={flight.speed} required className="bg-gray-800 text-white" />
            </div>
          </div>
          <div className="space-y-4 border-t border-gray-700 pt-6">
            <div className="space-y-2">
              <Label>ATC Airport</Label>
              {eventSettings?.airportMode === "FIXED" ? (
                <Input value={`${eventSettings.fixedAirport}`} readOnly className="bg-gray-700 opacity-60" />
              ) : (
                <Select defaultValue={flight.airport} onValueChange={setSelectedAirport}>
                  <SelectTrigger className="bg-gray-800"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white">
                    {activeATCList.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name} ({a.id})</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Route</Label>
              {eventSettings?.routeMode === "FIXED" ? (
                <Textarea value={eventSettings.fixedRoute} readOnly className="bg-gray-700 opacity-60" />
              ) : (
                <Textarea name="route" defaultValue={flight.route} required className="bg-gray-800 text-white" />
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <Button type="submit" className="flex-1 bg-green-600">Update</Button>
            <Button type="button" onClick={() => router.back()} className="bg-gray-600">Cancel</Button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}