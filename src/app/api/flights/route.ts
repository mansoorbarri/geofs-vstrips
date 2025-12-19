import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, FlightStatus } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { checkRateLimit } from "~/lib/rate-limiter";

const prisma = new PrismaClient();

interface PublicMetadata {
  controller?: boolean;
}

export async function GET(request: NextRequest) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isController =
    (sessionClaims?.publicMetadata as PublicMetadata)?.controller === true;
  if (!isController) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const airport = searchParams.get("airport");
    const whereClause = airport ? { airport } : {};

    const flights = await prisma.flights.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ flights });
  } catch (error) {
    console.error("Error fetching flights:", error);
    return NextResponse.json(
      { error: "Failed to fetch flights" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Standardize field extraction
    const airport = (body["1_airport"] || body.airport || "").toUpperCase();
    const callsign = (body["1_callsign"] || body.callsign || "").toUpperCase();
    const geofs_callsign = body["1_geofs_callsign"] || body.geofs_callsign;
    const discord_username = body["1_discord_username"] || body.discord_username;
    const aircraft_type = (body["1_aircraft_type"] || body.aircraft_type || "").toUpperCase();
    const departure = (body["1_departure"] || body.departure || "").toUpperCase();
    const departure_time = body["1_departure_time"] || body.departure_time || "";
    const arrival = (body["1_arrival"] || body.arrival || "").toUpperCase();
    const altitude = body["1_altitude"] || body.altitude;
    const speed = body["1_speed"] || body.speed;
    const status = body["1_status"] || body.status;
    const route = body["1_route"] || body.route || "";

    // 1. Validation check
    if (
      !airport ||
      !callsign ||
      !geofs_callsign ||
      !departure ||
      !arrival ||
      !status ||
      !discord_username ||
      !departure_time
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields: Airport, Callsign, Time, etc.",
        },
        { status: 400 }
      );
    }

    const validStatuses = Object.values(FlightStatus);
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // 2. Transaction to check slot capacity and create flight
    const result = await prisma.$transaction(async (tx) => {
      // Count total flights for this specific airport
      const flightCount = await tx.flights.count({
        where: {
          airport: airport,
        },
      });

      // Threshold changed to 10
      if (flightCount >= 10) {
        throw new Error("AIRPORT_FULL");
      }

      return await tx.flights.create({
        data: {
          airport,
          callsign,
          discord_username,
          geofs_callsign,
          aircraft_type,
          departure,
          departure_time,
          arrival,
          altitude,
          squawk: "",
          speed,
          status,
          route,
          notes: "",
        },
      });
    });

    return NextResponse.json({ flight: result });
  } catch (error: any) {
    console.error("Error creating flight:", error);

    // Specific error for airport limit
    if (error.message === "AIRPORT_FULL") {
      return NextResponse.json(
        { 
          error: "This airport has reached its limit of 10 pilots. Please select a different location." 
        },
        { status: 429 }
      );
    }

    // Unique constraint error (Prisma P2002)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A flight with this callsign already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create flight. Please try again." },
      { status: 500 }
    );
  }
}