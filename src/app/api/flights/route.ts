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

  // const rateLimitResult = checkRateLimit(userId);
  // if (rateLimitResult.limited) {
  //   return rateLimitResult.response || NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  // }

  try {
    const body = await request.json();
    console.log(body);

    const airport = body["1_airport"] || body.airport;
    const callsign = body["1_callsign"] || body.callsign;
    const geofs_callsign = body["1_geofs_callsign"] || body.geofs_callsign;
    const discord_username =
      body["1_discord_username"] || body.discord_username;
    const aircraft_type = body["1_aircraft_type"] || body.aircraft_type;
    const departure = body["1_departure"] || body.departure;
    const departure_time = body["1_departure_time"] || body.departure_time;
    const arrival = body["1_arrival"] || body.arrival;
    const altitude = body["1_altitude"] || body.altitude;
    const squawk = "";
    const speed = body["1_speed"] || body.speed;
    const status = body["1_status"] || body.status;
    const route = body["1_route"] || body.route;
    const notes = body["1_notes"] || body.notes;

    if (
      !airport ||
      !callsign ||
      !geofs_callsign ||
      !departure ||
      !arrival ||
      !status ||
      !discord_username
    ) {
      return NextResponse.json(
        {
          error:
            "Missing one or more required fields like: Airport, Discord Username, Callsign, GeoFS Callsign, Departure Aiport, Arrival Airport, Status",
        },
        { status: 400 },
      );
    }

    const validStatuses = Object.values(FlightStatus);
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const flight = await prisma.flights.create({
      data: {
        airport: airport.toUpperCase(),
        callsign: callsign.toUpperCase(),
        discord_username: discord_username,
        geofs_callsign: geofs_callsign,
        aircraft_type: aircraft_type ? aircraft_type.toUpperCase() : null,
        departure: departure.toUpperCase(),
        departure_time: departure_time || "",
        arrival: arrival.toUpperCase(),
        altitude: altitude || null,
        squawk: "",
        speed: speed || null,
        status: status,
        route: route || "",
        notes: "",
      },
    });

    return NextResponse.json({ flight });
  } catch (error: any) {
    console.error("Error creating flight:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Flight with this callsign already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create flight" },
      { status: 500 },
    );
  }
}
