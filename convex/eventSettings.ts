import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("eventSettings").first();

    if (!settings) {
      return {
        isEventLive: false,
        airportMode: "CUSTOM",
        fixedAirport: "",
        departureMode: "CUSTOM",
        fixedDeparture: "",
        arrivalMode: "CUSTOM",
        fixedArrival: "",
        timeMode: "CUSTOM",
        fixedTime: "",
        routeMode: "CUSTOM",
        fixedRoute: "",
        activeAirports: [],
        airportData: [],
      };
    }

    return settings;
  },
});

export const update = mutation({
  args: {
    isEventLive: v.optional(v.boolean()),
    airportMode: v.optional(v.string()),
    fixedAirport: v.optional(v.string()),
    departureMode: v.optional(v.string()),
    fixedDeparture: v.optional(v.string()),
    arrivalMode: v.optional(v.string()),
    fixedArrival: v.optional(v.string()),
    timeMode: v.optional(v.string()),
    fixedTime: v.optional(v.string()),
    routeMode: v.optional(v.string()),
    fixedRoute: v.optional(v.string()),
    activeAirports: v.optional(v.array(v.string())),
    airportData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existingSettings = await ctx.db.query("eventSettings").first();

    if (existingSettings) {
      // Update existing settings
      await ctx.db.patch(existingSettings._id, {
        ...(args.isEventLive !== undefined && {
          isEventLive: args.isEventLive,
        }),
        ...(args.airportMode !== undefined && {
          airportMode: args.airportMode,
        }),
        ...(args.fixedAirport !== undefined && {
          fixedAirport: args.fixedAirport,
        }),
        ...(args.departureMode !== undefined && {
          departureMode: args.departureMode,
        }),
        ...(args.fixedDeparture !== undefined && {
          fixedDeparture: args.fixedDeparture,
        }),
        ...(args.arrivalMode !== undefined && {
          arrivalMode: args.arrivalMode,
        }),
        ...(args.fixedArrival !== undefined && {
          fixedArrival: args.fixedArrival,
        }),
        ...(args.timeMode !== undefined && { timeMode: args.timeMode }),
        ...(args.fixedTime !== undefined && { fixedTime: args.fixedTime }),
        ...(args.routeMode !== undefined && { routeMode: args.routeMode }),
        ...(args.fixedRoute !== undefined && { fixedRoute: args.fixedRoute }),
        ...(args.activeAirports !== undefined && {
          activeAirports: args.activeAirports,
        }),
        ...(args.airportData !== undefined && {
          airportData: args.airportData,
        }),
      });

      return await ctx.db.get(existingSettings._id);
    } else {
      // Create new settings
      const id = await ctx.db.insert("eventSettings", {
        isEventLive: args.isEventLive ?? false,
        airportMode: args.airportMode ?? "CUSTOM",
        fixedAirport: args.fixedAirport ?? "",
        departureMode: args.departureMode ?? "CUSTOM",
        fixedDeparture: args.fixedDeparture ?? "",
        arrivalMode: args.arrivalMode ?? "CUSTOM",
        fixedArrival: args.fixedArrival ?? "",
        timeMode: args.timeMode ?? "CUSTOM",
        fixedTime: args.fixedTime ?? "",
        routeMode: args.routeMode ?? "CUSTOM",
        fixedRoute: args.fixedRoute ?? "",
        activeAirports: args.activeAirports ?? [],
        airportData: args.airportData ?? [],
      });

      return await ctx.db.get(id);
    }
  },
});
