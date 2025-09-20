export const airports = [
  { id: "PHLI", name: "Lihue" }, 
  { id: "PHJR", name: "Kalaeloa" },
  { id: "PHNL", name: "Hanolulu" },
  { id: "PHOG", name: "Kahului" },
  { id: "PHKO", name: "Kohala" },
  { id: "PHTO", name: "Hilo"}
] as const;

export type AirportCode = typeof airports[number]['id'];
export type Airport = typeof airports[number];