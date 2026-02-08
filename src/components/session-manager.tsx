// app/components/SessionManager.tsx
"use client";

import { useEffect, useRef } from "react";
import { useClerk } from "@clerk/nextjs";
import { useCurrentUser } from "~/hooks/use-current-user";

export default function SessionManager() {
  const { user: convexUser } = useCurrentUser();
  const { signOut } = useClerk();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const isController = convexUser?.isController === true;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (convexUser && !isController) {
      const timeoutMinutes = 5;
      const timeoutMilliseconds = timeoutMinutes * 60 * 1000;

      timeoutRef.current = setTimeout(() => {
        console.log("User session timed out. Signing out...");
        void signOut({ redirectUrl: "/sign-up" });
      }, timeoutMilliseconds);
    } else if (convexUser && isController) {
      console.log("Controller user detected. Session will last for a day.");
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [convexUser, signOut]);

  return null;
}
