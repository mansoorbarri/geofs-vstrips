import { AllFlightsPageClient } from "~/components/all-flights";
import { Suspense } from "react";

export default function AllFlightsPage() {
  return (
    <Suspense>
      <AllFlightsPageClient />
    </Suspense>
  );
}