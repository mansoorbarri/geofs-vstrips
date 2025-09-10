// src/app/page.tsx
"use client"
import { redirect } from "next/navigation";
import { AirportSelector } from "~/components/airport-selector";
import { useUser } from "@clerk/nextjs";
import Footer from "~/components/footer";

export default function HomePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  
  if (!isLoaded) {
    return null;
  }
  
  if (!isSignedIn) {
    redirect('/sign-up');
  }
  
  if (!user.publicMetadata || user.publicMetadata.controller !== true) {
    redirect('/become-controller');
  }
  
  const airports = [
    { id: "KBDL", name: "Bradley" },
  ];
  
  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-xl mx-auto py-12 text-center">
          <header className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-2">
              ATC <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Flight Board</span>
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