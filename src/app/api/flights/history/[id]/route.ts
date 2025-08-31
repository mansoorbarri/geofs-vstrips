import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Change the type of the second argument to Promise<{ id: string }>
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // You must await the params object before accessing its properties
    const flightId = (await params).id

    const history = await prisma.flight_history.findMany({
      where: { flight_id: flightId },
      orderBy: { changed_at: 'desc' }
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error("Error fetching flight history:", error)
    return NextResponse.json({ error: "Failed to fetch flight history" }, { status: 500 })
  }
}