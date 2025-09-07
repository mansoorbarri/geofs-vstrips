// middleware.ts
import { NextResponse, NextRequest } from 'next/server';
 
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/file-flight') {
    return NextResponse.redirect(new URL('/', request.url));
  }
}