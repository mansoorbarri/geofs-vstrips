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
import { airports } from "~/constants/airports";
import Footer from "~/components/footer";
import Header from "./header";

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
  // .refine((v) => Number(v.slice(0, 2)) >= 16 && Number(v.slice(0, 2)) <= 19, {
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
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
        localStorage.removeItem(CACHE_KEY);
      }
    } catch (error) {
      localStorage.removeItem(CACHE_KEY);
    }
    return null;
  };

  const setCachedFlights = (flightsData: Flight[]) => {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: flightsData,
          timestamp: Date.now(),
        }),
      );
    } catch (error) {
      console.error("Failed to cache flights:", error);
    }
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
      const response = await fetch("/api/flights/my");
      if (!response.ok) {
        throw new Error("Failed to fetch flights");
      }
      const data = await response.json();

      const foundFlight = data.flights?.find((f: Flight) => f.id === flightId);
      if (!foundFlight) {
        throw new Error(
          "Flight not found or you do not have permission to edit this flight",
        );
      }

      setFlight(foundFlight);
      setSelectedAirport(foundFlight.airport);
      setCachedFlights(data.flights);
    } catch (error: any) {
      setSubmissionResult({
        success: false,
        message: error.message || "Failed to load flight plan",
      });
    } finally {
      setLoading(false);
    }
  }, [
    flightId,
    setLoading,
    setFlight,
    setSelectedAirport,
    setSubmissionResult,
  ]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmissionResult(null);

    const formData = new FormData(event.currentTarget);
    const formValues = {
      // airport: selectedAirport,
      airport: "VGHS",
      callsign: formData.get("callsign") as string,
      geofs_callsign: formData.get("geofs_callsign") as string,
      aircraft_type: formData.get("aircraft_type") as string,
      // departure: formData.get("departure") as string,
      departure: "VGHS",
      // departure_time: formData.get("departure_time") as string,
      departure_time: "2300",
      // arrival: formData.get("arrival") as string,
      arrival: "VQPR",
      altitude: formData.get("altitude") as string,
      speed: formData.get("speed") as string,
      // route: formData.get("route") as string,
      route: "TEGAK2 TEGAK W3 SDP BOGOP BOGO1B",
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

    try {
      const response = await fetch(`/api/flights/${flightId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update flight plan.");
      }

      setSubmissionResult({
        success: true,
        message: "Flight plan updated successfully!",
      });

      localStorage.removeItem(CACHE_KEY);
      await fetchFlight();
    } catch (error: any) {
      setSubmissionResult({ success: false, message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      redirect("/sign-up");
      return;
    }

    void fetchFlight();
  }, [isLoaded, isSignedIn, fetchFlight]);

  if (!isLoaded || loading) {
    return (
      <div className="container mx-auto max-w-lg rounded-lg bg-gray-900 p-6 text-center text-white shadow-xl">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
        <p className="mt-4">Loading flight plan...</p>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="container mx-auto max-w-lg rounded-lg bg-gray-900 p-6 text-center text-white shadow-xl">
        <Header />
        <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
        <h1 className="mb-4 text-3xl font-bold">Flight Not Found</h1>
        <p className="mb-6 text-lg text-gray-300">
          The requested flight plan could not be found.
        </p>
        <Button
          onClick={() => router.back()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const isEditable = flight.status === "delivery";

  if (submissionResult?.success) {
    return (
      <>
        <Header />
        <div className="container mx-auto mt-10 max-w-lg rounded-lg bg-gray-900 p-6 text-center text-white shadow-xl">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="mb-4 text-3xl font-bold">Flight Plan Updated!</h1>
          <p className="mb-6 text-lg text-gray-300">
            {submissionResult.message}
          </p>
          <Button
            onClick={() => router.push("/file-flight")}
            className="mr-4 bg-blue-600 text-white hover:cursor-pointer hover:bg-blue-700"
          >
            File Another
          </Button>
          <Button
            onClick={() => router.push("/edit-flight")}
            className="bg-gray-600 text-white hover:cursor-pointer hover:bg-gray-700"
          >
            View All Flights
          </Button>
        </div>
      </>
    );
  }

  if (!isEditable) {
    return (
      <div className="container mx-auto max-w-lg rounded-lg bg-gray-900 p-6 text-center text-white shadow-xl">
        <Header />
        <Lock className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
        <h1 className="mb-4 text-3xl font-bold">Flight Plan Locked</h1>
        <p className="mb-2 text-lg text-gray-300">
          This flight plan cannot be edited because its status is:
        </p>
        <span className="mb-6 inline-block rounded-full bg-gray-800 px-3 py-1 text-sm font-semibold text-yellow-400">
          {flight.status.toUpperCase()}
        </span>
        <p className="mb-6 text-sm text-gray-400">
          {`Flight plans can only be edited when the status is "DELIVERY"`}.
        </p>
        <Button
          onClick={() => router.back()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container mx-auto mt-10 max-w-lg rounded-lg bg-gray-900 p-6 text-white shadow-xl">
        <div className="mb-6 flex flex-col items-center">
          <h1 className="text-3xl font-bold">Edit Flight Plan</h1>
          <p className="mt-2 text-gray-400">Callsign: {flight.callsign}</p>
        </div>

        {submissionResult?.success === false && (
          <Alert
            variant="destructive"
            className="mb-4 border-red-600 bg-red-900"
          >
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
          <div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="callsign">Callsign</Label>
                <Input
                  id="callsign"
                  name="callsign"
                  type="text"
                  defaultValue={flight.callsign}
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
                  defaultValue={flight.geofs_callsign}
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
                  defaultValue={flight.aircraft_type}
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
                  {/* <div
                  className="group relative inline-block"
                  // title="The time you will be using the airspace — whether departing, arriving, or crossing the airfield."
                >
                  <Info className="h-3.5 w-3.5 text-blue-400 cursor-help" />
                  <span className="absolute hidden group-hover:block bg-gray-700 text-white text-xs rounded p-2 -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                    The time you will enter the airspace — whether departing, arriving, or overflying the field.
                </span>
                </div> */}
                </Label>
                <Input
                  id="departure_time"
                  name="departure_time"
                  type="text"
                  defaultValue={flight.departure_time}
                  placeholder="e.g., 1720"
                  disabled
                  required
                  className="border-gray-700 bg-gray-800 font-mono text-white"
                />
              </div>
            </div>
          </div>

          <div className="border-b border-gray-700"></div>

          <div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="departure">Departure Airport</Label>
                <Input
                  id="departure"
                  name="departure"
                  type="text"
                  defaultValue={flight.departure}
                  placeholder="e.g., KLAX"
                  disabled
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
                  defaultValue={flight.arrival}
                  placeholder="e.g., KJFK"
                  disabled
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
                  defaultValue={flight.altitude}
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
                  defaultValue={flight.speed}
                  placeholder="e.g., 0.82"
                  required
                  className="border-gray-700 bg-gray-800 text-white"
                />
              </div>
            </div>
          </div>

          <div className="border-b border-gray-700"></div>

          <div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="airport_atc">Where do you want ATC?</Label>
                <Select
                  name="airport_atc"
                  onValueChange={setSelectedAirport}
                  value={`MGGT`}
                  disabled
                >
                  <SelectTrigger className="w-full border-gray-700 bg-gray-800 text-white">
                    <SelectValue placeholder="Select an airport" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800 text-white">
                    <SelectItem value="MGGT">
                      {`La Aurora International Airport (MGGT)`}
                    </SelectItem>
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
                  defaultValue={flight.route}
                  placeholder="e.g., DCT VOR VOR STAR"
                  value={flight.route}
                  disabled
                  required
                  className="border-gray-700 bg-gray-800 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              className="shine-button flex-1 bg-green-600 text-white hover:cursor-pointer hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Flight Plan"}
            </Button>
            <Button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-600 text-white hover:cursor-pointer hover:bg-gray-700"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
