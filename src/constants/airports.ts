export const airports = [
  { id: "WIII", name: "Soekarno–Hatta International Airport" },
  { id: "WADD", name: "I Gusti Ngurah Rai International Airport" },
] as const;

export type AirportCode = (typeof airports)[number]["id"];
export type Airport = (typeof airports)[number];
