import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const redirectEnabled = process.env.REDIRECT_HOME_TO_NO_EVENT === "true";
  if (
    (req.nextUrl.pathname === "/" ||
      req.nextUrl.pathname === "/file-flight" ||
      req.nextUrl.pathname.startsWith("/board/")) &&
    redirectEnabled
  ) {
    return NextResponse.redirect(new URL("/no-event", req.url));
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Let Clerk handle the rest
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
