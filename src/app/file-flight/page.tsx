// src/app/file-flight/page.tsx
import { FileFlightForm } from "~/components/file-flight-form";
import Footer from "~/components/footer";
import Header from "~/components/header";

export default function FileFlightPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black p-6 text-white">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <FileFlightForm />
      </main>
      <Footer />
    </div>
  );
}
