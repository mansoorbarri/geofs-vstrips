import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const getSuperAdminEmail = () =>
  process.env.SUPER_ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called store without authentication");
    }
    const superAdminEmail = getSuperAdminEmail();
    const isSuperAdmin =
      Boolean(identity.email) && identity.email === superAdminEmail;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (user !== null) {
      await ctx.db.patch(user._id, {
        email: identity.email ?? user.email,
        name: identity.name ?? user.name,
        imageUrl: identity.pictureUrl ?? user.imageUrl,
        isController: isSuperAdmin ? true : user.isController,
        isAdmin: isSuperAdmin ? true : user.isAdmin,
        lastActiveAt: Date.now(),
      });
      return user._id;
    }

    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email ?? "",
      name: identity.name,
      username: identity.nickname,
      imageUrl: identity.pictureUrl,
      isController: isSuperAdmin,
      isAdmin: isSuperAdmin,
      lastActiveAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser?.isAdmin) {
      throw new Error("Not authorized: admin only");
    }

    return await ctx.db.query("users").collect();
  },
});

export const toggleController = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser?.isAdmin) {
      throw new Error("Not authorized: admin only");
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    if (targetUser._id === currentUser._id) {
      throw new Error("Cannot toggle your own controller status");
    }

    await ctx.db.patch(args.userId, {
      isController: !targetUser.isController,
    });
  },
});

export const setAdmin = mutation({
  args: { userId: v.id("users"), isAdmin: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser?.isAdmin) {
      throw new Error("Not authorized: admin only");
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    if (targetUser._id === currentUser._id && !args.isAdmin) {
      throw new Error("Cannot remove your own admin status");
    }

    await ctx.db.patch(args.userId, {
      isAdmin: args.isAdmin,
    });
  },
});


export const toggleAdmin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (identity.email !== getSuperAdminEmail()) {
      throw new Error("Not authorized: super admin only");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    if (currentUser && targetUser._id === currentUser._id) {
      throw new Error("Cannot toggle your own admin status");
    }

    await ctx.db.patch(args.userId, {
      isAdmin: !targetUser.isAdmin,
    });
  },
});

export const deleteByClerkId = mutation({
  args: {
    clerkId: v.string(),
    syncSecret: v.string(),
  },
  handler: async (ctx, args) => {
    if (!process.env.CLERK_SYNC_SECRET) {
      throw new Error("CLERK_SYNC_SECRET is not configured");
    }
    if (args.syncSecret !== process.env.CLERK_SYNC_SECRET) {
      throw new Error("Not authorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return { deleted: false };
    }

    await ctx.db.delete(user._id);
    return { deleted: true };
  },
});
