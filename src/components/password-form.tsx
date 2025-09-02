// src/components/password-form.tsx
"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { loginAction } from "~/app/gate/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full bg-blue-600 text-white hover:bg-blue-700 hover:cursor-pointer"
      disabled={pending}
    >
      {pending ? "Accessing..." : "Access Boards"}
    </Button>
  );
}

export function PasswordForm() {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (formData: FormData) => {
    const result = await loginAction(formData);
    if (result && result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-sm bg-gray-900 rounded-lg shadow-xl text-white">
      <h1 className="text-3xl font-bold mb-4 text-center">ATC Dashboard</h1>
      <p className="text-gray-400 mb-6 text-center">
        Enter password to access the ATC boards.
      </p>

      {error && (
        <Alert variant="destructive" className="bg-red-900 border-red-600 mb-4">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <form action={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}