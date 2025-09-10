// src/app/file-flight/page.tsx
import { FileFlightForm } from "~/components/file-flight-form";
import Footer from "~/components/footer";

export default function FileFlightPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6">
      <main className="flex-1 flex items-center justify-center">
        <FileFlightForm />
      </main>
      <Footer />
    </div>
  );
}