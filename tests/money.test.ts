import { describe, it, expect } from "vitest";
import { toMinor, fromMinor, roundCents } from "@/lib/money";
import { formatMoney, formatHijriDate, formatPercent } from "@/lib/format";

describe("money conversions", () => {
  it("defaults to 2 decimals", () => {
    expect(toMinor(12.5, "USD")).toBe(1250);
    expect(fromMinor(1250, "USD")).toBe(12.5);
  });

  it("supports 0-decimal currencies", () => {
    expect(toMinor(1000, "JPY")).toBe(1000);
    expect(fromMinor(1000, "JPY")).toBe(1000);
  });

  it("supports 3-decimal currencies", () => {
    expect(toMinor(1.25, "KWD")).toBe(1250);
    expect(fromMinor(1250, "KWD")).toBe(1.25);
  });

  it("rounds to nearest unit", () => {
    expect(toMinor(0.005, "USD")).toBe(1);
  });
});

describe("formatMoney", () => {
  it("formats minor units", () => {
    expect(formatMoney(105000, "AED", "en", "western")).toContain("1,050.00");
  });

  it("uses eastern digits for Arabic with eastern setting", () => {
    const out = formatMoney(105000, "AED", "ar", "eastern");
    expect(out).toContain("١٬٠٥٠");
  });

  it("keeps latin digits for Arabic with western setting", () => {
    const out = formatMoney(105000, "AED", "ar", "western");
    expect(out).toContain("1,050");
    expect(out).not.toContain("١٬٠٥٠");
  });
});

describe("dates", () => {
  it("formats hijri with eastern numerals", () => {
    const out = formatHijriDate(new Date("2026-08-07T12:00:00Z"), "ar", "eastern");
    expect(out).toMatch(/١٤٤[٧٨]/); // 1447/1448 AH era
  });

  it("respects western numerals for hijri", () => {
    const out = formatHijriDate(new Date("2026-08-07T12:00:00Z"), "en", "western");
    expect(out).toMatch(/144[78]/);
  });
});

describe("formatPercent", () => {
  it("eastern digits in Arabic", () => {
    expect(formatPercent(5, "ar", "eastern")).toBe("٥%");
  });
  it("western digits in English", () => {
    expect(formatPercent(5, "en", "western")).toBe("5%");
  });
});

describe("roundCents", () => {
  it("rounds to two places", () => {
    expect(roundCents(1.005)).toBe(1.01);
  });
});
