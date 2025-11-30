// src/app/become-controller/page.tsx
"use client";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Footer from "~/components/footer";
import Header from "~/components/header";

export default function BecomeControllerPage() {
  const { user } = useUser();

  if (user?.publicMetadata.controller == true) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col bg-black p-8 text-white">
      <Header />
      <div className="flex flex-1 items-center justify-center">
        <div className="mx-auto max-w-xl py-12 text-center">
          <header className="mb-8">
            <h1 className="mb-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Become a{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Controller
              </span>
            </h1>
            <p className="text-xl text-gray-400">
              You must be a certified controller to access the flight boards.
            </p>
          </header>
          <main className="flex flex-col items-center gap-4">
            <p className="text-lg text-gray-300">
              If you are a controller and would like to manage a board, please
              message <span className="font-bold text-white">xyzmani</span> on
              Discord.
            </p>
            <p>
              <span className="text-gray-500">
                Want to file a flight instead?{" "}
              </span>
              <Link
                href={"file-flight"}
                className="text-gray-200 hover:text-white hover:underline"
              >
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
