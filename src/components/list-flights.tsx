"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle, Edit, Plane } from "lucide-react";
import { useRouter } from "next/navigation";
import Footer from "~/components/footer";
import Header from "./header";

interface Flight {
  id: string;
  airport: string;
  callsign: string;
  geofs_callsign: string;
  aircraft_type: string;
  departure: string;
  departure_time: string;
  arrival: string;
  altitude: string;
  speed: string;
  status: string;
  notes: string;
  discord_username: string;
}

const CACHE_KEY = 'flights_cache';
const CACHE_DURATION = 5 * 60 * 1000;

export function FlightsList() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const editableFlights = useMemo(() => 
    flights.filter(flight => flight.status === "delivery"), 
    [flights]
  );

  const nonEditableFlights = useMemo(() => 
    flights.filter(flight => flight.status !== "delivery"), 
    [flights]
  );

  const getCachedFlights = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
        localStorage.removeItem(CACHE_KEY);
      }
    } catch (error) {
      localStorage.removeItem(CACHE_KEY);
    }
    return null;
  };

  const setCachedFlights = (flightsData: Flight[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: flightsData,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to cache flights:', error);
    }
  };

  const fetchFlights = useCallback(async () => {
    const cached = getCachedFlights();
    if (cached) {
      setFlights(cached);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/flights/my', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch flights');
      }
      
      const data = await response.json();
      const flightsData = data.flights || [];
      
      setFlights(flightsData);
      setCachedFlights(flightsData);
    } catch (error: any) {
      setError(error.message || 'Failed to load flights');
    } finally {
      setLoading(false);
    }
  }, [setFlights, setLoading, setError]);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      router.push('/sign-up');
      return;
    }

    void fetchFlights();
  }, [isLoaded, isSignedIn, fetchFlights, router]);

  if (!isLoaded || loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl bg-gray-900 rounded-lg shadow-xl text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        <p className="mt-4">Loading your flights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl bg-gray-900 rounded-lg shadow-xl text-white">
        <Alert variant="destructive" className="bg-red-900 border-red-600">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto p-6 max-w-4xl bg-gray-900 rounded-lg shadow-xl text-white mt-10">
      <div className="flex items-center justify-center mb-6">
        <h1 className="text-3xl font-bold">Edit Your Flights</h1>
      </div>

      {flights.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="h-16 w-16 mx-auto text-gray-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No flights found</h2>
          <p className="text-gray-400 mb-6">{`You haven't created any flight plans yet.`}</p>
          <Button 
            onClick={() => router.push('/file-flight')} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Your First Flight
          </Button>
        </div>
      ) : editableFlights.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Editable Flights</h2>
          <p className="text-gray-400 mb-2">
            You have {flights.length} flight(s), but none can be edited.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {`Only flights with "DELIVERY" status can be edited.`}
          </p>
          <div className="flex justify-center items-center gap-4">
            <Button 
              onClick={() => router.push('/flights')} 
              className="bg-gray-600 hover:bg-gray-700"
            >
              View All Flights
            </Button>
            <Button 
              onClick={() => router.push('/file-flight')} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              File Another Flight
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-300 text-center mb-6">
            Select a flight to edit ({editableFlights.length} of {flights.length} flights are editable)
          </p>
          
          {editableFlights.map((flight) => (
            <div key={flight.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-xl font-semibold text-blue-500">{flight.callsign}</h3>
                    <span className="px-2 py-1 bg-green-800 text-green-200 rounded text-sm">
                      {flight.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Route</p>
                      <p className="text-white">{flight.departure} → {flight.arrival}</p>
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
                      <p className="text-gray-400">Notes</p>
                      <p className="text-white">{flight.notes}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => router.push(`/edit-flight?id=${flight.id}`)}
                  className="border-1 fill-none bg-grey-900 border-white  hover:bg-white hover:text-black text-white  flex items-center gap-2 hover:cursor-pointer"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </div>
            </div>
          ))}
          
          {flights.length > editableFlights.length && (
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Non-Editable Flights</h3>
              <div className="space-y-2">
                {nonEditableFlights.map((flight) => (
                  <div key={flight.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700 opacity-60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-semibold text-gray-400">{flight.callsign}</span>
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm">
                          {flight.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{flight.departure} → {flight.arrival}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-center">
            <Button
              onClick={() => router.push('/file-flight')}
              className="bg-blue-600 text-white hover:bg-blue-700 hover:cursor-pointer"
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