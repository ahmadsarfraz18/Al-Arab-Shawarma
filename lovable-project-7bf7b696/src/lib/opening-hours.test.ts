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
