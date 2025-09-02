// src/components/password-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    // Redirect the user to the home page with the password in the URL.
    // The home page will now handle the validation.
    router.push(`/?password=${password}`);
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-blue-600 text-white hover:bg-blue-700 hover:cursor-pointer"
        >
          Access Boards
        </Button>
      </form>
    </div>
  );
}