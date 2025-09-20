export const airports = [
  { id: "OPLA", name: "Lahore" },
  { id: "OPKC", name: "karachi"}
] as const;

export type AirportCode = typeof airports[number]['id'];
export type Airport = typeof airports[number];