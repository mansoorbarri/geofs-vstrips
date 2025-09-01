import Link from 'next/link';
import { Button } from "~/components/ui/button";
import { LogOut, PlaneLanding, PlaneTakeoff, Settings } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto py-12">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            ATC <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Flight Board</span>
          </h1>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Departure Board Card */}
          <Link href="/departure" passHref>
            <div className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="p-8">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-500/20 p-3 rounded-full mr-4">
                    <PlaneTakeoff className="w-6 h-6 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-semibold">Departure Board</h2>
                </div>
                <p className="text-gray-400 mb-6">
                  Manage flights from gate to departure. This board handles everything from delivery to tower control.
                </p>
                <Button className="w-full text-lg px-8 py-6 bg-blue-500 hover:bg-blue-600 transition-colors duration-300">
                  Access Departure Board
                </Button>
              </div>
              <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-blue-500/10 to-transparent group-hover:scale-110 transition-transform duration-300 pointer-events-none"></div>
            </div>
          </Link>

          {/* Arrival Board Card */}
          <Link href="/arrival" passHref>
            <div className="group relative overflow-hidden rounded-xl bg-gray-900 border border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="p-8">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-500/20 p-3 rounded-full mr-4">
                    <PlaneLanding className="w-6 h-6 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-semibold">Arrival Board</h2>
                </div>
                <p className="text-gray-400 mb-6">
                  Track and manage incoming flights. This board covers approach, tower, and ground control.
                </p>
                <Button className="w-full text-lg px-8 py-6 bg-purple-500 hover:bg-purple-600 transition-colors duration-300">
                  Access Arrival Board
                </Button>
              </div>
              <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-purple-500/10 to-transparent group-hover:scale-110 transition-transform duration-300 pointer-events-none"></div>
            </div>
          </Link>
        </main>
      </div>

      <div className="fixed bottom-0 left-0 w-full text-center p-4 bg-black/50 backdrop-blur-sm z-50">
        <p className="text-gray-500 text-xs">
          Designed & Developed by <span className="font-semibold text-white">xyzmani</span>
        </p>
      </div>
    </div>
  );
}