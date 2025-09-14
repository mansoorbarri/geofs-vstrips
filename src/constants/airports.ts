export const airports = [
  { id: "WMKK", name: "Kuala Lumpur" },
  { id: "WSSS", name: "Singapore" },
  { id: "OPKC", name: "Karachi" },
  { id: "OPLA", name: "Lahore" },
] as const;

export type AirportCode = typeof airports[number]['id'];
export type Airport = typeof airports[number];