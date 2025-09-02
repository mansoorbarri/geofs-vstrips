import { BoardPageClient } from "~/components/board-page-client";

export default async function BoardPage({ params }: { params: Promise<{ airportName: string }> }) {
  // Await the params promise in Next.js 15
  const resolvedParams = await params;
  const airportName = decodeURIComponent(resolvedParams.airportName);
  
  return (
    // Render the client component, which will handle all the interactivity
    <BoardPageClient airportName={airportName} />
  );
}