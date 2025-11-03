// src/app/file-flight/page.tsx
import { FileFlightForm } from "~/components/file-flight-form";
import Footer from "~/components/footer";
import Header from "~/components/header";

export default function FileFlightPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <FileFlightForm />
      </main>
      <Footer />
    </div>
  );
}