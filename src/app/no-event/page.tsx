// src/app/no-event/page.tsx
"use client";
import Footer from "~/components/footer";

export default function NoEventPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black p-8 text-white">
      <div className="flex flex-1 items-center justify-center">
        <div className="mx-auto max-w-xl py-12 text-center">
          <header className="mb-8">
            <h1 className="mb-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
              No{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Event
              </span>{" "}
              Active
            </h1>
            <p className="text-xl text-gray-400">
              There is no event happening right now.
            </p>
          </header>
          <main className="flex flex-col items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-600">
              <svg
                className="h-8 w-8 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="max-w-md text-lg text-gray-300">
              Check back later or follow our announcements for upcoming events
              and flight operations.
            </p>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
