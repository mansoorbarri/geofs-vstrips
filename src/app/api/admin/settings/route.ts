import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    
    const isAdmin = (sessionClaims?.publicMetadata as any)?.admin === true;
    
    if (!userId || !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      isEventLive,
      airportMode,
      fixedAirport,
      departureMode,
      fixedDeparture,
      arrivalMode,
      fixedArrival,
      timeMode,
      fixedTime,
      routeMode,
      fixedRoute,
      activeAirports,
      airportData,
    } = body;

    const updatedSettings = await db.eventSettings.upsert({
      where: { id: "current" },
      update: {
        isEventLive,
        airportMode,
        fixedAirport,
        departureMode,
        fixedDeparture,
        arrivalMode,
        fixedArrival,
        timeMode,
        fixedTime,
        routeMode,
        fixedRoute,
        activeAirports,
        airportData,
      },
      create: {
        id: "current",
        isEventLive,
        airportMode,
        fixedAirport,
        departureMode,
        fixedDeparture,
        arrivalMode,
        fixedArrival,
        timeMode,
        fixedTime,
        routeMode,
        fixedRoute,
        activeAirports,
        airportData,
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const settings = await db.eventSettings.findUnique({
      where: { id: "current" },
    });

    if (!settings) {
      return NextResponse.json({ 
        isEventLive: false,
        airportMode: "CUSTOM",
        fixedAirport: "",
        departureMode: "CUSTOM",
        arrivalMode: "CUSTOM",
        timeMode: "CUSTOM",
        routeMode: "CUSTOM",
        activeAirports: [],
        airportData: [] 
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}