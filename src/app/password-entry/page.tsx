// src/app/password-entry/page.tsx
import { PasswordForm } from "~/components/password-form";

export default async function PasswordEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const airport = resolvedSearchParams.airport as string || "???";

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <PasswordForm />
    </main>
  );
}