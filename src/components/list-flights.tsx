"use client";

import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import Footer from "~/components/footer";
import Header from "./header";
import { useMyFlights } from "~/hooks/use-flights";
import Loading from "~/components/loading";

export function FlightsList() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const discordUsername = user?.externalAccounts?.[0]?.username ?? null;
  const { flights, isLoading } = useMyFlights(discordUsername);

  const editableFlights = useMemo(
    () => flights.filter((flight) => flight.status === "delivery"),
    [flights],
  );

  const nonEditableFlights = useMemo(
    () => flights.filter((flight) => flight.status !== "delivery"),
    [flights],
  );

  if (!isLoaded || isLoading) {
    return <Loading />;
  }

  if (!isSignedIn) {
    router.push("/sign-up");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container mx-auto mt-10 max-w-4xl rounded-lg bg-gray-900 p-6 text-white shadow-xl">
        <div className="mb-6 flex items-center justify-center">
          <h1 className="text-3xl font-bold">Edit Your Flights</h1>
        </div>

        {flights.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-gray-500" />
            <h2 className="mb-2 text-xl font-semibold">No flights found</h2>
            <p className="mb-6 text-gray-400">{`You haven't created any flight plans yet.`}</p>
            <Button
              onClick={() => router.push("/file-flight")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Your First Flight
            </Button>
          </div>
        ) : editableFlights.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
            <h2 className="mb-2 text-xl font-semibold">No Editable Flights</h2>
            <p className="mb-2 text-gray-400">
              You have {flights.length} flight(s), but none can be edited.
            </p>
            <p className="mb-6 text-sm text-gray-500">
              {`Only flights with "DELIVERY" status can be edited.`}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => router.push("/flights")}
                className="bg-gray-600 hover:bg-gray-700"
              >
                View All Flights
              </Button>
              <Button
                onClick={() => router.push("/file-flight")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                File Another Flight
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="mb-6 text-center text-gray-300">
              Select a flight to edit ({editableFlights.length} of{" "}
              {flights.length} flights are editable)
            </p>

            {editableFlights.map((flight) => (
              <div
                key={flight.id}
                className="rounded-lg border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-gray-600"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-4">
                      <h3 className="text-xl font-semibold text-blue-500">
                        {flight.callsign}
                      </h3>
                      <span className="rounded bg-green-800 px-2 py-1 text-sm text-green-200">
                        {flight.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <p className="text-gray-400">Route</p>
                        <p className="text-white">
                          {flight.departure} → {flight.arrival}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Aircraft</p>
                        <p className="text-white">{flight.aircraft_type}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Departure Time</p>
                        <p className="text-white">{flight.departure_time}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Altitude</p>
                        <p className="text-white">{flight.altitude}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Speed</p>
                        <p className="text-white">{flight.speed}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Route</p>
                        <p className="text-white">{flight.route}</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push(`/edit-flight?id=${flight.id}`)}
                    className="bg-grey-900 flex items-center gap-2 border-1 border-white fill-none text-white hover:cursor-pointer hover:bg-white hover:text-black"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}

            {flights.length > editableFlights.length && (
              <div className="mt-8 border-t border-gray-700 pt-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-300">
                  Non-Editable Flights
                </h3>
                <div className="space-y-2">
                  {nonEditableFlights.map((flight) => (
                    <div
                      key={flight.id}
                      className="rounded-lg border border-gray-700 bg-gray-800 p-3 opacity-60"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-semibold text-gray-400">
                            {flight.callsign}
                          </span>
                          <span className="rounded bg-gray-700 px-2 py-1 text-sm text-gray-300">
                            {flight.status.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {flight.departure} → {flight.arrival}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => router.push("/file-flight")}
                className="bg-blue-600 text-white hover:cursor-pointer hover:bg-blue-700"
              >
                File Another Flight
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
