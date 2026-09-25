const IST = "Asia/Kolkata";

const asText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

// "2026-09-21" (the calendar day in India) from a date or ISO string.
// Using India time avoids the day shifting for dates stored as midnight IST.
export const getDateKey = (value: unknown): string => {
  if (!value) return "";

  const text = String(value);

  const date = new Date(text);

  if (isNaN(date.getTime())) return text.split("T")[0];

  return date.toLocaleDateString("en-CA", { timeZone: IST });
};

// "21 Sep 2026"
export const formatShowDate = (value: unknown): string => {
  if (!value) return "";

  const date = new Date(value as any);

  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: IST,
  });
};

// "18:30" -> "6:30 PM". Text that is already formatted is left as it is.
export const formatClock = (value: unknown): string => {
  if (!value) return "";

  const text = String(value).trim();

  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(text);

  if (match) {
    const hours = Number(match[1]);

    return `${hours % 12 || 12}:${match[2]} ${hours >= 12 ? "PM" : "AM"}`;
  }

  // "10:00 am" -> "10:00 AM"
  const ampm = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(text);

  if (ampm) return `${Number(ampm[1])}:${ampm[2]} ${ampm[3].toUpperCase()}`;

  // Full date-time string, e.g. 2026-09-21T13:00:00Z
  const date = new Date(text);

  if (text.includes("T") && !isNaN(date.getTime())) {
    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: IST,
    });
  }

  return text;
};

// Minutes since midnight, used to sort showtimes ("18:30" or "6:30 PM")
export const clockToMinutes = (value: unknown): number => {
  const text = String(value ?? "")
    .trim()
    .toUpperCase();

  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/.exec(text);

  if (!match) return Number.MAX_SAFE_INTEGER;

  let hours = Number(match[1]);

  if (match[3] === "PM" && hours < 12) hours += 12;

  if (match[3] === "AM" && hours === 12) hours = 0;

  return hours * 60 + Number(match[2]);
};

// "21 Sep 2026, 6:30 PM - 9:00 PM" from a showtime object
export const formatShowSlot = (showtime: any): string => {
  if (!showtime) return "";

  const date = formatShowDate(showtime.showDate ?? showtime.date);

  const start = formatClock(showtime.startTime ?? showtime.showTime ?? showtime.time);

  const end = formatClock(showtime.endTime);

  const time = start && end ? `${start} - ${end}` : start;

  return [date, time].filter(Boolean).join(", ");
};

// "Screen 2" stays "Screen 2"; "2" becomes "Screen 2"
export const formatScreen = (value: unknown): string => {
  const text = typeof value === "number" ? String(value) : asText(value);

  if (!text) return "";

  return /^screen/i.test(text) ? text : `Screen ${text}`;
};

// The theater's "location" field (used for the city filter)
export const getTheaterPlace = (theater: any): string => {
  if (!theater || typeof theater !== "object") return "";

  return asText(theater.location);
};

// "Address, Location" from a populated theater (duplicates removed)
export const formatTheaterLocation = (theater: any): string => {
  if (!theater || typeof theater !== "object") return "";

  const parts: string[] = [];

  [theater.address, theater.location, theater.city].forEach((value) => {
    const text = asText(value);

    if (
      text &&
      !parts.some((part) => part.toLowerCase().includes(text.toLowerCase()))
    ) {
      parts.push(text);
    }
  });

  return parts.join(", ");
};
