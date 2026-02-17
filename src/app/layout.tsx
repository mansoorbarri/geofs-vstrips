import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { ConvexClientProvider } from "~/components/convex-client-provider";
import "~/styles/globals.css";
import SessionManager from "~/components/session-manager";
import { StoreUser } from "~/components/store-user";

export const metadata: Metadata = {
  title: "ATC Flight Strip Manager",
  description: "Air Traffic Control Flight Strip Management System",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <ConvexClientProvider>
        <html lang="en" className="dark">
          <body
            className={`font-sans ${GeistSans.variable} ${GeistMono.variable} bg-black text-white`}
          >
            <StoreUser />
            <SessionManager />
            <TooltipProvider>
              <Suspense fallback={null}>{children}</Suspense>
            </TooltipProvider>
            <Analytics />
            <Toaster />
          </body>
        </html>
      </ConvexClientProvider>
    </ClerkProvider>
  );
}
