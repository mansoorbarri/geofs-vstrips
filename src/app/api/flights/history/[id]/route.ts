import { type NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isController = (sessionClaims?.publicMetadata as UserPublicMetadata)?.controller === true;
  if (!isController) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Await the params Promise in Next.js 15
    const resolvedParams = await params;
    const flightId = resolvedParams.id;
    
    const history = await prisma.flight_history.findMany({
      where: { flight_id: flightId },
      orderBy: { changed_at: "desc" },
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching flight history:", error);
    return NextResponse.json(
      { error: "Failed to fetch flight history" },
      { status: 500 },
    );
  }
}