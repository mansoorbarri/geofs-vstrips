// app/components/SessionManager.tsx
"use client";

import { useEffect, useRef } from "react";
import { useClerk, useUser } from "@clerk/nextjs";

export default function SessionManager() {
  // Get the current user and Clerk instance
  const { user } = useUser();
  const { signOut } = useClerk();

  // We use a ref to store the timeout to prevent re-creation on every render
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if the user is a "controller"
    const isController = user?.publicMetadata?.controller === true;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (user && !isController) {
      // If the user is a regular user, set a 5-minute sign-out timer
      const timeoutMinutes = 5;
      const timeoutMilliseconds = timeoutMinutes * 60 * 1000;

      timeoutRef.current = setTimeout(() => {
        console.log("User session timed out. Signing out...");
        void signOut({ redirectUrl: "/sign-up" });
      }, timeoutMilliseconds);
    } else if (user && isController) {
      // If the user is a controller, their session is managed by Clerk's longer setting.
      // You don't need to do anything here, but you can add a log for clarity.
      console.log("Controller user detected. Session will last for a day.");
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user, signOut]);

  // This component doesn't render any UI
  return null;
}
