export interface ExternalAirport {
  icao: string;
  name: string;
}

export async function searchGlobalAirports(query: string): Promise<ExternalAirport[]> {
  if (query.length < 2) return [];
  
  const res = await fetch("https://raw.githubusercontent.com/mwgg/Airports/master/airports.json");
  const data = await res.json();
  
  const results = Object.values(data)
    .filter((ap: any) => 
      ap.icao?.toLowerCase().includes(query.toLowerCase()) || 
      ap.name?.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 10); // Only return top 10 for speed

  return results.map((ap: any) => ({
    icao: ap.icao,
    name: ap.name
  }));
}