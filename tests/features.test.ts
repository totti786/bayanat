import { describe, it, expect } from "vitest";
import { convertMinor } from "@/lib/rates";
import { shadeScale, themeCss } from "@/lib/theme";

describe("convertMinor", () => {
  const rates = { AED: 3.67, USD: 1, EUR: 0.92, GBP: 0.79 };

  it("returns the amount unchanged for the same currency", () => {
    expect(convertMinor(100000, "AED", "AED", rates)).toBe(100000);
  });

  it("converts between currencies", () => {
    // 100 AED -> USD: 100 / 3.67 = 27.25 => 2725 cents
    expect(convertMinor(100000, "AED", "USD", rates)).toBe(27248);
  });

  it("returns null when a rate is missing", () => {
    expect(convertMinor(100000, "XXX", "USD", rates)).toBeNull();
  });
});

describe("theme", () => {
  it("builds a full shade scale with the accent at 500", () => {
    const scale = shadeScale("#2c6562");
    expect(scale["500"]).toBe("#2c6562");
    expect(scale["50"]).toBeDefined();
    expect(scale["950"]).toBeDefined();
    expect(Number.parseInt(scale["950"].slice(1, 3), 16)).toBeLessThan(
      Number.parseInt(scale["500"].slice(1, 3), 16)
    );
  });

  it("generates CSS overriding the brand variables", () => {
    const css = themeCss("#123456");
    expect(css).toContain("--color-brand-500: #123456;");
    expect(css).toContain(":root");
  });
});
