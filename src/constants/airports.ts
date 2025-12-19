export const airports = [
  { id: "VGHS", name: "Hazrat Shahjalal International Airport" },
  { id: "VQPR", name: "Paro International Airport" },
  { id: "CYYZ", name: "Toronto Pearson International Airport" },
  { id: "DNMM", name: "Murtala Muhammed International Airport" },
  { id: "EDDF", name: "Frankfurt Airport" },
  { id: "EGLL", name: "London Heathrow Airport" },
  { id: "FACT", name: "Cape Town International Airport" },
  { id: "HAAB", name: "Addis Ababa Bole International Airport" },
  { id: "HECA", name: "Cairo International Airport" },
  { id: "HKJK", name: "Jomo Kenyatta International Airport" },
  { id: "KJFK", name: "John F. Kennedy International Airport" },
  { id: "KSFO", name: "San Francisco International Airport" },
  { id: "LFPG", name: "Charles de Gaulle Airport" },
  { id: "LTFM", name: "Istanbul Airport" },
  { id: "NZAA", name: "Auckland Airport" },
  { id: "OEJN", name: "King Abdulaziz International Airport" },
  { id: "SBGL", name: "Rio de Janeiro/Galeão International Airport" },
  { id: "VABB", name: "Chhatrapati Shivaji Maharaj International Airport" },
  { id: "VHHH", name: "Hong Kong International Airport" },
  { id: "WSSS", name: "Singapore Changi Airport" },
  { id: "YPPH", name: "Perth Airport" },
  { id: "YSSY", name: "Sydney Kingsford Smith Airport" },
] as const;

export type AirportCode = (typeof airports)[number]["id"];
export type Airport = (typeof airports)[number];