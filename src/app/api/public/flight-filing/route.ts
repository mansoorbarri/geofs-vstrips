import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";
import { api } from "../../../../../convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const integrationSecret = process.env.VSTRIPS_INTEGRATION_SECRET;

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
  discord_username: z.string().min(1, "Discord username is required"),
});

function getConvex() {
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(convexUrl);
}

function applyFixedEventFields(
  input: z.input<typeof flightSchema>,
  settings: Awaited<ReturnType<ConvexHttpClient["query"]>>,
) {
  const eventSettings = settings as {
    airportMode?: string;
    fixedAirport?: string;
    departureMode?: string;
    fixedDeparture?: string;
    arrivalMode?: string;
    fixedArrival?: string;
    timeMode?: string;
    fixedTime?: string;
    altitudeMode?: string;
    fixedAltitude?: string;
    speedMode?: string;
    fixedSpeed?: string;
    routeMode?: string;
    fixedRoute?: string;
    filingMode?: string;
  };

  return {
    ...input,
    airport:
      eventSettings.airportMode === "FIXED"
        ? eventSettings.fixedAirport || ""
        : input.airport,
    departure:
      eventSettings.departureMode === "FIXED"
        ? eventSettings.fixedDeparture || ""
        : input.departure,
    departure_time:
      eventSettings.filingMode !== "CONTROLLED" &&
      eventSettings.timeMode === "FIXED"
        ? eventSettings.fixedTime || ""
        : input.departure_time,
    arrival:
      eventSettings.arrivalMode === "FIXED"
        ? eventSettings.fixedArrival || ""
        : input.arrival,
    altitude:
      eventSettings.altitudeMode === "FIXED"
        ? eventSettings.fixedAltitude || ""
        : input.altitude,
    speed:
      eventSettings.speedMode === "FIXED"
        ? eventSettings.fixedSpeed || ""
        : input.speed,
    route:
      eventSettings.routeMode === "FIXED"
        ? eventSettings.fixedRoute || ""
        : input.route,
  };
}

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  });
}

function isAuthorized(req: NextRequest) {
  if (!integrationSecret) return true;
  return req.headers.get("x-vstrips-integration-secret") === integrationSecret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const convex = getConvex();
    const settings = await convex.query(api.eventSettings.get, {});
    return json({ settings });
  } catch (error) {
    console.error("Failed to load public flight filing settings:", error);
    return json({ error: "Unable to load event settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const convex = getConvex();
    const settings = await convex.query(api.eventSettings.get, {});

    if (!(settings as { isEventLive?: boolean }).isEventLive) {
      return json(
        { error: "There is no active event right now." },
        { status: 409 },
      );
    }

    const body = (await req.json()) as z.input<typeof flightSchema>;
    const values = applyFixedEventFields(body, settings);
    const validation = flightSchema.safeParse({
      ...values,
      airport: (values.airport || "").toUpperCase(),
      callsign: (values.callsign || "").trim().toUpperCase(),
      aircraft_type: (values.aircraft_type || "").trim().toUpperCase(),
      departure: (values.departure || "").trim().toUpperCase(),
      departure_time: (values.departure_time || "").trim(),
      arrival: (values.arrival || "").trim().toUpperCase(),
      altitude: (values.altitude || "").trim().toUpperCase(),
      speed: (values.speed || "").trim(),
      route: (values.route || "").trim().toUpperCase(),
      discord_username: (values.discord_username || "").trim(),
      geofs_callsign: (values.geofs_callsign || "").trim(),
    });

    if (!validation.success) {
      return json(
        {
          error: "Please correct the errors in the form.",
          issues: validation.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const id = await convex.mutation(api.flights.create, {
      ...validation.data,
      status: "delivery",
      notes: "",
      squawk: undefined,
    });

    return json({
      id,
      message: "Thank you. Your flight is filed. See you at the event!",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to file flight";
    const status = message.includes("already exists") ? 409 : 500;
    return json({ error: message }, { status });
  }
}
