import { describe, it, expect } from "vitest";
import { effectiveStatus } from "@/lib/status";

type Status = "draft" | "sent" | "paid" | "cancelled";

const inv = (status: Status, dueDays: number | null = null, kind: "invoice" | "quote" = "invoice") => ({
  status,
  kind,
  dueDate: dueDays === null ? null : new Date(Date.now() + dueDays * 86400000),
});

describe("effectiveStatus", () => {
  it("quotes never age into overdue", () => {
    expect(effectiveStatus(inv("sent", -30, "quote"), 0, 100)).toBe("sent");
  });
  it("draft stays draft", () => {
    expect(effectiveStatus(inv("draft"), 0, 100)).toBe("draft");
  });

  it("cancelled stays cancelled", () => {
    expect(effectiveStatus(inv("cancelled"), 0, 100)).toBe("cancelled");
  });

  it("fully paid overrides overdue", () => {
    expect(effectiveStatus(inv("sent", -30), 100, 100)).toBe("paid");
  });

  it("unpaid and past due is overdue", () => {
    expect(effectiveStatus(inv("sent", -1), 0, 100)).toBe("overdue");
  });

  it("unpaid and future due is sent", () => {
    expect(effectiveStatus(inv("sent", 10), 0, 100)).toBe("sent");
  });

  it("partial payment is partially_paid", () => {
    expect(effectiveStatus(inv("sent", 10), 40, 100)).toBe("partially_paid");
  });

  it("due today is not overdue", () => {
    expect(effectiveStatus(inv("sent", 0), 0, 100)).toBe("sent");
  });
});
