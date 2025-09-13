import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default clerkMiddleware((auth, request: NextRequest) => {
  // Your custom redirect logic
  const redirectEnabled = process.env.REDIRECT_HOME_TO_NO_EVENT === "true";
  
  if ((request.nextUrl.pathname === "/" || 
       request.nextUrl.pathname === "/file-flight" || 
       request.nextUrl.pathname.startsWith("/board/")) && redirectEnabled) {
    return NextResponse.redirect(new URL("/no-event", request.url));
  }
  
  // Let Clerk handle the rest
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};