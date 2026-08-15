// -----------------------------------------------------------------------------
// Opening hours — pure display helpers (no I/O).
//
// The OpeningHours table stores one slot per (dayOfWeek, type), where type is
// "restaurant" or "delivery". dayOfWeek follows Date.getDay(): 0 = Sunday ..
// 6 = Saturday. Times are 24-hour "HH:mm" strings derived from Postgres TIME
// columns. Everything here is pure so it can run on the client and server and
// be unit-tested without a database.
// -----------------------------------------------------------------------------

export type OpeningHourLike = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

export const DAY_ABBR: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DAY_LETTERS: string[] = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Display order for week-based labels/JSON-LD: Monday first, then Sunday.
export const MON_FIRST_DAYS: number[] = [1, 2, 3, 4, 5, 6, 0];

function hourParts(hhmm: string): { hour12: number; minute: string; period: string } {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour12, minute: String(m).padStart(2, "0"), period };
}

/** "16:00" -> "4 PM"; "16:30" -> "4:30 PM" (minutes omitted when :00). */
export function formatHour12Short(hhmm: string): string {
  const { hour12, minute, period } = hourParts(hhmm);
  return minute === "00" ? `${hour12} ${period}` : `${hour12}:${minute} ${period}`;
}

/** "16:00" -> "4:00 PM"; "16:30" -> "4:30 PM" (minutes always shown). */
export function formatHour12Long(hhmm: string): string {
  const { hour12, minute, period } = hourParts(hhmm);
  return `${hour12}:${minute} ${period}`;
}

export function openSlots(slots: OpeningHourLike[]): OpeningHourLike[] {
  return slots
    .filter((s) => !s.isClosed)
    .slice()
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

/** "4 PM – 4 AM" (short) or "4:00 PM – 4:00 AM" (long). "Closed" when none open. */
export function hoursRange(slots: OpeningHourLike[], long = false): string {
  const open = openSlots(slots);
  if (open.length === 0) return "Closed";
  const f = long ? formatHour12Long : formatHour12Short;
  return `${f(open[0].openTime)} – ${f(open[0].closeTime)}`;
}

/** Close time only, e.g. "2 AM". "Closed" when none open. */
export function hoursClose(slots: OpeningHourLike[], long = false): string {
  const open = openSlots(slots);
  if (open.length === 0) return "Closed";
  const f = long ? formatHour12Long : formatHour12Short;
  return f(open[0].closeTime);
}

/** "HH:mm" -> minutes since midnight. */
function minutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Karachi is UTC+5 with no DST. The table stores wall-clock times in Pakistan
// local time, so convert "now" to Karachi wall time (via a UTC-shifted Date)
// before comparing. This is deterministic and dependency-free.
const KARACHI_OFFSET_MS = 5 * 60 * 60 * 1000;

function karachiWallTime(now: Date): { dayOfWeek: number; minutes: number } {
  const t = new Date(now.getTime() + KARACHI_OFFSET_MS);
  return { dayOfWeek: t.getUTCDay(), minutes: t.getUTCHours() * 60 + t.getUTCMinutes() };
}

function slotOpenAt(slot: OpeningHourLike, dayOfWeek: number, minutes: number): boolean {
  if (slot.isClosed) return false;
  const open = minutesOfDay(slot.openTime);
  const close = minutesOfDay(slot.closeTime);
  const overnight = close <= open;
  if (slot.dayOfWeek === dayOfWeek) {
    // Overnight slot (16:00-04:00): open from openTime until midnight today…
    if (overnight) return minutes >= open;
    // Same-day slot (11:00-23:00): open within the window.
    return minutes >= open && minutes < close;
  }
  // …and continues past midnight into the next day until closeTime.
  if (overnight && slot.dayOfWeek === wrapDay(dayOfWeek - 1)) {
    return minutes < close;
  }
  return false;
}

/**
 * Whether the restaurant is open right now (in Karachi local time), given the
 * day's slots. Handles overnight slots that cross midnight. Used only for
 * client-side "Open now / Closed now" badges — never rendered on the server so
 * hydration stays deterministic.
 */
export function isOpenNow(slots: OpeningHourLike[], now: Date = new Date()): boolean {
  const { dayOfWeek, minutes } = karachiWallTime(now);
  return slots.some((slot) => slotOpenAt(slot, dayOfWeek, minutes));
}

/** "Daily", a day-range label like "Mon–Fri", or "" when everything is closed. */
export function hoursFrequencyLabel(slots: OpeningHourLike[]): string {
  const open = openSlots(slots);
  if (open.length === 7) return "Daily";
  if (open.length === 0) return "";
  return dayRangeLabel(open.map((s) => s.dayOfWeek));
}

function wrapDay(d: number): number {
  return d < 0 ? d + 7 : d;
}

function orderDays(days: number[]): number[] {
  return [...new Set(days)].sort((a, b) => MON_FIRST_DAYS.indexOf(a) - MON_FIRST_DAYS.indexOf(b));
}

/**
 * Groups day numbers into consecutive ranges (Monday-first), e.g.
 * [1,2,3,4,5] -> "Mon–Fri", [6,0] -> "Sat–Sun", [1,6,0] -> "Mon, Sat–Sun".
 */
export function dayRangeLabel(days: number[], names: string[] = DAY_ABBR): string {
  const ordered = orderDays(days);
  const ranges: number[][] = [];
  for (const d of ordered) {
    const last = ranges[ranges.length - 1];
    if (last && last[last.length - 1] === wrapDay(d - 1)) {
      last.push(d);
    } else {
      ranges.push([d]);
    }
  }
  return ranges
    .map((r) => (r.length === 1 ? names[r[0]] : `${names[r[0]]}–${names[r[r.length - 1]]}`))
    .join(", ");
}

/**
 * schema.org `openingHours` value built from DB slots, e.g. "Mo-Su 16:00-04:00"
 * or "Mo-Fr 16:00-04:00, Sa 17:00-05:00". Returns "" when nothing is open.
 */
export function buildOpeningHoursLd(slots: OpeningHourLike[]): string {
  const byDay = new Map(slots.map((s) => [s.dayOfWeek, s]));
  const combos: { key: string; days: number[] }[] = [];
  for (const d of MON_FIRST_DAYS) {
    const slot = byDay.get(d);
    if (!slot || slot.isClosed) continue;
    const key = `${slot.openTime}-${slot.closeTime}`;
    const existing = combos.find((c) => c.key === key);
    if (existing) existing.days.push(d);
    else combos.push({ key, days: [d] });
  }
  return combos
    .map((c) => {
      const [open, close] = c.key.split("-");
      return `${dayRangeLabel(c.days, DAY_LETTERS).replace(/–/g, "-")} ${open}-${close}`;
    })
    .join(", ");
}
