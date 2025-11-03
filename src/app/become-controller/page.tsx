// src/app/become-controller/page.tsx
"use client";
import Link from "next/link";
import { useUser } from "@clerk/nextjs"
import { redirect } from "next/navigation";
import Footer from "~/components/footer";
import Header from "~/components/header";

export default function BecomeControllerPage() {
  const { user } = useUser();
  
  if (user?.publicMetadata.controller == true) {
    redirect("/");
  }
  
  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-xl mx-auto py-12 text-center">
          <header className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-2">
              Become a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Controller</span>
            </h1>
            <p className="text-xl text-gray-400">
              You must be a certified controller to access the flight boards.
            </p>
          </header>
          <main className="flex flex-col items-center gap-4">
            <p className="text-lg text-gray-300">
              If you are a controller and would like to manage a board, please message{" "}
              <span className="font-bold text-white">xyzmani</span> on Discord.
            </p>
            <p>
              <span className="text-gray-500">Want to file a flight instead? </span>
              <Link href={"file-flight"} className="text-gray-200 hover:text-white hover:underline">
                file a flight
              </Link>
            </p>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
