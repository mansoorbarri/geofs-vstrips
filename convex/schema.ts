import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  flights: defineTable({
    airport: v.string(),
    callsign: v.string(),
    discord_username: v.optional(v.string()),
    geofs_callsign: v.optional(v.string()),
    aircraft_type: v.string(),
    departure: v.string(),
    departure_time: v.string(),
    arrival: v.string(),
    altitude: v.string(),
    squawk: v.optional(v.string()),
    speed: v.string(),
    status: v.union(
      v.literal("delivery"),
      v.literal("ground"),
      v.literal("tower"),
      v.literal("departure"),
      v.literal("approach"),
      v.literal("control")
    ),
    route: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_airport", ["airport"])
    .index("by_callsign", ["callsign"])
    .index("by_discord_username", ["discord_username"]),

  flight_history: defineTable({
    flight_id: v.id("flights"),
    old_status: v.string(),
    new_status: v.string(),
    changed_by: v.optional(v.string()),
  }).index("by_flight", ["flight_id"]),

  eventSettings: defineTable({
    isEventLive: v.boolean(),
    airportMode: v.string(),
    fixedAirport: v.optional(v.string()),
    departureMode: v.string(),
    fixedDeparture: v.optional(v.string()),
    arrivalMode: v.string(),
    fixedArrival: v.optional(v.string()),
    timeMode: v.string(),
    fixedTime: v.optional(v.string()),
    routeMode: v.string(),
    fixedRoute: v.optional(v.string()),
    activeAirports: v.array(v.string()),
    airportData: v.any(),
  }),
});
