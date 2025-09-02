import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, FlightStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const airport = searchParams.get('airport');

    const whereClause = airport ? { airport } : {};
    
    const flights = await prisma.flights.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ flights });
  } catch (error) {
    console.error("Error fetching flights:", error);
    return NextResponse.json({ error: "Failed to fetch flights" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { airport, callsign, aircraft_type, departure, arrival, altitude, speed, status, notes } = body;

    // Remove the redundant `if (!airport)` and relax the validation
    if (!callsign || !airport || !aircraft_type || !departure || !arrival || !status) {
      return NextResponse.json({ 
        error: "Missing required fields: callsign, airport, aircraft_type, departure, arrival, status" 
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = Object.values(FlightStatus);
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Create flight with normalized data
    const flight = await prisma.flights.create({
      data: {
        airport: airport.toUpperCase(), // Normalize airport code
        callsign: callsign.toUpperCase(),
        aircraft_type: aircraft_type.toUpperCase(),
        departure: departure.toUpperCase(),
        arrival: arrival.toUpperCase(),
        altitude: altitude || null, // Ensure `altitude` can be nullable
        speed: speed || null, // Ensure `speed` can be nullable
        status: status,
        notes: notes || '',
      },
    });

    // Log initial status to history
    await prisma.flight_history.create({
      data: {
        flight_id: flight.id,
        old_status: '', // No previous status for new flight
        new_status: status,
      },
    });

    return NextResponse.json({ flight });
  } catch (error: any) {
    console.error("Error creating flight:", error);

    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Flight with this callsign already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create flight" }, { status: 500 });
  }
}