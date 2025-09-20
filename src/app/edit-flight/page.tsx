// src/app/edit-flight/page.tsx
import { EditFlightForm } from "~/components/edit-flight";
import { FlightsList } from "~/components/list-flights"; 

interface EditFlightPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function EditFlightPage({ searchParams }: EditFlightPageProps) {

  const params = await searchParams;
  
  if (params.id) {
    return <EditFlightForm flightId={params.id} />;
  }
  
  return <FlightsList />;
}