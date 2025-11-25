export const airports = [
  { id: "MGGT", name: "La Aurora International Airport" },
  { id: "MHTG", name: "Huehuetenango Airport" },

] as const;

export type AirportCode = typeof airports[number]['id'];
export type Airport = typeof airports[number];