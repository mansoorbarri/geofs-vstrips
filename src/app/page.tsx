// src/app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { AirportSelector } from "~/components/airport-selector";
import Footer from "~/components/footer";
import { airports } from "~/constants/airports";
import Loading from "~/components/loading";
import Header from "~/components/header";

export default function HomePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.push("/sign-up");
      } else if (
        !user?.publicMetadata ||
        user.publicMetadata.controller !== true
      ) {
        router.push("/become-controller");
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (
    !isLoaded ||
    !isSignedIn ||
    !user ||
    user.publicMetadata.controller !== true
  ) {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-black p-8 text-white">
      <Header />
      <div className="flex flex-1 items-center justify-center">
        <div className="mx-auto max-w-xl py-12 text-center">
          <header className="mb-8">
            <h1 className="mb-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
              ATC{" "}
              <span className="bg-gradient-to-r from-blue-200 to-blue-500 bg-clip-text text-transparent">
                Flight Board
              </span>
            </h1>
            <p className="text-xl text-gray-400">
              Select an airport to manage flights.
            </p>
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
