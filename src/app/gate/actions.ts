// src/app/gate/actions.ts
"use server";

import { cookies } from "next/headers";
import { env } from "~/env";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const password = formData.get("password");
  const dashboardPassword = env.DASHBOARD_PASSWORD;

  if (password === dashboardPassword) {
    // Remove the 'await' from the cookies() call
    (await
      // Remove the 'await' from the cookies() call
      cookies()).set({
      name: "auth_token",
      value: "authenticated",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    redirect("/");
  } else {
    return { error: "Incorrect password" };
  }
}