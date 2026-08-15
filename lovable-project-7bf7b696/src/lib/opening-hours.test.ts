import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildOpeningHoursLd,
  dayRangeLabel,
  formatHour12Long,
  formatHour12Short,
  hoursClose,
  hoursFrequencyLabel,
  hoursRange,
  isOpenNow,
  type OpeningHourLike,
} from "./opening-hours";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function slots(
  type: "restaurant" | "delivery",
  openTime: string,
  closeTime: string,
  days: number[] = ALL_DAYS,
  closedDays: number[] = [],
): OpeningHourLike[] {
  return ALL_DAYS.map((dayOfWeek) => ({
    dayOfWeek,
    type,
    openTime,
    closeTime,
    isClosed: closedDays.includes(dayOfWeek),
  })).filter((s) => days.includes(s.dayOfWeek));
}

describe("formatHour12Short", () => {
  it("omits :00 minutes", () => {
    assert.equal(formatHour12Short("16:00"), "4 PM");
    assert.equal(formatHour12Short("02:00"), "2 AM");
    assert.equal(formatHour12Short("00:00"), "12 AM");
    assert.equal(formatHour12Short("12:00"), "12 PM");
  });

  it("shows minutes when non-zero", () => {
    assert.equal(formatHour12Short("16:30"), "4:30 PM");
    assert.equal(formatHour12Short("09:05"), "9:05 AM");
  });
});

describe("formatHour12Long", () => {
  it("always shows minutes", () => {
    assert.equal(formatHour12Long("16:00"), "4:00 PM");
    assert.equal(formatHour12Long("04:00"), "4:00 AM");
    assert.equal(formatHour12Long("16:30"), "4:30 PM");
  });
});

describe("hoursRange / hoursClose / hoursFrequencyLabel", () => {
  const restaurant = slots("restaurant", "16:00", "04:00");

  it("formats the default uniform week in 12-hour form", () => {
    assert.equal(hoursRange(restaurant, false), "4 PM – 4 AM");
    assert.equal(hoursRange(restaurant, true), "4:00 PM – 4:00 AM");
  });

  it("returns Closed when no day is open", () => {
    const allClosed = slots("restaurant", "16:00", "04:00", ALL_DAYS, ALL_DAYS);
    assert.equal(hoursRange(allClosed), "Closed");
    assert.equal(hoursClose(allClosed), "Closed");
    assert.equal(hoursFrequencyLabel(allClosed), "");
  });

  it("reports delivery close time only", () => {
    const delivery = slots("delivery", "16:00", "02:00");
    assert.equal(hoursClose(delivery, false), "2 AM");
  });

  it("uses the first open day when days differ", () => {
    const mixed = slots("restaurant", "16:00", "04:00");
    assert.equal(hoursRange(mixed, false), "4 PM – 4 AM");
  });

  it("labels a full week Daily", () => {
    assert.equal(hoursFrequencyLabel(restaurant), "Daily");
  });

  it("labels a closed day", () => {
    const closedSunday = slots("restaurant", "16:00", "04:00", ALL_DAYS, [0]);
    assert.equal(hoursFrequencyLabel(closedSunday), "Mon–Sat");
  });
});

describe("dayRangeLabel", () => {
  it("groups consecutive days", () => {
    assert.equal(dayRangeLabel([1, 2, 3, 4, 5]), "Mon–Fri");
    assert.equal(dayRangeLabel([6, 0]), "Sat–Sun");
  });

  it("separates non-consecutive days", () => {
    assert.equal(dayRangeLabel([1, 3, 5]), "Mon, Wed, Fri");
  });

  it("wraps Saturday into Sunday", () => {
    assert.equal(dayRangeLabel([5, 6, 0]), "Fri–Sun");
  });
});

describe("isOpenNow", () => {
  // Helper: build a Date in Karachi wall time (UTC+5).
  const karachiDate = (dayOfWeek: number, hhmm: string): Date => {
    const [h, m] = hhmm.split(":").map(Number);
    // 2026-08-02 is a Sunday in UTC; the Date is stored in UTC so the
    // Karachi-shifted wall clock lands on the requested weekday + time.
    const epoch = Date.UTC(2026, 7, 2) - 5 * 3600 * 1000 + dayOfWeek * 86400 * 1000;
    return new Date(epoch + h * 3600 * 1000 + m * 60 * 1000);
  };

  const overnight = slots("restaurant", "16:00", "04:00"); // opens 4 PM, closes 4 AM next day
  const sameDay = slots("restaurant", "11:00", "23:00");

  it("is open before midnight within an overnight slot", () => {
    assert.equal(isOpenNow(overnight, karachiDate(1, "21:30")), true);
  });

  it("is closed before the overnight slot opens", () => {
    assert.equal(isOpenNow(overnight, karachiDate(1, "10:00")), false);
  });

  it("stays open past midnight into the next day", () => {
    assert.equal(isOpenNow(overnight, karachiDate(2, "01:30")), true);
  });

  it("closes after the overnight window ends", () => {
    assert.equal(isOpenNow(overnight, karachiDate(2, "05:00")), false);
  });

  it("handles same-day slots with a closing time", () => {
    assert.equal(isOpenNow(sameDay, karachiDate(3, "12:00")), true);
    assert.equal(isOpenNow(sameDay, karachiDate(3, "23:30")), false);
  });

  it("respects per-day closed flags", () => {
    const closedSunday = slots("restaurant", "16:00", "04:00", ALL_DAYS, [0]);
    assert.equal(isOpenNow(closedSunday, karachiDate(0, "20:00")), false);
    assert.equal(isOpenNow(closedSunday, karachiDate(1, "20:00")), true);
  });

  it("returns false for an empty set", () => {
    assert.equal(isOpenNow([]), false);
  });
});

describe("buildOpeningHoursLd", () => {
  it("produces the seeded all-week value", () => {
    const restaurant = slots("restaurant", "16:00", "04:00");
    assert.equal(buildOpeningHoursLd(restaurant), "Mo-Su 16:00-04:00");
  });

  it("groups weekday and weekend differences", () => {
    const weekdays = slots("restaurant", "16:00", "04:00", [1, 2, 3, 4, 5]);
    const weekend = slots("restaurant", "17:00", "05:00", [6, 0]);
    assert.equal(
      buildOpeningHoursLd([...weekdays, ...weekend]),
      "Mo-Fr 16:00-04:00, Sa-Su 17:00-05:00",
    );
  });

  it("returns empty when everything is closed", () => {
    const allClosed = slots("restaurant", "16:00", "04:00", ALL_DAYS, ALL_DAYS);
    assert.equal(buildOpeningHoursLd(allClosed), "");
  });
});
