// src/app/no-event/page.tsx
"use client";
import Footer from "~/components/footer";

export default function NoEventPage() {
    return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-xl mx-auto py-12 text-center">
          <header className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-2">
              No <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Event</span> Active
            </h1>
            <p className="text-xl text-gray-400">
              There is no event happening right now.
            </p>
          </header>
          <main className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full border-2 border-gray-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg text-gray-300 max-w-md">
              Check back later or follow our announcements for upcoming events and flight operations.
            </p>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}