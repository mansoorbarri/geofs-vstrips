import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    airport: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.airport) {
      return await ctx.db
        .query("flights")
        .withIndex("by_airport", (q) => q.eq("airport", args.airport!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("flights").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("flights") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByCallsign = query({
  args: { callsign: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("flights")
      .withIndex("by_callsign", (q) => q.eq("callsign", args.callsign))
      .first();
  },
});

export const getMyFlights = query({
  args: { discord_username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("flights")
      .withIndex("by_discord_username", (q) =>
        q.eq("discord_username", args.discord_username)
      )
      .collect();
  },
});

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    // Check for duplicate callsign
    const existing = await ctx.db
      .query("flights")
      .withIndex("by_callsign", (q) => q.eq("callsign", args.callsign))
      .first();

    if (existing) {
      throw new Error("A flight with this callsign already exists.");
    }

    const flightId = await ctx.db.insert("flights", {
      airport: args.airport.toUpperCase(),
      callsign: args.callsign.toUpperCase(),
      discord_username: args.discord_username,
      geofs_callsign: args.geofs_callsign,
      aircraft_type: args.aircraft_type.toUpperCase(),
      departure: args.departure.toUpperCase(),
      departure_time: args.departure_time,
      arrival: args.arrival.toUpperCase(),
      altitude: args.altitude,
      squawk: args.squawk || "",
      speed: args.speed,
      status: args.status,
      route: args.route || "",
      notes: args.notes || "",
    });

    return flightId;
  },
});

export const update = mutation({
  args: {
    id: v.id("flights"),
    airport: v.optional(v.string()),
    callsign: v.optional(v.string()),
    discord_username: v.optional(v.string()),
    geofs_callsign: v.optional(v.string()),
    aircraft_type: v.optional(v.string()),
    departure: v.optional(v.string()),
    departure_time: v.optional(v.string()),
    arrival: v.optional(v.string()),
    altitude: v.optional(v.string()),
    squawk: v.optional(v.string()),
    speed: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("delivery"),
        v.literal("ground"),
        v.literal("tower"),
        v.literal("departure"),
        v.literal("approach"),
        v.literal("control")
      )
    ),
    route: v.optional(v.string()),
    notes: v.optional(v.string()),
    changed_by: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, changed_by, ...updates } = args;

    const flight = await ctx.db.get(id);
    if (!flight) {
      throw new Error("Flight not found");
    }

    // Check for callsign uniqueness if callsign is being updated
    if (updates.callsign && updates.callsign !== flight.callsign) {
      const existing = await ctx.db
        .query("flights")
        .withIndex("by_callsign", (q) => q.eq("callsign", updates.callsign!))
        .first();

      if (existing) {
        throw new Error("A flight with this callsign already exists.");
      }
    }

    // Record status change in history
    if (updates.status && updates.status !== flight.status) {
      await ctx.db.insert("flight_history", {
        flight_id: id,
        old_status: flight.status,
        new_status: updates.status,
        changed_by: changed_by,
      });
    }

    // Build update object with uppercase conversions
    const updateData: Record<string, unknown> = {};
    if (updates.airport !== undefined)
      updateData.airport = updates.airport.toUpperCase();
    if (updates.callsign !== undefined)
      updateData.callsign = updates.callsign.toUpperCase();
    if (updates.discord_username !== undefined)
      updateData.discord_username = updates.discord_username;
    if (updates.geofs_callsign !== undefined)
      updateData.geofs_callsign = updates.geofs_callsign;
    if (updates.aircraft_type !== undefined)
      updateData.aircraft_type = updates.aircraft_type.toUpperCase();
    if (updates.departure !== undefined)
      updateData.departure = updates.departure.toUpperCase();
    if (updates.departure_time !== undefined)
      updateData.departure_time = updates.departure_time;
    if (updates.arrival !== undefined)
      updateData.arrival = updates.arrival.toUpperCase();
    if (updates.altitude !== undefined) updateData.altitude = updates.altitude;
    if (updates.squawk !== undefined) updateData.squawk = updates.squawk;
    if (updates.speed !== undefined) updateData.speed = updates.speed;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.route !== undefined) updateData.route = updates.route;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    await ctx.db.patch(id, updateData);

    return await ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("flights") },
  handler: async (ctx, args) => {
    const flight = await ctx.db.get(args.id);
    if (!flight) {
      throw new Error("Flight not found");
    }

    // Delete associated history
    const history = await ctx.db
      .query("flight_history")
      .withIndex("by_flight", (q) => q.eq("flight_id", args.id))
      .collect();

    for (const record of history) {
      await ctx.db.delete(record._id);
    }

    // Delete the flight
    await ctx.db.delete(args.id);

    return { deletedId: args.id, callsign: flight.callsign };
  },
});

export const getHistory = query({
  args: { flight_id: v.id("flights") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("flight_history")
      .withIndex("by_flight", (q) => q.eq("flight_id", args.flight_id))
      .order("desc")
      .collect();
  },
});
