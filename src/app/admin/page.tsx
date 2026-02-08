"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { AdminDashboardClient } from "~/components/admin-dashboard-client";
import Loading from "~/components/loading";
import { useCurrentUser } from "~/hooks/use-current-user";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user: convexUser, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-up");
    } else if (!isLoading && convexUser && !convexUser.isAdmin) {
      router.push("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    }
  }, [isLoaded, isSignedIn, isLoading, convexUser, router]);

  if (!isLoaded || !isSignedIn || isLoading || !convexUser?.isAdmin) {
    return <Loading />;
  }

  return <AdminDashboardClient />;
}
