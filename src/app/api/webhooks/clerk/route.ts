import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const clerkSyncSecret = process.env.CLERK_SYNC_SECRET;

export async function POST(req: NextRequest) {
  try {
    const event = await verifyWebhook(req);

    if (!convexUrl || !clerkSyncSecret) {
      console.error(
        "Missing NEXT_PUBLIC_CONVEX_URL or CLERK_SYNC_SECRET for Clerk webhook sync.",
      );
      return NextResponse.json(
        { error: "Webhook sync not configured" },
        { status: 500 },
      );
    }

    if (event.type === "user.deleted") {
      const clerkId = event.data.id;
      if (typeof clerkId !== "string") {
        return NextResponse.json({ error: "Invalid user.deleted payload" }, { status: 400 });
      }
      const convex = new ConvexHttpClient(convexUrl);
      await convex.mutation(api.users.deleteByClerkId, {
        clerkId,
        syncSecret: clerkSyncSecret,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Invalid Clerk webhook request:", error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
