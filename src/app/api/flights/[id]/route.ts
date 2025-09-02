import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient, FlightStatus } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Fetch individual flight with history
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      orderBy: { changed_at: 'desc' },
    });

    return NextResponse.json({ flight, history });
  } catch (error) {
    console.error("Error fetching flight:", error);
    return NextResponse.json({ error: "Failed to fetch flight" }, { status: 500 });
  }
}

// PUT - Update individual flight
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    // UPDATED: Include airport in destructuring
    const { airport, callsign, aircraft_type, departure, arrival, altitude, speed, status, notes } = body;
    const { id: flightId } = await params;

    // Get current flight for history tracking
    const currentFlight = await prisma.flights.findUnique({
      where: { id: flightId },
    });

    if (!currentFlight) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    // Validate status if provided
    if (status) {
      const validStatuses = Object.values(FlightStatus);
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
    }

    // Prepare update data (only include fields that are provided)
    const updateData: any = {};
    if (airport !== undefined) updateData.airport = airport.toUpperCase(); // NEW: Handle airport updates
    if (callsign !== undefined) updateData.callsign = callsign.toUpperCase();
    if (aircraft_type !== undefined) updateData.aircraft_type = aircraft_type.toUpperCase();
    if (departure !== undefined) updateData.departure = departure.toUpperCase();
    if (arrival !== undefined) updateData.arrival = arrival.toUpperCase();
    if (altitude !== undefined) updateData.altitude = altitude;
    if (speed !== undefined) updateData.speed = speed;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // Update flight
    const updatedFlight = await prisma.flights.update({
      where: { id: flightId },
      data: updateData,
    });

    // Log status change to history if status changed
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

    // Handle unique constraint violation (duplicate callsign)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Flight with this callsign already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to update flight" }, { status: 500 });
  }
}

// DELETE - Delete individual flight
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: flightId } = await params;

    // Check if flight exists
    const flight = await prisma.flights.findUnique({
      where: { id: flightId },
    });

    if (!flight) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    // Delete flight history first, then the flight
    await prisma.flight_history.deleteMany({
      where: { flight_id: flightId },
    });

    // Now delete the flight
    await prisma.flights.delete({
      where: { id: flightId },
    });

    return NextResponse.json({ 
      message: "Flight deleted successfully",
      deletedFlight: {
        id: flight.id,
        callsign: flight.callsign,
        airport: flight.airport // Include airport info in response
      }
    });
  } catch (error) {
    console.error("Error deleting flight:", error);
    return NextResponse.json({ error: "Failed to delete flight" }, { status: 500 });
  }
}