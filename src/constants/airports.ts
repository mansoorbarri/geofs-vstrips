export const airports = [
  { id: "VECC", name: "Kolkata International Airport" },
  { id: "VOMM", name: "Chennai International Airport" },
] as const;

export type AirportCode = typeof airports[number]['id'];
export type Airport = typeof airports[number];