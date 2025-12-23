"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Header() {
  const [defaultAirportId, setDefaultAirportId] = useState<string>("");

  useEffect(() => {
    async function fetchDefaultAirport() {
      try {
        const response = await fetch("/api/admin/settings");
        if (response.ok) {
          const data = await response.json();
          const activeIds = data.activeAirports || [];
          if (activeIds.length > 0) {
            setDefaultAirportId(activeIds[0]);
          }
        }
      } catch (err) {
        console.error("Header failed to fetch airport settings:", err);
      }
    }
    void fetchDefaultAirport();
  }, []);

  return (
    <header className="w-full border-b border-gray-800">
      <div className="w-full py-2">
        <nav className="text-md flex items-center justify-center space-x-5">
          <Link
            href="/"
            className="bg-gradient-to-r from-blue-200 to-blue-500 bg-clip-text font-semibold text-transparent transition-all duration-300 hover:from-purple-500 hover:to-blue-400"
          >
            Boards
          </Link>
          <Link
            href="/file-flight"
            className="bg-gradient-to-r from-blue-200 to-blue-500 bg-clip-text font-semibold text-transparent transition-all duration-300 hover:from-purple-500 hover:to-blue-400"
          >
            File Flight
          </Link>
          <Link
            href="/edit-flight"
            className="bg-gradient-to-r from-blue-200 to-blue-500 bg-clip-text font-semibold text-transparent transition-all duration-300 hover:from-purple-500 hover:to-blue-400"
          >
            Edit Flight
          </Link>
          {defaultAirportId && (
            <Link
              href={`/fids/${defaultAirportId}`}
              className="bg-gradient-to-r from-blue-200 to-blue-500 bg-clip-text font-semibold text-transparent transition-all duration-300 hover:from-purple-500 hover:to-blue-400"
            >
              FIDs
            </Link>
          )}
          <Link
            href="/admin"
            className="bg-gradient-to-r from-blue-200 to-blue-500 bg-clip-text font-semibold text-transparent transition-all duration-300 hover:from-purple-500 hover:to-blue-400"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}