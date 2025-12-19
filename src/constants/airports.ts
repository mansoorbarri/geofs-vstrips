export const airports = [
  { id: "HAAB", name: "Addis Ababa Bole International Airport" },
  { id: "NZAA", name: "Auckland Airport" },
  { id: "HECA", name: "Cairo International Airport" },
  { id: "FACT", name: "Cape Town International Airport" },
  { id: "LFPG", name: "Charles de Gaulle Airport" },
  { id: "VABB", name: "Chhatrapati Shivaji Maharaj International Airport" },
  { id: "OMDB", name: "Dubai International Airport" },
  { id: "EDDF", name: "Frankfurt Airport" },
  { id: "VGHS", name: "Hazrat Shahjalal International Airport" },
  { id: "VHHH", name: "Hong Kong International Airport" },
  { id: "LTFM", name: "Istanbul Airport" },
  { id: "HKJK", name: "Jomo Kenyatta International Airport" },
  { id: "KJFK", name: "John F. Kennedy International Airport" },
  { id: "OEJN", name: "King Abdulaziz International Airport" },
  { id: "EGLL", name: "London Heathrow Airport" },
  { id: "DNMM", name: "Murtala Muhammed International Airport" },
  { id: "VQPR", name: "Paro International Airport" },
  { id: "YPPH", name: "Perth Airport" },
  { id: "SBGL", name: "Rio de Janeiro/Galeão International Airport" },
  { id: "KSFO", name: "San Francisco International Airport" },
  { id: "WSSS", name: "Singapore Changi Airport" },
  { id: "YSSY", name: "Sydney Kingsford Smith Airport" },
  { id: "CYYZ", name: "Toronto Pearson International Airport" },
] as const;

export type AirportCode = (typeof airports)[number]["id"];
export type Airport = (typeof airports)[number];