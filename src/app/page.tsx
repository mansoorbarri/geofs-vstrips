// src/app/page.tsx
"use client"

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { AirportSelector } from "~/components/airport-selector";
import Footer from "~/components/footer";
import { airports } from "~/constants/airports";
import Loading from "~/components/loading";

export default function HomePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  
  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.push('/sign-up');
      } else if (!user?.publicMetadata || user.publicMetadata.controller !== true) {
        router.push('/file-flight');
      }
    }
  }, [isLoaded, isSignedIn, user, router]); 

  if (!isLoaded || !isSignedIn || !user || user.publicMetadata.controller !== true) {
    return (
      <Loading />
    );
  }
    
  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-xl mx-auto py-12 text-center">
          <header className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-2">
              ATC <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-500">Flight Board</span>
            </h1>
            <p className="text-xl text-gray-400">Select an airport to manage flights.</p>
          </header>
          <main>
            <AirportSelector airports={airports} />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}