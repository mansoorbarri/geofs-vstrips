export const airports = [
  { id: "LFTM", name: "Istanbul Atatürk Airport" },
  {id: "OLBA", name: "Beirut-Rafic Hariri International Airport"}
] as const;

export type AirportCode = typeof airports[number]['id'];
export type Airport = typeof airports[number];