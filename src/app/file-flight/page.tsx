// src/app/file-flight/page.tsx
import { FileFlightForm } from "~/components/file-flight-form";

export default function FileFlightPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <FileFlightForm />
    </main>
  );
}