export const airports = [
  { id: "OMDB", name: "Dubai International Airport" }
] as const;

export type AirportCode = (typeof airports)[number]["id"];
export type Airport = (typeof airports)[number];