import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const flightId = params.id

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