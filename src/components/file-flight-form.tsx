// src/components/file-flight-form.tsx
"use client";

import { useFormStatus } from "react-dom";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useMemo, useState } from "react";
import { createFlightAction } from "~/app/file-flight/actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="w-full bg-blue-600 text-white hover:bg-blue-700 hover:cursor-pointer"
      disabled={pending}
    >
      {pending ? "Submitting..." : "File Flight Plan"}
    </Button>
  );
}

export function FileFlightForm() {
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const formFields = useMemo(() => [
    { name: "callsign", label: "Callsign", placeholder: "e.g., DAL123" },
    { name: "aircraft_type", label: "Aircraft Type", placeholder: "e.g., A320" },
    { name: "departure", label: "Departure Airport", placeholder: "e.g., KLAX" },
    { name: "arrival", label: "Arrival Airport", placeholder: "e.g., KJFK" },
    { name: "altitude", label: "Altitude", placeholder: "e.g., 35000" },
    { name: "speed", label: "Speed", placeholder: "e.g., 420" },
    { name: "airport_atc", label: "Airport for ATC", placeholder: "e.g., KJFK" },
  ], []);

  const handleAction = async (formData: FormData) => {
    const result = await createFlightAction(formData);
    setSubmissionResult(result);
  };

  if (submissionResult?.success) {
    return (
      <div className="container mx-auto p-6 max-w-lg bg-gray-900 rounded-lg shadow-xl text-white text-center">
        <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
        <h1 className="text-3xl font-bold mb-4">Flight Filed!</h1>
        <p className="text-lg text-gray-300 mb-6">
          {submissionResult.message}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-lg bg-gray-900 rounded-lg shadow-xl text-white">
      <div className="flex justify-between items-center mb-6">
        <Link href="/" passHref>
          <Button variant="outline" className="bg-black border-gray-700 text-gray-400 hover:bg-gray-800 hover:cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold flex-grow text-center">File a Flight Plan</h1>
        <div className="w-[100px]" />
      </div>
      
      {submissionResult?.success === false && (
        <Alert variant="destructive" className="bg-red-900 border-red-600 mb-4">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="text-red-200">
            {submissionResult.message}
          </AlertDescription>
        </Alert>
      )}

      <form action={handleAction} className="space-y-4">
        {formFields.map(({ name, label, placeholder }) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <Input
              id={name}
              name={name}
              type="text"
              placeholder={placeholder}
              required
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        ))}
        
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Additional information"
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}