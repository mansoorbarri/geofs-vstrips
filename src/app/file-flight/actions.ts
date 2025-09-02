// src/app/file-flight/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { type FlightStatus } from "~/components/board-page-client";

async function createFlightOnBackend(flightData: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/flights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flightData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || "Failed to create flight. An unknown error occurred.";
      throw new Error(errorMessage);
    }
    
    // The API returns the created flight object on success.
    const { flight } = await response.json();
    return flight;
  } catch (error: any) {
    console.error("Error calling flight creation API:", error);
    // Rethrow the error with a user-friendly message
    throw new Error(error.message || "Failed to file flight due to a network error. Please try again.");
  }
}

export async function createFlightAction(
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const flightData = {
    callsign: formData.get("callsign"),
    aircraft_type: formData.get("aircraft_type"),
    departure: formData.get("departure"),
    arrival: formData.get("arrival"),
    altitude: formData.get("altitude"),
    speed: formData.get("speed"),
    notes: formData.get("notes"),
    status: "delivery" as FlightStatus,
    airport: formData.get("airport_atc"),
  };

  try {
    const savedFlight = await createFlightOnBackend(flightData);

    // This is crucial to refresh the airport board. It will ensure the new flight
    // appears the next time the page is loaded or revalidated.
    revalidatePath(`/board/${savedFlight.airport}`);

    return {
      success: true,
      message: "Thank you. Your flight is filed. See you at the event!",
    };
    
  } catch (error: any) {
    console.error("Error creating flight:", error);
    return {
      success: false,
      message: error.message,
    };
  }
}