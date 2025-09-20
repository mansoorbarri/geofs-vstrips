import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
  const { userId } = await auth();
  const user = await currentUser();
  
  if (!userId || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const discordAccount = user.externalAccounts.find(
    (account) => account.provider === 'oauth_discord'
  );

  if (!discordAccount) {
    return NextResponse.json({ error: 'Discord account not linked' }, { status: 400 });
  }

  try {
    const flights = await prisma.flights.findMany({
      where: {
        discord_username: {
          equals: discordAccount.username,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        airport: true,
        callsign: true,
        geofs_callsign: true,
        aircraft_type: true,
        departure: true,
        departure_time: true,
        arrival: true,
        altitude: true,
        speed: true,
        status: true,
        notes: true,
        discord_username: true,
      },
      orderBy: {
        departure_time: 'asc'
      }
    });
    
    return NextResponse.json({ flights });
  } catch (error) {
    console.error("Error fetching user flights:", error);
    return NextResponse.json({ error: "Failed to fetch flights" }, { status: 500 });
  }
}