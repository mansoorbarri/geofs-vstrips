export const airports = [
  { id: "EDDF", name: "Frankfurt Main Airport" },
] as const;

export type AirportCode = typeof airports[number]['id'];
export type Airport = typeof airports[number];