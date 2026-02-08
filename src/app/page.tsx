// src/app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { AirportSelector } from "~/components/airport-selector";
import Footer from "~/components/footer";
import Loading from "~/components/loading";
import Header from "~/components/header";
import { useCurrentUser } from "~/hooks/use-current-user";

export default function HomePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user: convexUser, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-up");
    } else if (!isLoading && convexUser && !convexUser.isController) {
      router.push("/become-controller");
    }
  }, [isLoaded, isSignedIn, isLoading, convexUser, router]);

  if (!isLoaded || !isSignedIn || isLoading || !convexUser?.isController) {
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
            <AirportSelector />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
