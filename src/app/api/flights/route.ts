import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient, FlightStatus } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const since = searchParams.get("since") // For real-time updates

    let whereClause = {}
    if (since) {
      whereClause = {
        updated_at: {
          gt: new Date(since)
        }
      }
    }

    const flights = await prisma.flights.findMany({
      where: whereClause,
      orderBy: { updated_at: 'desc' }
    })

    return NextResponse.json({ flights })
  } catch (error) {
    console.error("Error fetching flights:", error)
    return NextResponse.json({ error: "Failed to fetch flights" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { callsign, aircraft_type, departure, arrival, altitude, speed, status, notes } = body

    // Validate required fields
    if (!callsign || !aircraft_type || !departure || !arrival || !altitude || !speed || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate status
    const validStatuses = Object.values(FlightStatus)
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const flight = await prisma.flights.create({
      data: {
        callsign: callsign.toUpperCase(),
        aircraft_type: aircraft_type.toUpperCase(),
        departure: departure.toUpperCase(),
        arrival: arrival.toUpperCase(),
        altitude,
        speed,
        status,
        notes: notes || ""
      }
    })

    // Log status change to history
    await prisma.flight_history.create({
      data: {
        flight_id: flight.id,
        old_status: "", // NULL equivalent - empty string or you could make this field optional
        new_status: status
        // Note: removed notes field as it's not in your schema
      }
    })

    return NextResponse.json({ flight }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating flight:", error)
    
    // Handle unique constraint violation (duplicate callsign)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Flight with this callsign already exists" }, { status: 409 })
    }
    
    return NextResponse.json({ error: "Failed to create flight" }, { status: 500 })
  }
}