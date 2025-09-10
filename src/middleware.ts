import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export function middleware(request: { nextUrl: { pathname: string; }; url: string | URL | undefined; }) {
  const redirectEnabled = process.env.REDIRECT_HOME_TO_NO_EVENT === "true";

  if (request.nextUrl.pathname === "/" && redirectEnabled) {
    return NextResponse.redirect(new URL("/no-event", request.url));
  }
}

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};