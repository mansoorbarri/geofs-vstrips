export const airports = [
  { id: "VGHS", name: "Hazrat Shahjalal International Airport" },
  { id: "VQPR", name: "Paro International Airport" },
] as const;

export type AirportCode = (typeof airports)[number]["id"];
export type Airport = (typeof airports)[number];
