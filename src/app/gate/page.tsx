// src/app/gate/page.tsx
import { PasswordForm } from "~/components/password-form";

export default function PasswordEntryPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <PasswordForm />
    </main>
  );
}