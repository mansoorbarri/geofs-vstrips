import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, FlightStatus } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

interface PublicMetadata {
  controller?: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isController = (sessionClaims?.publicMetadata as PublicMetadata)?.controller === true;
  // console.log(isController);
  if (!isController) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const flightId = (await params).id;

    const flight = await prisma.flights.findUnique({
      where: { id: flightId },
    });

    if (!flight) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    const history = await prisma.flight_history.findMany({
      where: { flight_id: flightId },
      orderBy: { changed_at: "desc" },
    });

    return NextResponse.json({ flight, history });
  } catch (error) {
    console.error("Error fetching flight:", error);
    return NextResponse.json(
      { error: "Failed to fetch flight" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isController = (sessionClaims?.publicMetadata as PublicMetadata)?.controller === true;
  const clerk_discord_username = (sessionClaims?.discord_username as string);

  try {
    const body = await request.json();
    const { airport, callsign, aircraft_type, departure, arrival, altitude, speed, status, route, notes } = body;
    const { id: flightId } = await params;

    const currentFlight = await prisma.flights.findUnique({
      where: { id: flightId },
    });

    if (!currentFlight) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    const isPilotOwner = currentFlight.discord_username === clerk_discord_username;
    const canEdit = isController || (isPilotOwner && currentFlight.status === "delivery");
    
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (status) {
      const validStatuses = Object.values(FlightStatus);
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (airport !== undefined) updateData.airport = airport.toUpperCase();
    if (callsign !== undefined) updateData.callsign = callsign.toUpperCase();
    if (aircraft_type !== undefined) updateData.aircraft_type = aircraft_type.toUpperCase();
    if (departure !== undefined) updateData.departure = departure.toUpperCase();
    if (arrival !== undefined) updateData.arrival = arrival.toUpperCase();
    if (altitude !== undefined) updateData.altitude = altitude;
    if (speed !== undefined) updateData.speed = speed;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updatedFlight = await prisma.flights.update({
      where: { id: flightId },
      data: updateData,
    });

    if (status && status !== currentFlight.status) {
      await prisma.flight_history.create({
        data: {
          flight_id: flightId,
          old_status: currentFlight.status,
          new_status: status,
        },
      });
    }

    return NextResponse.json({ flight: updatedFlight });
  } catch (error: any) {
    console.error("Error updating flight:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Flight with this callsign already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update flight" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isController = (sessionClaims?.publicMetadata as PublicMetadata)?.controller === true;
  if (!isController) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  try {
    const { id: flightId } = await params;

    const flight = await prisma.flights.findUnique({
      where: { id: flightId },
    });

    if (!flight) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    await prisma.flight_history.deleteMany({
      where: { flight_id: flightId },
    });

    await prisma.flights.delete({
      where: { id: flightId },
    });

    return NextResponse.json({ 
      message: "Flight deleted successfully",
      deletedFlight: {
        id: flight.id,
        callsign: flight.callsign,
        airport: flight.airport
      }
    });
  } catch (error) {
    console.error("Error deleting flight:", error);
    return NextResponse.json({ error: "Failed to delete flight" }, { status: 500 });
  }
}