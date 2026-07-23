export type ControlledFilingRule = {
  airport: string;
  filesPerSlot: number;
  intervalMinutes: number;
  startTime: string;
  endTime: string;
  timeType: "ETD" | "ETA";
};

type ScheduledFlight = {
  airport: string;
  departure_time: string | null;
  _id?: string;
  id?: string;
};

export function normaliseEventTime(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 3 ? `0${digits}` : digits;
}

export function formatEventTime(value: string) {
  const time = normaliseEventTime(value);
  return time.length === 4 ? `${time.slice(0, 2)}:${time.slice(2)}Z` : value;
}

export function getFilingSlots(rule: ControlledFilingRule) {
  const start = Number(normaliseEventTime(rule.startTime));
  const end = Number(normaliseEventTime(rule.endTime));
  const interval = Math.max(1, Math.floor(rule.intervalMinutes));
  if (!Number.isInteger(start) || !Number.isInteger(end) || start > end)
    return [];

  const toMinutes = (time: number) =>
    Math.floor(time / 100) * 60 + (time % 100);
  const slots: string[] = [];
  for (
    let minute = toMinutes(start);
    minute <= toMinutes(end);
    minute += interval
  ) {
    slots.push(
      `${String(Math.floor(minute / 60)).padStart(2, "0")}${String(minute % 60).padStart(2, "0")}`,
    );
  }
  return slots;
}

export function getAvailableFilingSlots(
  rule: ControlledFilingRule,
  flights: ScheduledFlight[],
  excludeFlightId?: string,
) {
  const airport = rule.airport.toUpperCase();
  return getFilingSlots(rule).filter(
    (slot) =>
      flights.filter(
        (flight) =>
          (!excludeFlightId ||
            (flight._id !== excludeFlightId &&
              flight.id !== excludeFlightId)) &&
          flight.airport.toUpperCase() === airport &&
          normaliseEventTime(flight.departure_time ?? "") === slot,
      ).length < rule.filesPerSlot,
  );
}

export function getControlledFilingError(
  rule: ControlledFilingRule | undefined,
  flights: ScheduledFlight[],
  airport: string,
  departureTime: string,
  excludeFlightId?: string,
) {
  if (!rule)
    return `Flight filing is not available for ${airport.toUpperCase()}. Choose an airport with an available filing schedule.`;
  const available = getAvailableFilingSlots(rule, flights, excludeFlightId);
  if (available.length === 0)
    return `${rule.airport} has no ${rule.timeType} filing times left. Choose another airport or ask an admin to add capacity.`;
  const time = normaliseEventTime(departureTime);
  if (!getFilingSlots(rule).includes(time))
    return `Choose one of the available ${rule.timeType} times for ${rule.airport}.`;
  if (!available.includes(time))
    return `${formatEventTime(time)} ${rule.timeType} at ${rule.airport} is full. Choose another available time.`;
  return null;
}
