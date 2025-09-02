// src/app/page.tsx
import Link from 'next/link';
import { Button } from "~/components/ui/button";
import { PlaneTakeoff } from "lucide-react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AirportSelector } from "~/components/airport-selector";

export default async function HomePage() {
  const cookieStore = await cookies();
  const authenticated = cookieStore.get("auth_token")?.value === "authenticated";

  if (!authenticated) {
    redirect("/gate");
  }

  const airports = [
    { id: "YSSY", name: "Sydney (YSSY)" },
    { id: "YMML", name: "Melbourne (YMML)" },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
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
  );
}