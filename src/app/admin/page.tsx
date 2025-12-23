import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "~/components/admin-dashboard-client";

export default async function AdminDashboardPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/sign-up");
  }

  const isAdmin = (sessionClaims?.publicMetadata as any)?.admin === true;

  if (!isAdmin) {
    redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  }

  return <AdminDashboardClient />;
}