import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"

const prisma = new PrismaClient()

// Change the type of the second argument to Promise<{ id: string }>
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
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