// src/app/become-controller/page.tsx
import Link from "next/link";

export default function BecomeControllerPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
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
          <p className="text-sm text-gray-500 mt-4">
            {"Don't have an account? "}<Link href="/sign-up" className="text-blue-400 hover:underline">Sign up here</Link>.
          </p>
        </main>
      </div>
    </div>
  );
}