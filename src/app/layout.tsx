import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from "~/components/ui/sonner"
import "~/styles/globals.css"
import SessionManager from "~/components/session-manager"

export const metadata: Metadata = {
  title: "ATC Flight Strip Manager",
  description: "Air Traffic Control Flight Strip Management System",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} bg-black text-white`}>
          <SessionManager />
          <Suspense fallback={null}>{children}</Suspense>
          <Analytics />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
