import { useState, useEffect, useRef, useCallback } from "react";

export interface RadarAircraft {
  callsign: string; // GeoFS callsign
  flightNo: string; // ICAO or IATA flight number
  departure: string;
  arrival: string;
  squawk: string;
}

export function useRadarCallsigns() {
  const [radarAircraft, setRadarAircraft] = useState<RadarAircraft[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const lastMessageTime = useRef<number>(Date.now());
  const watchdogIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const aircraftRef = useRef<Map<string, RadarAircraft>>(new Map());

  const connectToStream = useCallback(() => {
    if (eventSourceRef.current) eventSourceRef.current.close();

    const es = new EventSource("https://sse.radarthing.com/api/stream");
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
    };

    es.onmessage = (event) => {
      try {
        lastMessageTime.current = Date.now();
        const data = JSON.parse(event.data);

        if (data.type === "full") {
          aircraftRef.current = new Map();
        }

        if (Array.isArray(data.aircraft)) {
          for (const ac of data.aircraft) {
            const key = ac.callsign || ac.id;
            if (key) {
              aircraftRef.current.set(key, {
                callsign: (ac.callsign || "").toUpperCase(),
                flightNo: (ac.flightNo || "").toUpperCase(),
                departure: (ac.departure || "").toUpperCase(),
                arrival: (ac.arrival || "").toUpperCase(),
                squawk: (ac.squawk || "").toUpperCase(),
              });
            }
          }
        }

        if (data.type === "delta" && Array.isArray(data.removed)) {
          for (const id of data.removed) {
            aircraftRef.current.delete(id);
            // Also scan for matching entries (id vs callsign mismatch)
            for (const [key, ac] of aircraftRef.current) {
              if (ac.callsign === id.toUpperCase()) {
                aircraftRef.current.delete(key);
                break;
              }
            }
          }
        }

        setRadarAircraft(Array.from(aircraftRef.current.values()));
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      scheduleReconnect();
    };

    startWatchdog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    const backoff = Math.min(
      1000 * Math.pow(2, reconnectAttempts.current),
      30000,
    );
    reconnectAttempts.current++;
    reconnectTimeoutRef.current = setTimeout(() => connectToStream(), backoff);
  }, [connectToStream]);

  const startWatchdog = useCallback(() => {
    if (watchdogIntervalRef.current) clearInterval(watchdogIntervalRef.current);
    watchdogIntervalRef.current = setInterval(() => {
      if (Date.now() - lastMessageTime.current > 30000) {
        setIsConnected(false);
        if (eventSourceRef.current) eventSourceRef.current.close();
        scheduleReconnect();
      }
    }, 10000);
  }, [scheduleReconnect]);

  useEffect(() => {
    connectToStream();
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      if (watchdogIntervalRef.current)
        clearInterval(watchdogIntervalRef.current);
    };
  }, [connectToStream]);

  return { radarAircraft, isConnected };
}
